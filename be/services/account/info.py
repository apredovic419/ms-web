import asyncio
import random
import time
from datetime import datetime

import aiofiles

from component.cache import ARLock, Cache
from services.constant import checkin_items
from models.game import Character, Gift, InvItem, User
from models.serializers.v1 import CharInfo, InvItemModel
from services.account.smtp import SMTPService
from services.community.library import LibraryService, WzData
from services.rpc.service import MagicService


class UserError(Exception):
    def __init__(self, message: str, status: int):
        self.message = message
        self.status = status


class UserService:
    _char_list = list(range(48, 58)) + list(range(65, 91))

    def __init__(self, user: User):
        self.user = user

    async def sync_from_db(self):
        if not self.user.id:
            user = await User.filter(name=self.user.name).first()
            # 把user的属性赋值给self.user
            if user:
                self.user.__dict__.update(user.__dict__)

    async def user_info(self) -> User:
        await self.sync_from_db()
        return self.user

    async def update_password(self, origin: str, new: str):
        await self.sync_from_db()
        code = await User.check_password(self.user.name, origin)
        if code == -1:
            raise UserError("用户不存在", 401)
        elif code == 0:
            raise UserError("密码错误", 401)
        await User.filter(name=self.user.name).update(password=User.create_password(new))

    @staticmethod
    async def random_checkin_item(wz_service: LibraryService) -> WzData:
        while True:
            _key = random.choice(list(checkin_items.keys()))
            item = random.choice(checkin_items[_key])
            wz_data = await wz_service.fetch_item(item)
            if wz_data and wz_data.name:
                return wz_data

    async def checkin(self, cache: Cache, rpc: MagicService, character_id: int, item: WzData):
        await self.sync_from_db()
        char = await Character.filter(accountid=self.user.id, id=character_id).first()
        if not char:
            raise UserError("角色信息异常", 401)
        lock_key = f"checkin:lock:{self.user.id}"
        async with ARLock(cache, lock_key, 0.25, 10) as lock:
            if not lock.locked:
                raise UserError("系统繁忙，请稍后再试", 403)
            checkin_key = f"checkin:{datetime.now().date()}"
            value: dict = await cache.get(checkin_key, default={})
            if self.user.name in value:
                raise UserError("你今天似乎签过到了?", 401)
            value[self.user.name] = {
                "item": item.id,
                "name": item.name,
                "user": char.name,
                "time": time.time(),
            }
            await Gift.create(
                to=char.id,
                sn=item.id,
                _from="签到管理员",
                message="签到礼物\n",
                ring=-1,
            )
            await cache.set(checkin_key, value, ex=60 * 60 * 24 * 7)
            if rpc.enabled:
                task = rpc.send_char_message(char.name, f"[签到系统] 你获得了道具 {item.name} ！")
                _ = asyncio.create_task(task)

    @classmethod
    def generate_captcha(cls) -> str:
        return "".join(map(lambda x: chr(x), random.choices(cls._char_list, k=6)))

    @staticmethod
    def captcha_key(username):
        return f"reset:{username}:captcha"

    async def send_reset_code(self, smtp: SMTPService, cache: Cache, domain: str, captcha: str):
        """发送重置密码验证码

        :param smtp: SMTP服务
        :param cache: 缓存服务
        :param domain: 域名
        :param captcha: 验证码
        :return: 状态码
        """
        await self.sync_from_db()
        if not self.user.email:
            raise UserError("您的账号没有设置电子邮箱，无法请求重置", 401)
        reset_link = f"{domain}/forgot?username={self.user.name}&code={captcha}"
        async with aiofiles.open("templates/reset-password.html") as f:
            html = await f.read()
            html = html.format(fmt_reset_link=reset_link, fmt_captcha_code=captcha)
        await smtp.send_mime(self.user.email, "MagicMS 魔力枫之谷重置密码", html, "html")
        await cache.set(self.captcha_key(self.user.name), captcha, ex=600)

    @staticmethod
    async def reset_password(cache: Cache, username: str, password: str, captcha: str):
        captcha_key = UserService.captcha_key(username)
        server_captcha = await cache.get(captcha_key)
        if server_captcha != captcha:
            raise UserError("验证码错误", 403)
        password = User.create_password(password)
        await User.filter(name=username).update(password=password)
        await cache.set(UserService.captcha_key(username), None, px=1)

    async def ea(self) -> bool:
        """解卡"""
        c = await User.filter(name=self.user.name).exclude(loggedin=1).update(loggedin=1)
        return c > 0

    async def character_list(self) -> list[CharInfo]:
        await self.sync_from_db()
        items = []
        async for char in Character.filter(accountid=self.user.id):
            items.append(CharInfo.model_validate(char))
        return items

    async def character_info(self, character_id: int) -> CharInfo:
        await self.sync_from_db()
        char = await Character.filter(accountid=self.user.id, id=character_id).first()
        if not char:
            raise UserError("角色不存在", 404)
        return CharInfo.model_validate(char)

    async def character_items(self, character_id: int) -> list[InvItemModel]:
        await self.sync_from_db()
        char = await Character.filter(accountid=self.user.id, id=character_id).first()
        if not char:
            raise UserError("角色不存在", 404)
        item = await InvItem.filter(characterid=character_id)
        return [InvItemModel.model_validate(i) for i in item]
