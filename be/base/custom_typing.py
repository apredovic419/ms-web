from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace

from sanic import Config
from sanic import Request as _Request
from sanic import Sanic
from typing_extensions import TypeAlias  # introduced in Python3.10

from component.cache import Cache
from component.context import get_or_init_executor
from component.future import TimerManager


class SanicContext:
    cache: Cache
    timer_manager: TimerManager

    @property
    def executor(self) -> ThreadPoolExecutor:
        return get_or_init_executor()


Request: TypeAlias = _Request[Sanic[Config, SanicContext], SimpleNamespace]
