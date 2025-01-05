import aiofiles
from httpx import AsyncClient
from sanic import Blueprint, Sanic
from sanic.request import Request
from sanic.response import HTTPResponse, json, redirect
from sanic.views import HTTPMethodView

from component import openapi, response
from component.logger import logger
from component.cache import Cache, Pydantic, default_cache
from component.inject import Dependency
from component.jinja import cache_page, render
from component.response import NormalResponse
from component.throttle import RedisRateLimiter
from component.view import JWTView, ThrottleView
from config import settings
from models.community import Notice
from models.serializers.render import (
    CaptchaRequest,
    DocHelpResponse,
    ForgotPageArgs,
    RegisterRequest,
)
from services.account.gtop100 import GTop100Service
from services.account.invite import InviteService
from services.account.register import RegisterService
from services.account.smtp import SMTPError, SMTPService
from services.game.render import MapleIoService, RenderService

app = Sanic.get_app(settings.app_name)
bp = Blueprint("render", url_prefix="/", version_prefix="")
redis_cache = default_cache.select("redis")


@cache_page(60 * 60)
async def index(request: Request, *args, **kwargs):
    async with aiofiles.open("templates/index.html", mode="r") as f:
        return HTTPResponse(await f.read(), content_type="text/html")


# @bp.route("/", methods=["GET"], name="index")
@openapi.exclude()
@cache_page(60 * 60 * 6)
async def render_index(request: Request):
    return render(request, "index.html")


# @bp.route("/download", methods=["GET"], name="download")
@openapi.exclude()
@cache_page(60 * 30)
async def render_download(request: Request):
    return render(request, "download.html")


# @bp.route("/ranking", methods=["GET"], name="ranking")
@openapi.exclude()
@cache_page(60 * 60 * 6)
async def render_ranking(request: Request):
    return render(request, "ranking.html")


# @bp.route("/cashshop", methods=["GET"], name="cashshop")
@openapi.exclude()
@cache_page(60 * 15)
async def render_cs(request: Request):
    return render(request, "cashshop.html")


# @bp.route("/wz", methods=["GET"], name="wz")
@openapi.exclude()
@cache_page(60 * 15)
async def render_cs(request: Request):
    return render(request, "wz.html")


# @bp.route("/notice", methods=["GET"], name="notice_list")
@openapi.exclude()
@cache_page(60 * 15)
async def render_notice_list(request: Request):
    return render(request, "notice-list.html")


@redis_cache.cache_fn(expire=600, serializer=Pydantic(DocHelpResponse))
async def open_tos():
    async with aiofiles.open("asset/docs/tos.md", mode="r") as f:
        return DocHelpResponse(
            title="服务条款", create_time="2020-10-30 00:00:00", content=await f.read()
        )


@bp.route("/api/tos", methods=["GET"], name="tos")
@openapi.exclude()
@cache_page(60 * 60)
async def render_tos(request: Request):
    m = await open_tos()
    return response.ok(request, m.model_dump())


@bp.route("/api/invite", methods=["GET"], name="invite")
@openapi.exclude()
async def render_invite_helper(request: Request, serv: InviteService = Dependency(InviteService)):
    m = DocHelpResponse(
        title="邀请码说明",
        create_time="2020-10-30 00:00:00",
        content=await serv.helper(),
    )
    return response.ok(request, m.model_dump())


@redis_cache.cache_fn(expire=600, serializer=Pydantic(DocHelpResponse))
async def open_csh() -> DocHelpResponse:
    async with aiofiles.open("asset/docs/csh.md", mode="r") as f:
        return DocHelpResponse(
            title="现金商城", create_time="2020-12-03 00:00:00", content=await f.read()
        )


@bp.route("/api/csh", methods=["GET"], name="csh")
@openapi.exclude()
@openapi.response(NormalResponse[DocHelpResponse])
async def render_csh(request: Request):
    m = await open_csh()
    return response.ok(request, m.model_dump())


# @bp.route("/notice/<nid:str>", methods=["GET"], name="notice_id")
@openapi.exclude()
async def render_notice(request: Request, nid: str):
    nc = await Notice.filter(id=nid, visit=True).first()
    if not nc:
        return redirect("/notice")
    return render(request, "notice.html", {"notice": nc})


# @bp.route("/forgot", methods=["GET"], name="forgot")
@openapi.exclude()
async def render_forgot(
    request: Request,
    cache: Cache,
    query: ForgotPageArgs = Dependency(ForgotPageArgs, method="query"),
):
    data = {"step": 1, "msg": "使用注册时填写的电子邮箱地址以重置密码"}
    username = query.username
    key = f"reset:{username}:captcha"
    if username and await cache.select("redis").get(key):
        data["step"] = 2
        data["username"] = username
        data["code"] = query.code
        data["msg"] = "向您发送了一封包含验证码的邮件，请检查您的电子邮箱"
    return render(request, "forgot-passwd.html", data)


class Captcha(ThrottleView):
    # Rate limiting based on IP address.
    throttles = [
        RedisRateLimiter("1/m", redis_cache, key_factory=lambda r: f"captcha1:{r.client_ip}"),
        RedisRateLimiter("3/5*min", redis_cache, key_factory=lambda r: f"captcha2:{r.client_ip}"),
        RedisRateLimiter("12/h", redis_cache, key_factory=lambda r: f"captcha3:{r.client_ip}"),
        RedisRateLimiter("24/d", redis_cache, key_factory=lambda r: f"captcha4:{r.client_ip}"),
    ]

    async def proc_throttle(self, request):
        request.ctx.message = "请求频繁，请稍后再试。"
        return response.rate_limit(request)

    @openapi.exclude()
    async def post(
        self,
        request: Request,
        body: CaptchaRequest = Dependency(CaptchaRequest),
        service: RegisterService = Dependency(RegisterService),
        smtp: SMTPService = Dependency(SMTPService),
    ):
        if not body.valid_domain():
            request.ctx.message = "未收录的邮箱域，请联系管理员注册"
            return response.invalid(request)
        if await service.email_banned(body.email.lower()):
            request.ctx.message = "注册失败"
            return response.forbidden(request)
        if await service.email_count_limit(body.email.lower()):
            request.ctx.message = "超出注册数量限制"
            return response.invalid(request)
        try:
            captcha = await service.set_captcha(body.email)
            await service.send_captcha(smtp, body.email, captcha)
        except SMTPError as err:
            request.ctx.message = err.message
            return response.server_error(request)
        request.ctx.message = "验证码已发送至您的邮箱"
        return response.ok(request, data=None)


class VoteView(JWTView):
    @openapi.exclude()
    # @cache_page(60 * 60 * 6)
    async def get(self, request):
        # return render(request, "vote.html")
        return await index(request)

    @openapi.exclude()
    async def post(
        self,
        request: Request,
        service: GTop100Service = Dependency(GTop100Service),
    ):
        ip = request.headers.get("remote_addr")
        ua = request.form.get("pingUsername")
        if not service.validate_callback(ip, request.form):
            request.ctx.message = "非法请求"
            return response.unauthorized(request, None)
        ok = await service.append_reward(ua)
        if ok:
            return response.ok(request, None)
        else:
            return json({}, status=500)


class RegisterView(HTTPMethodView):
    @openapi.exclude()
    # @cache_page(60 * 60 * 6)
    async def get(self, request):
        # return render(request, "register.html")
        return await index(request)

    @openapi.exclude()
    @openapi.response(NormalResponse[type(None)])
    @openapi.body(RegisterRequest)
    async def post(
        self,
        request: Request,
        body: RegisterRequest = Dependency(RegisterRequest),
        service: RegisterService = Dependency(RegisterService),
    ):
        if not await service.verify_email_code(body.email, body.code):
            request.ctx.message = "邮箱验证码错误或已过期"
            return response.invalid(request)
        if not await service.verify_re_captcha(body.captcha, request.client_ip):
            request.ctx.message = "人机验证失败，请刷新重试"
            return response.invalid(request)
        if error := await service.verify_invitation_code(body.invitation_code):
            request.ctx.message = error
            return response.invalid(request)
        user = await service.register_account(
            body.username,
            body.email,
            body.pwd1,
            body.birthday,
            request.client_ip,
            body.invitation_code,
        )
        if not user:
            request.ctx.message = "注册失败，请联系管理员"
            return response.server_error(request)
        request.ctx.message = "注册成功"
        if nx := user.nxPrepaid > 0:
            request.ctx.message += f'，赠送{format(nx, ",")}点券！'
        await service.del_captcha(body.email)
        return response.ok(request, None)


class AvatarView(JWTView):
    @cache_page(10 * 60)
    async def get(
        self,
        request: Request,
        character_id: int,
        http_client: AsyncClient,
        service: RenderService = Dependency(RenderService),
    ):
        try:
            mis = MapleIoService(http_client)
            data = await service.render_character(mis, character_id)
        except Exception as err:
            logger.opt(exception=err).error("Failed to render character avatar")
            data = b""
        return HTTPResponse(status=200, headers={"Content-Type": "image/webp"}, body=data)


bp.add_route(index, "/", name="index")
bp.add_route(index, "/download", name="download")
bp.add_route(index, "/ranking", name="ranking")
bp.add_route(index, "/cashshop", name="cashshop")
bp.add_route(index, "/wz", name="wz")
bp.add_route(index, "/notice", name="notice_list")
bp.add_route(index, "/notice/<nid:str>", name="notice_id")
bp.add_route(index, "/forgot", name="forgot")

bp.add_route(VoteView.as_view(), "/vote", name="vote")
bp.add_route(Captcha.as_view(), "/register/captcha", name="captcha")
bp.add_route(RegisterView.as_view(), "/register", name="register")
bp.add_route(AvatarView.as_view(), "/api/avatar/<character_id:int>", name="avatar")
