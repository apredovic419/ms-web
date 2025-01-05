import time
from datetime import datetime, timedelta

import aiofiles

from component.cache import ARLock, Cache
from models.community import Invitation
from models.game import Character, User
from services.account.smtp import SMTPService


class InviteError(Exception):
    def __init__(self, message: str, status: int):
        self.message = message
        self.status = status


class InviteService:
    def __init__(self, cache: Cache, smtp: SMTPService):
        self.cache = cache.select("redis")
        self.smtp = smtp

    async def apply_invite(
        self,
        user: User,
        expire_day: int = 30,
        intervals: int = 60 * 60 * 24 * 45,
        nx: int = 10000,
    ) -> Invitation:
        if not user.email:
            raise InviteError("申请失败，账号未绑定邮箱", 403)
        levels = await Character.filter(accountid=user.id).values_list("level", flat=True)
        if not levels or max(levels) < 200:
            raise InviteError("申请失败，账号等级不满足要求", 403)
        lock_key = f"invite:apply_lock:{user.id}"
        async with ARLock(self.cache, lock_key, 0.25, 10) as lock:
            if not lock.locked:
                raise InviteError("系统繁忙，请稍后再试", 500)
            invite = await Invitation.filter(generate_id=user.id).order_by("-create_time").first()
            if invite and invite.create_time.timestamp() > time.time() - intervals:
                raise InviteError("申请失败，近期已经申请过邀请码", 403)
            invite = await Invitation.create(
                code=Invitation.random_code(),
                nx=nx,
                generate_id=user.id,
                expire_time=datetime.now() + timedelta(days=expire_day),
                note="API接口申请邀请码",
            )
            return invite

    async def send_invite(self, to_email: str, invite: Invitation):
        async with aiofiles.open("templates/invite-code.html") as f:
            html = await f.read()
            if invite.expire_time:
                expire = invite.expire_time.strftime("%Y-%m-%d %H:%M:%S")
            else:
                expire = "永久有效"
            html = html.format(fmt_expire_date=expire, fmt_invite_code=invite.code)
        await self.smtp.send_mime(to_email, "MagicMS 魔力枫之谷邀请码", html, "html")

    @staticmethod
    async def helper():
        async with aiofiles.open("asset/docs/invite.md") as f:
            return await f.read()
