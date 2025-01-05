import importlib
from inspect import iscoroutine, iscoroutinefunction
from typing import Callable, List, Tuple, Union

from sanic import HTTPResponse
from sanic.views import HTTPMethodView

from component import response
from component.throttle import ThrottleInterface
from config import settings

JWT_AUTH = settings.jwt_auth


def import_helper(array: List[Union[str, Callable]]) -> List[Tuple[Callable, bool]]:
    """According to the function related to the string import,
    return the corresponding function and whether it is a coroutine function list
    :param array:
    :return:
    """
    resp = []
    for item in array:
        if isinstance(item, str):
            pk, attr = item.rsplit(".", 1)
            pk = importlib.import_module(pk)
            item = getattr(pk, attr)
        is_coroutine = iscoroutinefunction(item)
        resp.append((item, is_coroutine))
    return resp


class ThrottleView(HTTPMethodView):
    throttles = []
    _throttles: Tuple[Tuple[ThrottleInterface, bool]] = None

    async def _throttle(self, request):
        if self.__class__._throttles is None:
            throttles = []
            for throttle in self.throttles:
                if isinstance(throttle, str):
                    pk, attr = throttle.rsplit(".", 1)
                    pk = importlib.import_module(pk)
                    throttle = getattr(pk, attr)
                is_coroutine = iscoroutinefunction(throttle.allow_request)
                throttles.append((throttle, is_coroutine))
            self.__class__._throttles = tuple(throttles)

        for throttle, is_coroutine in self._throttles:
            result = throttle.allow_request(request)
            if is_coroutine:
                result = await result
            if result is False:
                return False
        return True

    async def proc_throttle(self, request):
        return response.rate_limit(request)

    async def dispatch_request(self, request, *args, **kwargs):
        handler = getattr(self, request.method.lower(), None)
        if handler is None:
            return HTTPResponse(status=405)
        if await self._throttle(request) is False:
            return await self.proc_throttle(request)
        result = handler(request, *args, **kwargs)
        if iscoroutine(result):
            return await result
        else:
            return result


class AuthenticateView(HTTPMethodView):
    authentications = []
    _authentications: Tuple[Tuple[Callable, bool]] = None

    async def _authenticate(self, request):
        if self.__class__._authentications is None:
            self.__class__._authentications = tuple(import_helper(self.authentications))

        for auth, is_coroutine in self._authentications:
            result = auth(request)
            if is_coroutine:
                result = await result
            if result:
                return result

    async def proc_authenticate(self, request):
        return response.unauthorized(request)

    async def dispatch_request(self, request, *args, **kwargs):
        handler = getattr(self, request.method.lower(), None)
        if handler is None:
            return HTTPResponse(status=405)
        if auth := await self._authenticate(request):
            request.ctx.message = auth
            return await self.proc_authenticate(request)
        result = handler(request, *args, **kwargs)
        if iscoroutine(result):
            return await result
        else:
            return result


class PermissionView(HTTPMethodView):
    permissions = []
    _permissions: Tuple[Tuple[Callable, bool]] = None

    async def _permission(self, request):
        if self.__class__._permissions is None:
            self.__class__._permissions = tuple(import_helper(self.permissions))

        for permission, is_coroutine in self._permissions:
            result = permission(request)
            if is_coroutine:
                result = await result
            if result:
                return result

    async def proc_permission(self, request):
        return response.forbidden(request)

    async def dispatch_request(self, request, *args, **kwargs):
        handler = getattr(self, request.method.lower(), None)
        if handler is None:
            return HTTPResponse(status=405)
        if pem := await self._permission(request):
            request.ctx.message = pem
            return await self.proc_permission(request)
        result = handler(request, *args, **kwargs)
        if iscoroutine(result):
            return await result
        else:
            return result


class JWTView(AuthenticateView, PermissionView, ThrottleView):
    """View class that implements jwt authentication"""

    authentications = JWT_AUTH.authentications
    permissions = JWT_AUTH.permissions
    throttles = JWT_AUTH.throttles

    async def dispatch_request(self, request, *args, **kwargs):
        handler = getattr(self, request.method.lower(), None)
        if handler is None:
            return HTTPResponse(status=405)
        if await self._throttle(request) is False:
            return await self.proc_throttle(request)
        if auth := await self._authenticate(request):
            request.ctx.message = auth
            return await self.proc_authenticate(request)
        if pem := await self._permission(request):
            request.ctx.message = pem
            return await self.proc_permission(request)
        result = handler(request, *args, **kwargs)
        if iscoroutine(result):
            return await result
        else:
            return result
