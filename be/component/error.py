import traceback
from typing import Callable

from sanic import Blueprint, HTTPResponse, MethodNotAllowed, NotFound, Request, Sanic
from sanic.handlers import ErrorHandler
from sanic_ext.exceptions import ValidationError

from component.logger import logger
from component.response import invalid, method_not_allowed, not_found, server_error


class CustomErrorHandler(ErrorHandler):
    def default(self, request: Request, exception: Exception) -> HTTPResponse:
        if isinstance(exception, NotFound):
            return not_found(request)
        if isinstance(exception, MethodNotAllowed):
            request.ctx.message = "Method Not Allowed"
            return method_not_allowed(request)
        if isinstance(exception, (ValidationError,)):
            request.ctx.message = exception.message or exception.args[0]
            return invalid(request)
        else:
            if request.app.debug:
                request.ctx.message = traceback.format_exc()
            else:
                request.ctx.message = "Internal Server Error"
            msg = exception.args[0] if exception.args else str(exception)
            logger.opt(exception=exception).bind(request=request).exception(msg)
        return server_error(request)


class BlueprintErrorHandler(CustomErrorHandler):

    bp_handler = {}

    @classmethod
    def register_bp_handler(
        cls,
        app: Sanic,
        bp: Blueprint,
        handler: Callable[[Request, Exception], HTTPResponse],
    ):
        """Register a handler for a specific blueprint

        :param app: Sanic app
        :param bp: Blueprint
        :param handler: Handler function
        :return: None
        """
        if bp.name in cls.bp_handler:
            raise ValueError(f"Handler for {bp.name} already exists")
        cls.bp_handler[f"{app.name}.{bp.name}"] = handler

    def default(self, request, exception):
        if request.route:
            for bp_name, handler in self.bp_handler.items():
                if request.route.name.startswith(bp_name):
                    return handler(request, exception)
        return super().default(request, exception)
