import time
from typing import Literal, Optional, TypedDict
from uuid import uuid4

import jwt
from httpx import AsyncClient

from config import JwtAuth
from models.game import User


class JwtPayload(TypedDict):
    iat: int
    exp: int
    name: str
    jti: str
    type: Literal["access", "refresh"]


class AuthError(Exception):
    def __init__(self, message: str, status: int):
        self.message = message
        self.status = status


class AuthService:
    def __init__(self, config: JwtAuth):
        self.jwt_auth = config
        self.user: Optional[User] = None

    @classmethod
    def from_jwt(cls, jwt_auth: JwtAuth, token: str) -> Optional["AuthService"]:
        try:
            payload: JwtPayload = jwt.decode(
                token,
                key=jwt_auth.salt,
                algorithms=[jwt_auth.algorithm],
            )
        except jwt.PyJWTError:
            return
        if payload["type"] != "access":
            return
        if time.time() > payload["exp"]:
            return
        service = cls(jwt_auth)
        service.user = User(name=payload["name"])
        return service

    async def login(self, username: str, password: str):
        user = await User.filter(name=username).first()
        if not user:
            raise AuthError("错误的用户名或密码", 401)
        if (await User.check_password(username, password)) == 1:
            user = await User.filter(name=username).first()
            if user.banned == 1:
                raise AuthError("该账号已被封停!", 403)
            self.user = user
        else:
            raise AuthError("错误的用户名或密码", 401)

    def generate_access_token(self) -> tuple[str, int]:
        if not self.user:
            raise AuthError("用户未登录", 401)
        now = int(time.time())
        payload: JwtPayload = {
            "iat": now,
            "exp": now + self.jwt_auth.expiration,
            "name": self.user.name,
            "jti": uuid4().hex,
            "type": "access",
        }
        token = jwt.encode(
            payload,
            key=self.jwt_auth.salt,
            algorithm=self.jwt_auth.algorithm,
            headers=self.jwt_auth.headers,
        )
        return token, payload["exp"]

    def generate_refresh_token(self) -> tuple[str, int]:
        if not self.user:
            raise AuthError("用户未登录", 401)
        now = int(time.time())
        payload: JwtPayload = {
            "iat": now,
            "exp": now + self.jwt_auth.refresh_expiration,
            "name": self.user.name,
            "jti": uuid4().hex,
            "type": "refresh",
        }
        token = jwt.encode(
            payload,
            key=self.jwt_auth.salt,
            algorithm=self.jwt_auth.algorithm,
            headers=self.jwt_auth.headers,
        )
        return token, payload["exp"]

    def refresh_access_token(self, refresh_token: str) -> tuple[str, int, str, int]:
        try:
            payload: JwtPayload = jwt.decode(
                refresh_token,
                key=self.jwt_auth.salt,
                algorithms=[self.jwt_auth.algorithm],
            )
        except jwt.PyJWTError:
            raise AuthError("无效的刷新token", 401)

        if payload["type"] != "refresh":
            raise AuthError("无效的刷新token类型", 401)

        if time.time() > payload["exp"]:
            raise AuthError("刷新token已过期", 401)

        self.user = User(name=payload["name"])
        token, expires_in = self.generate_access_token()
        return token, expires_in, refresh_token, payload["exp"]


class GoogleAuthService:
    def __init__(self, http_client: AsyncClient, config: JwtAuth):
        self.httpx = http_client
        self.jwt_auth = config
        self.user: Optional[User] = None

    async def login(self, code):
        raise NotImplementedError
