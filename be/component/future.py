import asyncio
import logging
import time
import traceback
from asyncio import Task
from datetime import datetime
from functools import wraps
from typing import Dict

import pytz
from croniter import croniter

tz = pytz.timezone("Asia/Shanghai")
logger = logging.getLogger(__name__)


class TimerManager:

    def __init__(self, *, loop=None):
        self._namespace: Dict[str, Task] = {}
        self._loop = loop

    @property
    def loop(self):
        return self._loop or asyncio.get_running_loop()

    def register(
        self,
        func,
        name=None,
        cron: str = None,
        repeat: float = None,
        delay: float = 0,
        at: datetime = None,
        redo: int = None,
        args: tuple = None,
        kwargs: dict = None,
    ) -> Task:
        """向事件循环中注册一个可重复执行的任务
        :param func: 一个FunctionType或CoroutineType
        :param name: 任务名称 传入None时 name = func.__name__
        :param cron: cron表达式
        :param repeat: 每repeat秒执行一次任务
        :param delay: 第一次执行任务前延迟delay秒
        :param at: 在指定时间执行任务 传入at参数时会覆盖delay参数
        :param redo: 对任务重新执行redo次 默认一直执行至事件循环结束
        :param args: 用于传递给func的不具名参数
        :param kwargs: 用于传递给func的具名参数
        :return:
        """
        if name is None:
            name = func.__name__
        if at:
            delay = max(0, (at - datetime.now()).seconds)
        if name in self._namespace:
            self.cancel(name)
        args = [] if args is None else args
        kwargs = {} if kwargs is None else kwargs
        cron = croniter(cron) if cron else None
        task = scheduled(cron, repeat, delay, redo)(func)(*args, **kwargs)
        self._namespace[name] = self.loop.create_task(task)
        return self._namespace[name]

    def register_task(
        self,
        name=None,
        cron: str = None,
        repeat: float = None,
        delay: float = 0,
        at: datetime = None,
        redo: int = None,
        args: tuple = None,
        kwargs: dict = None,
    ):
        """注册任务装饰器"""

        def decorator(func):
            @wraps(func)
            def wrapper():
                return self.register(
                    func,
                    name=name,
                    cron=cron,
                    repeat=repeat,
                    delay=delay,
                    at=at,
                    redo=redo,
                    args=args,
                    kwargs=kwargs,
                )

            return wrapper

        return decorator

    def cancel(self, name):
        """取消一个定时任务"""
        if name in self._namespace:
            self._namespace[name].cancel()

    def cancel_all(self):
        """取消所有定时任务"""
        for _, task in self._namespace.items():
            task.cancel()


def scheduled(
    cron: croniter = None,
    repeat: float = None,
    delay: float = 0,
    redo: int = None,
    ignore_errors: bool = True,
):
    """重复任务装饰器
    :param cron: croniter对象 优先级高于repeat
    :param repeat: 每repeat秒重新执行任务，此计时器是从任务调用结束后开始计时
    :param delay: 第一次执行前延迟delay秒
    :param redo: 重复执行多少次 默认一直执行
    :param ignore_errors: 忽略执行任务过程中抛出的异常
    :return:
    """
    # 计算初始延迟时间
    if cron:
        d = 0 if delay < 0 else cron.get_next(start_time=datetime.now(tz=tz)) - time.time()
    else:
        d = delay
    d = max(d, 0)

    def wrapper(func):
        @wraps(func)
        async def task(*args, **kwargs):
            try:
                _redo = -1 if redo is None else redo
                await asyncio.sleep(d)
                while _redo != 0:
                    try:
                        done = func(*args, **kwargs)
                        if asyncio.iscoroutinefunction(func):
                            await done
                    except Exception as err:
                        logger.error(traceback.format_exc())
                        traceback.print_exc()
                        if ignore_errors is False:
                            raise err
                    finally:
                        _redo -= 1
                    _repeat = repeat
                    if cron:
                        now = datetime.now(tz=tz)
                        _repeat = round(cron.get_next(start_time=now) - time.time() + 0.01, 3)
                    await asyncio.sleep(_repeat)
            except asyncio.CancelledError:
                return

        return task

    return wrapper
