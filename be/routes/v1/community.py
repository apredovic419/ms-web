from sanic import Request

from component import openapi, response
from component.inject import Dependency
from component.view import JWTView
from models.serializers.v1 import (
    CashShopTypeResponse,
    CSItemBuyRequest,
    CSItemGiftRequest,
    CSItemQueryArgs,
    CSItemQueryResponse,
    CSPoster,
    LibraryQueryArgs,
    LibraryQueryResponse,
    LibrarySourceArgs,
    NoticeItem,
    NoticeListResponse,
    PageInfo,
    UserName,
    VoteRedirectResponse,
)
from services.account.gtop100 import GTop100Error, GTop100Service
from services.account.info import UserService
from services.community.library import LibraryService
from services.community.notice import NoticeService
from services.game.cashshop import CashShopError, CashShopService

from .base import AuthView
from .router import bp


class NoticeListView(JWTView):
    @openapi.response(response.NormalResponse[NoticeListResponse])
    @openapi.query(PageInfo)
    async def get(
        self,
        request: Request,
        vo: PageInfo = Dependency(PageInfo),
        service: NoticeService = Dependency(NoticeService),
    ):
        """公告列表"""
        total, items = await service.list(vo)
        m = NoticeListResponse(total=total, items=items)
        return response.ok(request, m.model_dump())


class NoticeView(JWTView):
    @openapi.response(response.NormalResponse[NoticeItem])
    async def get(
        self,
        request: Request,
        nid: int,
        service: NoticeService = Dependency(NoticeService),
    ):
        """公告详情"""
        if m := await service.get(nid, must_visit=True):
            return response.ok(request, m.model_dump())
        return response.not_found(request)


class CSTypeView(JWTView):
    @openapi.response(response.NormalResponse[CashShopTypeResponse])
    async def get(self, request: Request, service: CashShopService = Dependency(CashShopService)):
        """获取商城物品类型"""
        items = await service.item_types()
        m = CashShopTypeResponse(items=items)
        return response.ok(request, m.model_dump())


class CSPosterView(JWTView):
    @openapi.response(response.NormalResponse[CSPoster])
    async def get(self, request: Request, service: CashShopService = Dependency(CashShopService)):
        """获取商城首页海报"""
        return response.ok(request, await service.poster())


class CSItemListView(JWTView):
    @openapi.response(response.NormalResponse[CSItemQueryResponse])
    @openapi.query(CSItemQueryArgs)
    async def get(
        self,
        request: Request,
        vo: CSItemQueryArgs = Dependency(CSItemQueryArgs),
        service: CashShopService = Dependency(CashShopService),
    ):
        """获取商城物品列表"""
        m = await service.search_items(vo.offset, vo.limit, vo.keyword, vo.category)
        return response.ok(request, m.model_dump())


class CSItemBuyView(AuthView):
    @openapi.response(response.NormalResponse[type(None)])
    @openapi.body(CSItemBuyRequest)
    async def post(
        self,
        request: Request,
        vo: CSItemBuyRequest = Dependency(CSItemBuyRequest),
        service: CashShopService = Dependency(CashShopService),
    ):
        """购买商城物品"""
        user_service = UserService(request.ctx.user)
        await user_service.sync_from_db()
        try:
            msg = await service.buy_item(request.ctx.user, vo.character_id, vo.shop_id)
        except CashShopError as err:
            request.ctx.message = err.message
            return response.forbidden(request)
        request.ctx.message = msg
        return response.ok(request, None)


class CSItemGiftView(AuthView):
    @openapi.response(response.NormalResponse[type(None)])
    @openapi.body(CSItemGiftRequest)
    async def post(
        self,
        request: Request,
        vo: CSItemGiftRequest = Dependency(CSItemGiftRequest),
        service: CashShopService = Dependency(CashShopService),
    ):
        """赠送商城物品"""
        user_service = UserService(request.ctx.user)
        await user_service.sync_from_db()
        try:
            msg = await service.gift_item(request.ctx.user, vo.shop_id, vo.accept, vo.birthday)
        except CashShopError as err:
            request.ctx.message = err.message
            return response.forbidden(request)
        request.ctx.message = msg
        return response.ok(request, None)


class LibrarySearchView(JWTView):
    @openapi.response(response.NormalResponse[LibraryQueryResponse])
    @openapi.query(LibraryQueryArgs)
    async def get(
        self,
        request: Request,
        vo: LibraryQueryArgs = Dependency(LibraryQueryArgs),
        service: LibraryService = Dependency(LibraryService),
    ):
        """搜索资料库"""
        m = await service.search(vo)
        return response.ok(request, m.model_dump())


class LibrarySourceView(JWTView):
    @openapi.response(response.NormalResponse[LibraryQueryResponse])
    @openapi.query(LibrarySourceArgs)
    async def get(
        self,
        request: Request,
        vo: LibrarySourceArgs = Dependency(LibrarySourceArgs),
        service: LibraryService = Dependency(LibraryService),
    ):
        """搜索资料库"""
        if vo.oid < 0:
            return response.ok(request, {})
        if vo.category == "Mob":
            data = await service.mob_info(vo.oid)
        elif vo.category == "Npc":
            data = await service.npc_info(vo.oid)
        else:
            data = await service.source_info(vo.oid, timeout=5)
        return response.ok(request, data)


class VoteView(JWTView):
    @openapi.response(response.NormalResponse[VoteRedirectResponse])
    @openapi.body(UserName)
    async def post(
        self,
        request: Request,
        vo: UserName = Dependency(UserName),
        service: GTop100Service = Dependency(GTop100Service),
    ):
        """用户投票"""
        try:
            url = await service.vote_url(vo.username)
        except GTop100Error as err:
            request.ctx.message = err.message
            return response.forbidden(request)
        m = VoteRedirectResponse(url=url)
        return response.ok(request, m.model_dump())


bp.add_route(NoticeListView.as_view(), "/notice/list")
bp.add_route(NoticeView.as_view(), "/notice/<nid:int>")
bp.add_route(CSTypeView.as_view(), "/cashshop/type")
bp.add_route(CSPosterView.as_view(), "/cashshop/poster")
bp.add_route(CSItemListView.as_view(), "/cashshop/items")
bp.add_route(CSItemBuyView.as_view(), "/cashshop/buy")
bp.add_route(CSItemGiftView.as_view(), "/cashshop/gift")
bp.add_route(LibrarySearchView.as_view(), "/library/search")
bp.add_route(LibrarySourceView.as_view(), "/library/source")
bp.add_route(VoteView.as_view(), "/vote")
