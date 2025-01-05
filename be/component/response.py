import uuid
from types import SimpleNamespace
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field
from sanic import Request, json

T = TypeVar("T")


class NormalResponse(BaseModel, Generic[T]):
    response_id: uuid.UUID = Field()
    code: int = Field()
    message: str = Field()
    data: T = Field()


def _get_or_set_context_attribute(ctx: SimpleNamespace, key: str, value: Any = None):
    if not hasattr(ctx, key):
        setattr(ctx, key, value)
    return getattr(ctx, key)


def ok(request: Request, data: Any):
    ctx: SimpleNamespace = request.ctx
    ctx.response_data = {
        "response_id": _get_or_set_context_attribute(ctx, "response_id", uuid.uuid4()),
        "code": _get_or_set_context_attribute(ctx, "code", 200),
        "message": _get_or_set_context_attribute(ctx, "message", "ok"),
        "data": data,
    }
    return json(ctx.response_data)


def forbidden(request: Request, data: Any = None):
    ctx: SimpleNamespace = request.ctx
    ctx.response_data = {
        "response_id": _get_or_set_context_attribute(ctx, "response_id", uuid.uuid4()),
        "code": _get_or_set_context_attribute(ctx, "code", 403),
        "message": _get_or_set_context_attribute(ctx, "message", "forbidden"),
        "data": data,
    }
    return json(ctx.response_data)


def invalid(request: Request, data: Any = None):
    ctx = request.ctx
    ctx.response_data = {
        "response_id": _get_or_set_context_attribute(ctx, "response_id", uuid.uuid4()),
        "code": _get_or_set_context_attribute(ctx, "code", 400),
        "message": _get_or_set_context_attribute(ctx, "message", "invalid"),
        "data": data,
    }
    return json(ctx.response_data)


def unauthorized(request: Request, data: Any = None):
    ctx = request.ctx
    ctx.response_data = {
        "response_id": _get_or_set_context_attribute(ctx, "response_id", uuid.uuid4()),
        "code": _get_or_set_context_attribute(ctx, "code", 401),
        "message": _get_or_set_context_attribute(ctx, "message", "unauthorized"),
        "data": data,
    }
    return json(ctx.response_data)


def not_found(request: Request, data: Any = None):
    ctx = request.ctx
    ctx.response_data = {
        "response_id": _get_or_set_context_attribute(ctx, "response_id", uuid.uuid4()),
        "code": _get_or_set_context_attribute(ctx, "code", 404),
        "message": _get_or_set_context_attribute(ctx, "message", "not found"),
        "data": data,
    }
    return json(ctx.response_data)


def rate_limit(request: Request, data: Any = None):
    ctx = request.ctx
    ctx.response_data = {
        "response_id": _get_or_set_context_attribute(ctx, "response_id", uuid.uuid4()),
        "code": _get_or_set_context_attribute(ctx, "code", 429),
        "message": _get_or_set_context_attribute(ctx, "message", "rate limit"),
        "data": data,
    }
    return json(ctx.response_data)


def server_error(request: Request, data: Any = None):
    ctx = request.ctx
    ctx.response_data = {
        "response_id": _get_or_set_context_attribute(ctx, "response_id", uuid.uuid4()),
        "code": _get_or_set_context_attribute(ctx, "code", 500),
        "message": _get_or_set_context_attribute(ctx, "message", "server error"),
        "data": data,
    }
    return json(ctx.response_data)


def method_not_allowed(request: Request, data: Any = None):
    ctx = request.ctx
    ctx.response_data = {
        "response_id": _get_or_set_context_attribute(ctx, "response_id", uuid.uuid4()),
        "code": _get_or_set_context_attribute(ctx, "code", 405),
        "message": _get_or_set_context_attribute(ctx, "message", "method not allowed"),
        "data": data,
    }
    return json(ctx.response_data)
