import asyncio

from sanic import Request, json

from component import openapi, response
from component.cache import cache
from component.inject import Dependency
from component.logger import logger
from config import settings
from models.serializers.v1 import (
    CharInfo,
    CharItemResponse,
    CharListResponse,
    CheckInRequest,
    ClientUpdateRequest,
    UpdatePwdRequest,
    UserInfoResponse,
)
from services.account.info import UserError, UserService
from services.account.invite import InviteError, InviteService
from services.community.library import LibraryService
from services.rpc.service import MagicService

from .base import AuthView
from .router import bp

cache = cache.select("redis")


class UserInfoView(AuthView):
    @openapi.response(response.NormalResponse[UserInfoResponse])
    async def get(self, request: Request):
        """获取用户信息"""
        service = UserService(request.ctx.user)
        await service.sync_from_db()
        m = UserInfoResponse.model_validate(service.user, strict=False)
        return response.ok(request, m.model_dump())


class ApplyInviteView(AuthView):
    @openapi.response(response.NormalResponse[type(None)])
    async def post(
        self,
        request: Request,
        service: InviteService = Dependency(InviteService),
    ):
        """申请邀请码"""
        user_service = UserService(request.ctx.user)
        await user_service.sync_from_db()
        try:
            inv = await service.apply_invite(user_service.user)
        except InviteError as err:
            request.ctx.message = err.message
            if err.status == 403:
                return response.forbidden(request)
            return response.server_error(request)
        # 让发送邀请码的任务在后台执行
        _ = asyncio.create_task(service.send_invite(user_service.user.email, inv))
        request.ctx.message = "申请成功，邀请码已发送至您的邮箱"
        return response.ok(request, None)


class UpdatePwdView(AuthView):
    @openapi.response(response.NormalResponse[type(None)])
    @openapi.body(UpdatePwdRequest)
    async def post(self, request, vo: UpdatePwdRequest = Dependency(UpdatePwdRequest)):
        """修改密码"""
        user_service = UserService(request.ctx.user)
        try:
            await user_service.update_password(vo.origin_pwd, vo.new_pwd)
        except UserError as err:
            request.ctx.message = err.message
            return response.unauthorized(request)
        request.ctx.message = "密码修改成功"
        return response.ok(request, None)


class CheckInView(AuthView):
    @openapi.response(response.NormalResponse[type(None)])
    @openapi.body(CheckInRequest)
    async def post(
        self,
        request: Request,
        rpc: MagicService,
        vo: CheckInRequest = Dependency(CheckInRequest),
        wz: LibraryService = Dependency(LibraryService),
    ):
        """用户签到"""
        service = UserService(request.ctx.user)
        try:
            item = await service.random_checkin_item(wz)
            await service.checkin(cache, rpc, vo.character_id, item)
        except UserError as err:
            request.ctx.message = err.message
            if err.status == 401:
                return response.unauthorized(request)
            elif err.status == 403:
                return response.forbidden(request)
            return response.server_error(request)
        request.ctx.message = f"签到成功！你获得了道具 {item.name}\n请到点券商城查收~"
        return response.ok(request, None)


class CharListView(AuthView):
    @openapi.response(response.NormalResponse[CharListResponse])
    async def get(self, request: Request):
        """获取用户角色列表"""
        service = UserService(request.ctx.user)
        items = await service.character_list()
        m = CharListResponse(items=items)
        return response.ok(request, m.model_dump())


class CharView(AuthView):
    @openapi.response(response.NormalResponse[CharInfo])
    async def get(self, request: Request, character_id: int):
        """获取用户指定角色"""
        service = UserService(request.ctx.user)
        try:
            m = await service.character_info(character_id)
        except UserError as e:
            request.ctx.message = e.message
            return response.forbidden(request)
        return response.ok(request, m.model_dump())


class CharItemListView(AuthView):
    @openapi.response(response.NormalResponse[CharItemResponse])
    async def get(self, request: Request, character_id: int):
        """获取角色背包物品"""
        user_service = UserService(request.ctx.user)
        try:
            items = await user_service.character_items(character_id)
        except UserError as e:
            request.ctx.message = e.message
            return response.forbidden(request)
        m = CharItemResponse(items=items)
        return response.ok(request, m.model_dump())


class CharEquipView(AuthView):
    @openapi.response(response.NormalResponse[type(None)])
    async def get(self, request: Request, character_id: int):
        """获取角色装备物品"""
        # TODO Implement
        raise NotImplementedError("暂未实现")


bp.add_route(UserInfoView.as_view(), "/user/info")
bp.add_route(ApplyInviteView.as_view(), "/user/apply_invite")
bp.add_route(CheckInView.as_view(), "/user/checkin")
bp.add_route(UpdatePwdView.as_view(), "/user/update_password")
bp.add_route(CharListView.as_view(), "/character/list")
bp.add_route(CharView.as_view(), "/character/<character_id:int>")
bp.add_route(CharItemListView.as_view(), "/character/<character_id:int>/items")
bp.add_route(CharEquipView.as_view(), "/character/<character_id:int>/equip")
