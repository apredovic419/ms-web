from sanic import Request

from component import response
from component.throttle import RedisRateLimiter
from component.view import JWTView


def effective_user(request: Request):
    if request.ctx.user is None:
        return "未登录或已过期"


class ReqArgsLimiter(RedisRateLimiter):
    def __init__(
        self,
        rate,
        cache,
        args_name,
        key: str = "::SlidingThrottle",
    ):
        super().__init__(rate, cache, key, None)
        self.args_name = args_name

    def get_redis_key(self, request: Request):
        try:
            v = request.json.get(self.args_name)
        except:
            try:
                v = request.form.get(self.args_name)
            except:
                v = request.args.get(self.args_name)
        if build_key := getattr(self.cache, "build_key", None):
            return build_key(f"{self.key}:{v}")
        return f"{self.key}:{v}"


class ReqIpLimiter(RedisRateLimiter):
    def get_redis_key(self, request: Request):
        if build_key := getattr(self.cache, "build_key", None):
            return build_key(f"{self.key}:{request.client_ip}")
        return f"{self.key}:{request.client_ip}"


class AuthView(JWTView):
    def dispatch_request(self, request, *args, **kwargs):
        user = request.ctx.user
        if not user:
            request.ctx.message = "未登录或已过期"
            return response.unauthorized(request)
        return super().dispatch_request(request, *args, **kwargs)
