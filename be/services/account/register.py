import random
from datetime import date, datetime
from typing import Optional, Union

import aiofiles
from httpx import AsyncClient
from tortoise import transactions

from component.cache import Cache
from config import Settings
from models.community import Invitation
from models.game import User
from services.account.smtp import SMTPService


class RegisterError(Exception):
    def __init__(self, message: str, status: int):
        self.message = message
        self.status = status


class RegisterService:
    _char_list = list(range(48, 58)) + list(range(65, 91))

    def __init__(self, http_client: AsyncClient, cache: Cache, config: Settings):
        self.httpx = http_client
        self.cache = cache
        self.config = config.reg_config

    @staticmethod
    async def email_banned(email: str) -> bool:
        return await User.filter(email=email, banned=1).exists()

    @staticmethod
    async def email_count_limit(email: str) -> bool:
        return await User.filter(email=email).count() > 2

    @classmethod
    def generate_captcha(cls) -> str:
        return "".join(map(lambda x: chr(x), random.choices(cls._char_list, k=6)))

    async def get_captcha(self, email: str) -> Optional[str]:
        """get the captcha code from cache"""
        return await self.cache.get(f"register:captcha:{email}")

    async def set_captcha(self, email, code: str = None) -> str:
        """设置验证码至缓存

        :param email:
        :param code: if passing is None, then automatically generate.
        """
        if code is None:
            code = self.generate_captcha()
        await self.cache.set(f"register:captcha:{email}", code, ex=86400)
        return code

    async def del_captcha(self, email: str) -> None:
        """delete the captcha code from cache"""
        await self.cache.delete(f"register:captcha:{email}")

    async def send_captcha(self, smtp: SMTPService, to_email: str, captcha: str):
        """send the captcha code to destination email address

        :param smtp: SMTPService
        :param to_email: 收件人
        :param captcha:
        :return: status code
        """
        async with aiofiles.open("templates/register-captcha.html") as f:
            html = await f.read()
            html = html.format(fmt_email_addr=to_email, fmt_captcha_code=captcha)
        await smtp.send_mime(to_email, "MagicMS 魔力枫之谷邮箱验证码", html, "html")

    async def verify_email_code(self, email: str, code: str) -> bool:
        """verify the captcha code"""
        serv_code = await self.get_captcha(email)
        return serv_code == code

    async def verify_re_captcha(self, captcha: str, ip: str = None) -> bool:
        """verify Google reCAPTCHA

        :param captcha:
        :param ip: user's ip address
        """
        payload = {"secret": self.config.recaptcha_secret, "response": captcha}
        if ip:
            payload["remoteip"] = ip
        try:
            r = await self.httpx.post(self.config.recaptcha_url, data=payload, timeout=10)
            data = r.json()
            return data.get("success") is True
        except:
            return False

    async def verify_invitation_code(self, invitation_code: str) -> str:
        """verify the invitation code
        """
        if self.config.force_invitation:
            if not invitation_code:
                return "当前邀请码为必填项"
            inv = await Invitation.filter(code=invitation_code).first()
            if not inv:
                return "无效的邀请码"
            if inv.register_id:
                return "邀请码已被使用"
            if inv.expire_time and datetime.now().timestamp() > inv.expire_time.timestamp():
                return "邀请码已过期"
        return ""

    @staticmethod
    async def register_account(
        name: str,
        email: str,
        password: str,
        birthday: Union[str, date],
        ip: str,
        invitation_code: Optional[str] = None,
    ) -> Optional[User]:
        async with transactions.in_transaction("web") as conn:
            if invitation_code:
                inv = (
                    await Invitation.filter(code=invitation_code, register_id=None)
                    .select_for_update()
                    .first()
                )
                if not inv:
                    return
            user = await User.create(
                user=name,
                password=password,
                email=email,
                birthday=birthday,
                tos=1,
                ip=ip,
                nxPrepaid=inv.nx if invitation_code else 0,
                createdat=datetime.now(),
            )
            if not user:
                conn.rollback()
                return
            inv.register_id = user.id
            inv.note = ((inv.note or "") + f"\n{datetime.now()} 注册账号: {user.name}").strip()
            await inv.save()
            return user
