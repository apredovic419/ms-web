import asyncio
import time
from abc import ABCMeta, abstractmethod
from collections import deque
from threading import Lock
from typing import Any, Callable

from redis.asyncio.lock import Lock as RedisLock

from component.cache import Cache

__version__ = (1, 1, 0, 0)

THROTTLE_RATES = {"resource1": "100/min", "resource2": "20/second", "resource3": "30/5*min"}


def parse_rate(rate):
    num, period = rate.split("/")
    try:
        per, period = period.split("*")
    except ValueError:
        per = 1
    num_requests = int(num)
    duration = {"s": 1, "m": 60, "h": 3600, "d": 86400}[period[0]] * 1000 * int(per)
    return num_requests, duration


class _DictCache(dict):
    def set(self, key, value):
        self[key] = value


class ThrottleInterface(metaclass=ABCMeta):
    def __call__(self, request: Any):
        return self.allow_request(request)

    @abstractmethod
    def allow_request(self, request: Any) -> bool:
        ...


class SlidingThrottle(ThrottleInterface):
    """滑动窗口限流器"""

    def __init__(self, rate: str, cache: Any = None):
        self.rate = rate
        self.num_requests, self.period = parse_rate(rate)
        self.cache = cache or _DictCache()
        self._lock = Lock()

    @staticmethod
    def timer():
        return int(time.time() * 1000)

    def get_history(self, request):
        if self.cache.get(request, None) is None:
            self.cache.set(request, deque())
        return self.cache[request]

    def check_history(self, now, history):
        num_requests, duration = self.num_requests, self.period
        with self._lock:
            while history and history[-1] <= now - duration:
                history.pop()

    def allow_request(self, request):
        history = self.get_history(request)
        now = self.timer()
        self.check_history(now, history)
        if len(history) >= self.num_requests:
            return False

        history.appendleft(now)
        return True


class AsyncSlidingThrottle(SlidingThrottle):
    """Asynchronous sliding window current limiter"""

    async def get_history(self, request):
        history = self.cache.get(request, [])
        if asyncio.iscoroutine(history):
            history = await history
        return deque(history)

    async def set_history(self, request, now, history):
        history.appendleft(now)
        co = self.cache.set(request, [x for x in history])
        if asyncio.iscoroutine(co):
            await co

    async def allow_request(self, request):
        history = await self.get_history(request)
        now = self.timer()
        self.check_history(now, history)
        if len(history) >= self.num_requests:
            return False

        await self.set_history(request, now, history)
        return True


class RedisRateLimiter(SlidingThrottle):
    """Sliding window current limiter implemented based on redis ordered collection

    :param rate: current limiting rate
    :param cache: cache instance
    :param key: default redis key
    :param key_factory: redis key generator
    :param max_ttl: The maximum lifetime of the current limiter. If it is None, it is the current limiter period.
    """

    def __init__(
        self,
        rate: str,
        cache: Cache,
        key: str = "::SlidingThrottle",
        key_factory: Callable[[Any], str] = None,
    ):
        super().__init__(rate, cache)
        self.key = key
        if key_factory is not None:
            self.get_redis_key = key_factory

    def get_redis_key(self, request):
        return self.key

    async def allow_request(self, request):
        key = self.get_redis_key(request)
        if asyncio.iscoroutine(key):
            key = await key
        lock = RedisLock(self.cache.current_db, f"{key}:lock", timeout=3, blocking_timeout=1)
        ok = await lock.acquire()
        if not ok:
            return False
        now = self.timer()
        end = now - self.period
        async with self.cache.pipeline(transaction=True) as pipe:
            _, count = await pipe.zremrangebyscore(key, 0, end).zcard(key).execute()
            if count < self.num_requests:
                await pipe.zadd(key, {str(now): now}).expire(
                    key, int(self.period / 1000 + 1)
                ).execute()
        await lock.release()
        return count < self.num_requests
