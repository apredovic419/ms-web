import re
import time
from typing import Any
from http import HTTPMethod
from urllib.parse import unquote

from loguru import logger
from sanic import Sanic
from sanic.request import Request
from sanic.response import HTTPResponse

from component.cache import PyObj, cache
from component.context import ctx_user
from config import settings
from models.game import IpBans
from services.account.auth import AuthService

_app = Sanic.get_app(settings.app_name)


@_app.on_request
def set_context(request: Request):
    """setting context variables and recording request timestamp"""
    request.ctx.log_time = time.time()


@_app.on_request
async def ip_ban_403(request: Request) -> Any:
    """Access to the webpage from the banned IP in the game is not allowed, return status code 403."""
    ip = request.headers.get("remote_addr") or request.ip
    key1, key2, ttl = "::ipBans", "::ipBanRe", 100
    ban_list = await cache.get(key1, serializer=PyObj)
    ban_re = await cache.get(key2, default=[], serializer=PyObj)
    if ban_list is None:
        query = await IpBans.all().values_list("ip")
        ban_list, ban_re = [], []
        for i in query:
            if i[0].startswith("^"):
                ban_re.append(re.compile(i[0]))
            else:
                ban_list.append(i[0].strip("/"))
        await cache.set(key1, ban_list, serializer=PyObj, ex=ttl)
        await cache.set(key2, ban_re, serializer=PyObj, ex=ttl)
    if ip in ban_list:
        return HTTPResponse(status=403)
    for cm in ban_re:
        if cm.match(ip):
            return HTTPResponse(status=403)


@_app.on_request
async def jwt_auth(request: Request) -> Any:

    request.ctx.user = None
    if token := request.headers.get("authorization", request.args.get("token")):
        if token.startswith("Bearer "):
            token = token[7:]
        if service := AuthService.from_jwt(settings.jwt_auth, token):
            request.ctx.user = service.user

    ctx_user.set(request.ctx.user)


@_app.on_response
def log_middle_res(request: Request, response: HTTPResponse):
    if request.method == HTTPMethod.OPTIONS:
        return
    duration = time.time() - request.ctx.log_time
    content = {
        "ip": request.remote_addr or request.ip,
        "method": request.method,
        "path": request.path,
        "query_string": unquote(request.query_string),
        "code": response.status,
        "cost": f"{duration:.3f}s",
    }
    logger.info("\t".join(f"{k}:{v}" for k, v in content.items()))
