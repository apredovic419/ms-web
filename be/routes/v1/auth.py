from sanic import Request

from config import Settings
from component import openapi, response
from component.cache import cache
from component.inject import Dependency
from component.view import JWTView
from models.game import User
from models.serializers.render import (
    RegisterRequest,
    ResetPasswordRequest,
    ResetPwdCaptchaRequest,
)
from models.serializers.v1 import LoginRequest, LoginResponse
from services.account.auth import AuthError, AuthService
from services.account.info import UserError, UserService
from services.account.register import RegisterService
from services.account.smtp import SMTPService

from .base import ReqArgsLimiter, ReqIpLimiter
from .router import bp

cache = cache.select("redis")


class LoginView(JWTView):
    throttles = [
        ReqArgsLimiter("5/m", cache, args_name="username", key="auth1"),
        ReqArgsLimiter("10/5*m", cache, args_name="username", key="auth2"),
        ReqArgsLimiter("30/h", cache, args_name="username", key="auth3"),
    ]

    @openapi.response(response.NormalResponse[LoginResponse])
    @openapi.body(LoginRequest)
    async def post(
        self,
        request: Request,
        vo: LoginRequest = Dependency(LoginRequest),
        service: AuthService = Dependency(AuthService),
    ):
        """用户登录"""
        try:
            await service.login(vo.username, vo.password)
        except AuthError as err:
            request.ctx.message = err.message
            if err.status == 401:
                return response.unauthorized(request)
            elif err.status == 403:
                return response.forbidden(request)
            return response.server_error(request)
        token, expires_in = service.generate_access_token()
        refresh_token, refresh_expires_in = service.generate_refresh_token()
        m = LoginResponse(
            token=token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            refresh_expires_in=refresh_expires_in,
        )
        return response.ok(request, m.model_dump())


class RefreshToken(JWTView):
    @openapi.response(response.NormalResponse[LoginResponse])
    async def post(self, request: Request, service: AuthService = Dependency(AuthService)):
        """刷新token"""
        refresh_token = request.args.get("refresh_token")
        if not refresh_token:
            request.ctx.message = "缺少参数"
            return response.invalid(request)
        try:
            token, expires_in, _, refresh_expires_in = service.refresh_access_token(refresh_token)
        except AuthError as err:
            request.ctx.message = err.message
            return response.unauthorized(request)
        m = LoginResponse(
            token=token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            refresh_expires_in=refresh_expires_in,
        )
        return response.ok(request, m.model_dump())


class RegisterView(JWTView):
    throttles = []

    @openapi.response(response.NormalResponse[type(None)])
    @openapi.body(RegisterRequest)
    async def post(
        self,
        request: Request,
        vo: RegisterRequest = Dependency(RegisterRequest),
        service: RegisterService = Dependency(RegisterService),
    ):
        """用户注册"""
        if not await service.verify_email_code(vo.email, vo.code):
            request.ctx.message = "邮箱验证码错误或已过期"
            return response.invalid(request)
        if not await service.verify_re_captcha(vo.captcha, request.client_ip):
            request.ctx.message = "人机验证失败，请刷新重试"
            return response.invalid(request)
        if error := await service.verify_invitation_code(vo.invitation_code):
            request.ctx.message = error
            return response.invalid(request)
        user = await service.register_account(
            vo.username,
            vo.email,
            vo.pwd1,
            vo.birthday,
            request.client_ip,
            vo.invitation_code,
        )
        if not user:
            request.ctx.message = "注册失败，请联系管理员"
            return response.server_error(request)
        request.ctx.message = "注册成功"
        if nx := user.nxPrepaid > 0:
            request.ctx.message += f'，赠送{format(nx, ",")}点券！'
        await service.del_captcha(vo.email)
        return response.ok(request, None)


class ResetPassword(JWTView):
    """找回密码
    流程（同一个页面）：
        1.输入账号，获取验证码（按钮"获取验证码"）
        2.提交验证码、账号和密码表单结束修改
    """

    username: str

    throttles = [
        ReqArgsLimiter("12/h", cache, args_name="username", key="reset"),
        ReqIpLimiter("25/h", cache, key="reset"),
    ]

    @openapi.response(response.NormalResponse[type(None)])
    @openapi.body(ResetPwdCaptchaRequest)
    async def post(
        self,
        request: Request,
        vo: ResetPwdCaptchaRequest = Dependency(ResetPwdCaptchaRequest),
        smtp: SMTPService = Dependency(SMTPService),
        config: Settings = Dependency(Settings),
    ):
        """找回密码-获取验证码"""
        user = await User.filter(name=vo.username).first()
        if not user:
            request.ctx.message = "账号不存在"
            return response.unauthorized(request)
        self.username = vo.username
        user_service = UserService(user)
        captcha = user_service.generate_captcha()
        await user_service.send_reset_code(smtp, cache, config.domain, captcha)
        request.ctx.message = "验证码已发送至您的邮箱"
        return response.ok(request, None)

    @openapi.response(response.NormalResponse[type(None)])
    @openapi.body(ResetPasswordRequest)
    async def put(
        self,
        request,
        vo: ResetPasswordRequest = Dependency(ResetPasswordRequest),
    ):
        """找回密码-提交确认"""
        try:
            await UserService.reset_password(cache, vo.username, vo.password, vo.captcha)
        except UserError as err:
            request.ctx.message = err.message
            return response.forbidden(request)
        request.ctx.message = "密码修改成功"
        return response.ok(request, None)


bp.add_route(LoginView.as_view(), "/auth/login")
bp.add_route(RefreshToken.as_view(), "/auth/refresh")
bp.add_route(RegisterView.as_view(), "/auth/register")
bp.add_route(ResetPassword.as_view(), "/auth/reset")
