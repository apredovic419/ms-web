import base64
import socket

from httpx import AsyncClient
from sanic import Request

from component import openapi, response
from component.cache import cache
from component.inject import Dependency
from component.view import JWTView
from config import Settings
from models.game import User
from models.serializers.v1 import (
    CharAvatarResponse,
    CharRankRequest,
    CharRankResponse,
    GameOnlineResponse,
    GuildRankResponse,
    PageInfo,
)
from services.account.info import UserService
from services.game.rank import RankService
from services.game.render import MapleIoService, RenderService
from services.rpc.service import MagicService

from .base import AuthView
from .router import bp

cache = cache.select("redis")


def detect_port(host: str, port: int) -> bool:
    """Detect whether the target port is open."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1)
    try:
        result_code = s.connect_ex((host, port))  # 开放放回0
        if result_code == 0:
            return True
        else:
            return False
    except Exception:
        return False
    finally:
        s.close()



class StatusView(JWTView):
    @openapi.response(response.NormalResponse[GameOnlineResponse])
    async def get(self, request: Request, config: Settings):
        """游戏服务状态"""

        async def get_status():
            m = GameOnlineResponse(
                status=await cache.get("ServerStatus", default="正常"),
                count=await User.filter(loggedin=2).count(),
                invite=config.invitation_required,
            )
            if not m.status:
                detect = detect_port(config.game_server.host, config.game_server.port)
                m.status = "正常" if detect else "异常"
            return m.model_dump()

        name, ex = "onlineStatus", 60
        info = await cache.get_or_set(name, get_status, ex=ex)
        return response.ok(request, info)


class OnlineView(JWTView):
    @openapi.response(response.NormalResponse[GameOnlineResponse])
    async def get(self, request: Request, service: MagicService, config: Settings):
        """游戏服务状态"""
        if not service.enabled:
            return response.forbidden(request, "服务未启用")

        async def get_status():
            count, characters = await service.get_online()

            m = GameOnlineResponse(
                status=await cache.get("ServerStatus", default="正常"),
                invite=config.invitation_required,
                count=count,
                characters=characters,
            )
            if not m.status:
                detect = detect_port(config.game_server.host, config.game_server.port)
                m.status = "正常" if detect else "异常"
            return m.model_dump()

        name, ex = "onlineList", 60
        info = await cache.get_or_set(name, get_status, ex=ex)
        return response.ok(request, info)


class CharRankView(JWTView):
    @openapi.response(response.NormalResponse[CharRankResponse])
    @openapi.query(CharRankRequest)
    async def get(
        self,
        request: Request,
        vo: CharRankRequest = Dependency(CharRankRequest),
        service: RankService = Dependency(RankService),
    ):
        """游戏排行榜"""
        m = await service.rank(vo)
        return response.ok(request, m.model_dump())


class GuildRankView(JWTView):
    @openapi.response(response.NormalResponse[GuildRankResponse])
    @openapi.query(PageInfo)
    async def get(
        self,
        request: Request,
        vo: PageInfo = Dependency(PageInfo),
        service: RankService = Dependency(RankService),
    ):
        """游戏家族排名"""
        m = await service.guild_rank(vo.page, vo.size)
        return response.ok(request, m.model_dump())


class CharAvatarView(JWTView):
    @openapi.response(response.NormalResponse[CharAvatarResponse])
    async def get(
        self,
        request: Request,
        character_id: int,
        httpx: AsyncClient,
        service: RenderService = Dependency(RenderService),
    ):
        """获取角色简图"""
        mis = MapleIoService(httpx)
        try:
            data = await service.render_character(mis, character_id)
        except:
            data = b""
        m = CharAvatarResponse(
            character_id=character_id,
            image=f"data:image/webp;base64,{base64.b64encode(data).decode()}",
        )
        return response.ok(request, m.model_dump())


class EAView(AuthView):
    @openapi.response(response.NormalResponse[type(None)])
    async def post(self, request: Request):
        """游戏账号解卡"""
        service = UserService(request.ctx.user)
        ok = await service.ea()
        if not ok:
            request.ctx.message = "自救失败，请检查账号状态。如有其他问题，请联系管理员"
            return response.forbidden(request)
        request.ctx.message = "自救成功，请重新登录。如有其他问题，请联系管理员"
        return response.ok(request, None)


bp.add_route(StatusView.as_view(), "/game/status")
bp.add_route(OnlineView.as_view(), "/game/online")
bp.add_route(EAView.as_view(), "/game/ea")
bp.add_route(CharRankView.as_view(), "/game/character/rank")
bp.add_route(GuildRankView.as_view(), "/game/guild/rank")
bp.add_route(CharAvatarView.as_view(), "/game/character/avatar/<character_id:int>")
