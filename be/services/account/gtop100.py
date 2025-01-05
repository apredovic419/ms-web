import asyncio
from datetime import datetime, timedelta

from tortoise.expressions import F

from component.cache import ARLock, Cache
from component.logger import logger
from config import GTop100Config
from models.community import OperateLog
from models.game import User
from services.rpc.service import MagicService


class GTop100Error(Exception):
    def __init__(self, message: str, status: int):
        self.message = message
        self.status = status


class GTop100Service:
    reward_key = ":reward"
    lock_name = "GTop100:RWLock"

    def __init__(self, config: GTop100Config, cache: Cache, rpc: MagicService):
        self.config = config
        self.db = cache.select("redis")
        self.rpc = rpc

    def validate_callback(self, ip: str, data: dict) -> bool:
        if self.config.authorized and ip not in self.config.authorized:
            return False
        if data.get("Successful") != "0":
            return False
        if data.get("site_id") != self.config.site_id:
            return False
        return True

    async def offline_reward(self, user: User, reward: int):
        count = await User.filter(id=user.id, loggedin=0).update(nxPrepaid=F("nxPrepaid") + reward)
        if count == 0:  # 实际上账号在线 可能处于商城或/登录页面
            return await self.append_reward(user.name)
        logger.info(f"[投票正常] 离线账号: {user.name} 奖励点券: {reward}")
        await OperateLog.append_vote_log(user.id, user.name, reward)
        return True

    async def rpc_reward(self, user: User, reward: int):
        if char := await self.rpc.find_online_char_by_uid(user.id):
            char_info = await self.rpc.get_char_info(name=char.name)
            if not char_info:
                return await self.offline_reward(user, reward)
            initial = char_info.np
            msg = f"[投票奖励] 获得{reward}点券！连续投票会获得更多奖励哦！"
            result = await self.rpc.add_np(char.name, reward, msg)
            if not result.result:
                logger.warning(
                    f"[投票异常] 在线账号:{user.id} 角色:{char.name} " f"应发奖励:{reward} GRPC响应增加点券失败"
                )
                return await self.offline_reward(user, reward)
            char_info = await self.rpc.get_char_info(name=char.name)
            if char_info and (initial + reward) <= char_info.np:
                logger.info(
                    f"[投票正常] 在线账号:{user.id} 初始点券:{initial} 奖励点券:{reward} "
                    f"结果点券:{initial + reward} 实际点券:{char_info.np}"
                )
            else:
                logger.info(f"[投票正常] 在线账号:{user.id} 初始点券:{initial} 奖励点券:{reward}")
            await OperateLog.append_vote_log(user.id, user.name, reward)
            return True
        return False

    async def append_reward(self, username: str):
        """添加投票奖励
        :param: username 用户名
        """
        today = f"reward:{datetime.now().date()}"
        yesterday = f"reward:{(datetime.now() - timedelta(days=1)).date()}"
        user, reward_today = await asyncio.gather(
            User.filter(name=username).first(),
            self.db.get(today, default={}),
        )
        # 账号不存在或者今天已经获取过奖励，视为成功奖励
        if not user or username in reward_today:
            return True
        async with ARLock(self.db, self.lock_name, 10, 10) as lock:
            if not lock.locked:
                logger.warning(f"获取GTop100锁超时，追加投票账号失败: {username}")
                return False
            reward_today, reward_yesterday = await asyncio.gather(
                self.db.get(today, default={}),
                self.db.get(yesterday, default={}),
            )
            reward = reward_yesterday.get(username, self.config.reward)
            reward = max(reward, self.config.reward)
            if username in reward_yesterday:
                reward += self.config.accumulate
            limit = self.config.limit
            reward = limit if (limit and reward > limit) else reward
            if self.rpc.enabled:
                if not self.rpc_reward(user, reward):
                    return await self.offline_reward(user, reward)
            else:
                reward_list: list = await self.db.get(self.reward_key, default=list)
                reward_list.append(username)
                await self.db.set(self.reward_key, list(set(reward_list)))
            return True

    async def grant_reward(self):
        today = f"reward:{datetime.now().date()}"
        yesterday = f"reward:{(datetime.now() - timedelta(days=1)).date()}"
        async with ARLock(self.db, self.lock_name, acquire_timeout=1, lock_timeout=5) as lock:
            if not lock.locked:
                return
            reward_list, reward_today, reward_yesterday = await asyncio.gather(
                self.db.get(self.reward_key, default=[]),
                self.db.get(today, default={}),
                self.db.get(yesterday, default={}),
            )
            for index in range(len(reward_list) - 1, -1, -1):
                user = await User.filter(name=reward_list[index]).first()
                if not user:  # 找不到账号 清理并跳过
                    reward_list.pop(index)
                    continue
                if user.loggedin != 0:  # 账号在线 跳过
                    continue
                if user.name in reward_today:  # 今天已经获取过奖励
                    reward_list.pop(index)
                    continue
                reward = reward_yesterday.get(user.name, self.config.reward)
                reward = max(reward, self.config.reward)
                if user.name in reward_yesterday:  # 连续签到 给累加
                    reward += self.config.accumulate
                limit = self.config.limit
                reward = limit if (limit and reward > limit) else reward
                await User.add_nx(user.id, reward)
                await OperateLog.append_vote_log(user.id, user.name, reward)
                logger.info(f"[投票正常] 离线账号: {user.name} 奖励点券: {reward}")
                reward_today[user.name] = reward
                reward_list.pop(index)
            await self.db.set(today, reward_today, ex=60 * 60 * 24 * 7)
            await self.db.set(self.reward_key, reward_list)

    async def check_vote(self, username):
        """检查是否已经投票
        :param username: 用户名
        :return: 0 未投票 1 已投票 2 今日已投票
        """
        reward_list: list = await self.db.get(":reward", default=[])
        if username in reward_list:
            return 1
        today_reward = await self.db.get(f"reward::{datetime.now().date()}", {})
        if username in today_reward:
            return 2
        return 0

    async def vote_url(self, username: str) -> str:
        """投票
        :param username: 用户名
        """
        user = await User.filter(name=username).first()
        if not user:
            raise GTop100Error("账户不存在", 403)
        if user.banned == 1:
            raise GTop100Error("账户被封禁", 403)
        check_result = await self.check_vote(username)
        if check_result == 1:
            raise GTop100Error("您已经投过票了，请耐心等待发放奖励", 403)
        elif check_result == 2:
            raise GTop100Error("您今天已经获取过投票奖励了", 403)
        return f"{self.config.vote_url}&pingUsername={username}"
