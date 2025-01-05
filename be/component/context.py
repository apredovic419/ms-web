from concurrent.futures import ThreadPoolExecutor
from contextvars import ContextVar

from httpx import AsyncClient
from sanic import Request
from models.game import User

ctx_httpx: ContextVar[AsyncClient] = ContextVar("service.httpx")
ctx_executor: ContextVar[ThreadPoolExecutor] = ContextVar("thread.executor")
ctx_request_id: ContextVar[str] = ContextVar("request_id", default="")
ctx_request: ContextVar[Request] = ContextVar("service.request")
ctx_user: ContextVar[User] = ContextVar("service.user")


def get_or_init_executor(*args, **kwargs) -> ThreadPoolExecutor:
    """get the thread pool executor of the context.
    if the context does not have a thread pool, then initialize a new.
    """
    try:
        return ctx_executor.get()
    except LookupError:
        executor = ThreadPoolExecutor(*args, **kwargs)
        ctx_executor.set(executor)
        return executor


def get_or_init_httpx(*args, **kwargs) -> AsyncClient:
    try:
        return ctx_httpx.get()
    except LookupError:
        httpx = AsyncClient(*args, **kwargs)
        ctx_httpx.set(httpx)
        return httpx
