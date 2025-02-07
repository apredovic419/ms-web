"""缓存组件
变更日志
    2024-03-31
        1. 增加 Cache.cache_fn 函数级缓存装饰器
        2. Cache类支持为key设置前缀字符串
        3. 增加了Pydantic模型类序列化器
        4. 移除了 StrictRedisCluster 类实例化时 decode_responses=True 参数
    2023-03-12
        1. 删除单例模式，建议使用全局实例替代
        2. 使用连接池管理redis连接
        3. 增加get_or_set方法
    2022-09-01
        1. aioredis已合并到redis，适配更新
"""

import asyncio
import binascii
import logging
import time
import uuid
from collections.abc import Awaitable
from contextlib import AbstractAsyncContextManager, AbstractContextManager
from functools import wraps
from threading import RLock
from typing import Any, Callable, Dict, Optional, TypeVar, Union

from redis.asyncio import ConnectionPool, StrictRedis
from typing_extensions import ParamSpec  # introduced in Python3.10

try:
    from pydantic import BaseModel as _BaseModel

    _PydanticModel = TypeVar("_PydanticModel", bound=_BaseModel)

    class Pydantic:
        """为Pydantic模型类提供的序列化器接口

        :param model: Pydantic模型类
        :param nested: 是否支持JSON嵌套序列化，默认为False
            如果为True，支持嵌套序列化，即支持list和dict类型的嵌套Pydantic模型
        :param dump_extra: 传递给model_dump_json的额外参数
        """

        try:
            import orjson as __json

        except ImportError:
            import json as __json

        serializer = __json

        def __init__(
            self,
            model: type[_PydanticModel],
            nested: bool = False,
            dump_extra: dict = None,
        ):
            self.model = model
            self.nesting = nested
            self.dumps_extra = dump_extra or {}

        def loads(self, s, *args, **kwargs) -> Optional[Union[_PydanticModel, dict, list]]:
            """实现序列化loads接口"""
            if s in {"null", b"null"}:
                return None
            if not self.nesting:
                return self.model.model_validate_json(s)
            data = self.serializer.loads(s)
            if isinstance(data, list):
                return [self.nested_loads(item) for item in data]
            elif isinstance(data, dict):
                return {key: self.nested_loads(value) for key, value in data.items()}

        def nested_loads(self, data: Optional[Union[list, dict, _PydanticModel]], level=0) -> Any:
            if data is None:
                return None

            if isinstance(data, list):
                return [self.nested_loads(item, level + 1) for item in data]

            if isinstance(data, dict):
                try:
                    return self.model.model_validate(data)
                except Exception:
                    # 避免无限递归
                    if level > 10:
                        raise ValueError("nested level too deep")
                return {key: self.nested_loads(value, level + 1) for key, value in data.items()}
            raise TypeError("nested Pydantic model only support list or dict")

        def nested_dumps(self, obj: Union[_PydanticModel, list, dict]) -> Any:
            """嵌套序列化"""
            if obj is None:
                return None
            if isinstance(obj, _BaseModel):
                return obj.model_dump(**self.dumps_extra)

            if isinstance(obj, list):
                data = [self.nested_dumps(item) for item in obj]
                return self.serializer.dumps(data)
            elif isinstance(obj, dict):
                data = {key: self.nested_dumps(value) for key, value in obj.items()}
                return self.serializer.dumps(data)

            raise TypeError("nested Pydantic model only support list or dict")

        def dumps(self, obj: Optional[Union[_PydanticModel, list, dict]], *args, **kwargs):
            if obj is None:
                return "null"
            if not self.nesting:
                return obj.model_dump_json(**self.dumps_extra)
            return self.nested_dumps(obj)

except ImportError:
    Pydantic = _BaseModel = None

T = TypeVar("T")
P = ParamSpec("P")


class nullcontext(
    AbstractContextManager, AbstractAsyncContextManager
):  # noqa: copy from Python3.10
    """Context manager that does no additional processing.

    Used as a stand-in for a normal context manager, when a particular
    block of code is only sometimes used with a normal context manager:

    cm = optional_cm if condition else nullcontext()
    with cm:
        # Perform operation, using optional_cm if condition is True
    """

    def __init__(self, enter_result=None):
        self.enter_result = enter_result

    def __enter__(self):
        return self.enter_result

    def __exit__(self, *excinfo):
        pass

    async def __aenter__(self):
        return self.enter_result

    async def __aexit__(self, *excinfo):
        pass


class PyObj:
    """实现了序列化器接口 只能在内存缓存中使用
    但不进行任何序列化和反序列化工作 因此可以存储任何Python对象
    """

    @staticmethod
    def loads(s: Any, *args, **kwargs) -> Any:  # pylint: disable=W0613
        """实现序列化loads接口"""
        return s

    @staticmethod
    def dumps(obj: Any, *args, **kwargs) -> Any:  # pylint: disable=W0613
        """实现序列化dumps接口"""
        return obj


class MemoryEngine:
    """本地内存作为后端缓存引擎，不支持分布式
    只支持get、set方法
    """

    def __init__(self):
        self.namespace: Dict[str, DataBlock] = {}
        self._check_time = 0
        self._check_interval = 60

    def __call__(self, *args, **kwargs):
        return self

    def _delete(self, key: str, ttl_verify: bool = False) -> bool:
        """删除指定缓存"""
        if key in self.namespace:
            if ttl_verify is False or self.namespace[key].ttl < -1:
                del self.namespace[key]
                return True
        return False

    def et_clear(self) -> None:
        """清理超时缓存"""
        clear_names = []
        if time.time() > self._check_time + self._check_interval:
            self._check_time = time.time()
            for name, block in self.namespace.items():
                if block.ttl < -1:
                    clear_names.append(name)
        for name in clear_names:
            del self.namespace[name]

    async def ttl(self, name) -> int:
        """获取剩余缓存时间 单位秒"""
        self.et_clear()
        if name not in self.namespace:
            return -2
        return int(self.namespace[name].ttl)

    async def get(self, name):
        """实现get接口"""
        self.et_clear()
        if name not in self.namespace:
            return None
        return self.namespace[name].val

    async def set(self, name, value, ex=None, px=None, nx=False, xx=False):
        """实现set接口"""
        if nx and name in self.namespace:
            return
        if xx and name not in self.namespace:
            return
        self.namespace[name] = DataBlock(name, value, ex, px)
        if hasattr(value, "__sizeof__") and value.__sizeof__() > 16384 and (ex or px):
            life = ex if ex else px // 1000
            loop = asyncio.get_event_loop()
            loop.call_later(life * 2, self._delete, name, True)

    async def delete(self, *names) -> int:
        """实现delete接口"""
        c = 0
        for name in names:
            if self._delete(name, ttl_verify=False):
                c += 1
        return c


class DataBlock:
    """内存数据块 封装了有效期"""

    def __init__(self, name: str, value: Any, ex: float = None, px: float = None):
        """
        :param name: key名
        :param value: 存储value
        :param ex: 生命周期，单位秒
        :param px: 生命周期，单位毫秒
        """
        self._name = name
        self._value = value
        self.et = time.time() - 1
        if ex:
            self.et += ex
        if px:
            self.et += px / 1000
        self._expire = ex is None and px is None

    @property
    def val(self):
        return self._value if self.ttl >= -1 else None

    @property
    def ttl(self):
        if self._expire is True:
            return -1
        expire = self.et - time.time() + 1
        return expire if expire >= 0 else -2

    def __repr__(self):
        return f"<name={self._name}>"


def _make_key(fn, args, kwargs, typed, fast_types={int, str}):
    """Make a cache key from optionally typed positional and keyword arguments

    The key is constructed in a way that is flat as possible rather than
    as a nested structure that would take more memory.

    If there is only a single argument and its data type is known to cache
    its hash value, then that argument is returned without a wrapper.  This
    saves space and improves lookup speed.

    """
    key = args
    for item in kwargs.items():
        key += item
    if typed:
        key += tuple(type(v) for v in args)
        if kwargs:
            key += tuple(type(v) for v in kwargs.values())
    elif len(key) == 1 and type(key[0]) in fast_types:
        return f"{fn}::{key[0]}"[:64]
    return f"{fn}::crc32_{binascii.crc32(str(key).encode())}"


class Cache:
    """一个基于redis封装的异步缓存类，它可以快速方便切换多个缓存库
    Cache类默认使用default缓存库，你可以使用select(db_name)切换其他库，并且select支持
    链式调用，但select方法并不会改变原对象指向的default缓存库
    Cache对象通过反射拥有了StrictRedis和StrictRedisCluster类下的所有方法，你可以直接对
    对象执行redis命令，此外Cache还封装了一个方法execute(command, *args, **kwargs)
    相比于反射方法，使用execute方法会自动对返回数据解码
    针对字符串类型，Cache对get和set方法作了优化，当使用get和set方法时，可以同时传递一个序列化器，
    它会查询和存储时自动使用序列化器，也就是说你可以使用set方法存储任意序列化器支持的对象
    """

    logger = logging.getLogger(__name__)
    serializer = __import__("json")

    def __init__(self):
        self._default = "default"
        self._caches: Dict[str, Callable] = {}
        self._prefix_key: Optional[str] = None
        self._is_config = False

    def config(self, config: dict) -> "Cache":
        """重新配置缓存数据库"""
        serializer = config.pop("serializer", "ujson")
        if prefix_key := config.pop("prefix_key", None):
            self._prefix_key = prefix_key
        try:
            self.serializer = __import__(serializer)
        except ModuleNotFoundError:
            pass
        for key, value in config.items():
            try:
                if value.get("engine") == "memory":
                    self._caches[key] = MemoryEngine()
                else:
                    pool = ConnectionPool(**value)
                    self._caches[key] = lambda: StrictRedis(connection_pool=pool)
            except Exception as err:
                self.logger.error(err)
        self._is_config = True
        return self

    def config_once(self, config: dict) -> "Cache":
        """仅配置一次缓存数据库"""
        if self._is_config:
            return self
        return self.config(config)

    @property
    def all(self) -> Dict[str, Callable]:
        """返回全部缓存数据库"""
        return self._caches

    @property
    def current_db(self) -> Union[StrictRedis, MemoryEngine]:
        """返回缓存对象指向的缓存数据库"""
        return self._caches[self._default]()

    def build_key(self, key: str) -> str:
        """返回带前缀的key"""
        if self._prefix_key is None:
            return key
        return f"{self._prefix_key}{key}"

    def select(self, name: str = "default") -> "Cache":
        """获取指定缓存数据库
        支持多次链式调用select方法
        永远不会改变app所绑定的默认缓存数据库
        :param name: 定义的数据库名，默认值为"default"
        :return: Cache对象
        """
        if name not in self._caches:
            raise AttributeError(
                f'Cache database "{name}" not found. ' "Please check CACHES config in settings"
            )
        if name == self._default:
            return self
        instance = Cache()
        instance._caches = self._caches  # pylint: disable=W0212
        instance._prefix_key = self._prefix_key  # pylint: disable=W0212
        instance._default = name  # pylint: disable=W0212
        return instance

    async def execute(self, command: str, *args, **kwargs) -> Any:
        """执行原生命令
        :param command: 执行的redis原生命令
        :return:
        """
        method = getattr(self.current_db, command)
        result = method(*args, **kwargs)
        if isinstance(result, Awaitable):
            result = await result
        if result is None:
            return result
        return self.decode(result)

    def decode(self, value: Union[bytes, int, str], serializer=None, **kwargs) -> Any:
        """对缓存层获取的数据进行反序列化，以返回至应用层"""
        serializer = serializer if serializer else self.serializer
        if serializer == PyObj:
            return value
        try:
            value = int(value)
        except (ValueError, TypeError):
            try:
                value = serializer.loads(value, **kwargs)
            except Exception as err:
                if isinstance(value, bytes):
                    value = value.decode("utf-8")
                elif isinstance(value, str):
                    pass
                else:
                    raise err
        return value

    def encode(self, value: Any, serializer=None, **kwargs) -> Union[bytes, Any]:
        """对应用层传入的数据进行序列化，以存储至缓存层
        序列化能力取决于使用的serializer
        """
        serializer = serializer if serializer else self.serializer
        if isinstance(value, bool) or not isinstance(value, int):
            value = serializer.dumps(value, **kwargs)
        return value

    async def get(self, name, default=None, serializer=None, **kwargs) -> Any:
        """覆盖redis的字符串get方法，提供序列化能力
        :param name: key
        :param default: 找不到时返回值 或者 一个可调用对象/协程
        :param serializer: 使用指定的序列化模块
        :param kwargs: 传递给序列化方法
        :return: 返回缓存结果的反序列化对象
        """
        value = await self.current_db.get(self.build_key(name))
        if not value:
            if callable(default):
                value = default()
            else:
                value = default
            if isinstance(value, Awaitable):
                value = await value
            return value
        return self.decode(value, serializer, **kwargs)

    async def set(
        self,
        name: str,
        value: Any,
        serializer=None,
        *,
        ex=None,
        px=None,
        nx=False,
        xx=False,
        **kwargs,
    ):
        """
        :param name:
        :param value:
        :param serializer: 使用指定的序列化模块
        :param ex: 设置键key的过期时间，单位为秒
        :param px: 设置键key的过期时间，单位为毫秒
        :param nx: 只有键key不存在的时候才会设置key的值
        :param xx: 只有键key存在的时候才会设置key的值
        :param kwargs: 传递给反序列化方法
        :return: 执行结果
        """
        value = self.encode(value, serializer=serializer, **kwargs)
        return await self.current_db.set(self.build_key(name), value, ex, px, nx, xx)

    async def delete(self, *names: str) -> int:
        """删除指定缓存"""
        keys = [self.build_key(name) for name in names]
        return await self.current_db.delete(*keys)

    async def get_or_set(
        self,
        name: str,
        default: Any,
        serializer=None,
        *,
        ex: int = None,
        px: int = None,
        **kwargs,
    ) -> Any:
        """get value from cache, if not exist, set value to cache
        :param name: key
        :param default: 找不到时返回值 或者 一个可调用对象/协程
        :param serializer: 使用指定的序列化模块
        :param ex: 设置键key的过期时间，单位为秒
        :param px: 设置键key的过期时间，单位为毫秒
        :param kwargs: 传递给反序列化方法
        :return: 执行结果
        """
        value = await self.get(name, serializer=serializer)
        if value is None:
            if callable(default):
                value = default()
            else:
                value = default
            # we need confirm value is coroutine or not
            if isinstance(value, Awaitable):
                value = await value
            await self.set(name, value, serializer, ex=ex, px=px, **kwargs)
        return value

    def __getitem__(self, item) -> "Cache":
        return self.select(item)

    def __getattr__(self, attr) -> Any:
        return getattr(self.current_db, attr)

    def cache_fn(
        self,
        expire: int = None,
        serializer=None,
        typed=False,
        format_key: str = None,
        make_key=_make_key,
        enqueue=False,
        skip_null=False,
        lock_timeout=5,
    ):
        """为函数提供缓存功能的装饰器

        :param expire: 缓存过期时间，单位为秒。默认值为None，表示不设置过期时间。
        :param serializer: 用于序列化和反序列化缓存数据的模块。默认值为None，表示使用Cache类的默认序列化模块。
        :param typed: 是否将参数的类型也作为缓存键的一部分。默认值为False。
        :param format_key: 用于格式化缓存键的字符串。默认值为None，表示使用默认的缓存键格式。
                            如果指定了该参数，请使用关键字参数来调用函数。
        :param make_key: 用于生成缓存键的函数。默认值为_make_key，该函数会根据函数的参数生成一个唯一的缓存键。
        :param enqueue: 是否使用队列来管理锁。默认值为False，表示不使用队列，所有的请求都会立即尝试获取锁。
        :param skip_null: 是否跳过None值。默认值为True，表示如果结果为None，则不缓存。
        :param lock_timeout: 获取锁的超时时间，单位为秒。默认值为5秒。
        :return: 装饰后的函数。这个函数在被调用时，会首先尝试从缓存中获取结果。
            如果缓存中没有结果，那么会调用原函数并将结果存入缓存。
        """
        sentinel = object()  # 用于指示缓存未命中的唯一对象
        rlock = RLock()
        if enqueue:
            lock_queue = asyncio.Queue(maxsize=1000)
            key_lock: Optional[dict[str, tuple[asyncio.Lock, int]]] = {}  # (锁对象, 引用计数)
        else:
            lock_queue = key_lock = None
        null_context = nullcontext()

        def decorating_function(user_function: Callable[P, T]) -> Callable[P, T]:
            fn = f"{user_function.__module__}.{user_function.__name__}"[-28:]

            @wraps(user_function)
            async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
                if format_key:
                    key = format_key.format(**kwargs)
                else:
                    key = make_key(fn, args, kwargs, typed)
                lock = await asyncio.wait_for(get_lock(key), timeout=lock_timeout)
                try:
                    async with lock:
                        result = await self.get(key, default=sentinel, serializer=serializer)
                        if result is not sentinel:
                            return result
                        result = user_function(*args, **kwargs)
                        if asyncio.iscoroutine(result):
                            result = await result
                        if not (skip_null and result is None):
                            await self.set(key, result, serializer, ex=expire)
                finally:
                    await put_lock(key, lock)
                return result

            return wrapper

        async def get_lock(key):
            if enqueue is False:
                return null_context
            with rlock:
                if key not in key_lock:
                    if lock_queue.empty():
                        key_lock[key] = (asyncio.Lock(), 0)
                    else:
                        key_lock[key] = (await lock_queue.get(), 0)
                lock, count = key_lock[key]
                key_lock[key] = (lock, count + 1)
                return lock

        async def put_lock(key, lock):
            if isinstance(lock, asyncio.Lock):
                try:
                    lock_queue.put_nowait(lock)
                except asyncio.QueueFull:
                    pass

            if enqueue and key in key_lock:
                # 根据引用计数释放绑定关联，防止内存泄露
                lock, count = key_lock[key]
                if count > 1:
                    key_lock[key] = (lock, count - 1)
                else:
                    del key_lock[key]

        return decorating_function


class ARLock:
    """基于redis实现分布式锁 兼容redis同步/异步客户端
    推荐用法
    r = StrictRedis()
    async with ARLock(r, 'lock-test') as lock:
        if lock.locked:  # 此处判断是否成功获得锁
            ...  # do something
    上面代码等价于如下代码
    lock = ARLock(r, 'lock-test')
    locked = await lock.aio_acquire()
    if locked:
        ...  # do something
    await lock.aio_release()
    """

    __unlock_script = """
    if redis.call("get",KEYS[1]) == ARGV[1] then
        return redis.call("del",KEYS[1])
    else
        return 0
    end
    """

    def __init__(self, conn, name, acquire_timeout=0.1, lock_timeout=0.2):
        """初始化函数
        :params conn: redis客户端对象，它可以是redis模块下的同步或异步客户端实例
        :params name: 锁名称
        :acquire_timeout: 最长获取锁时间 默认值0.1秒
        :lock_timeout: 锁超时时间 默认值0.2秒
        """
        self.conn = conn
        self.name = name
        self.acquire_timeout = acquire_timeout
        self.lock_timeout = int(lock_timeout * 1000)
        self.identifier = None

    @property
    def locked(self) -> bool:
        return self.identifier is not None

    def acquire(self):
        if self.identifier is not None:
            return
        identifier = str(uuid.uuid4())
        ts = time.time()
        end = ts + self.acquire_timeout
        while time.time() < end:
            if self.conn.set(self.name, identifier, px=self.lock_timeout, nx=True):
                self.identifier = identifier
                break
            time.sleep(0.01)

    async def aio_acquire(self):
        if self.identifier is not None:
            return
        identifier = str(uuid.uuid4())
        ts = time.time()
        end = ts + self.acquire_timeout
        while time.time() < end:
            if await self.conn.set(self.name, identifier, px=self.lock_timeout, nx=True):
                self.identifier = identifier
                break
            await asyncio.sleep(0.01)

    def release(self):
        if self.identifier is None:
            return
        unlock = self.conn.register_script(self.__unlock_script)
        key = self.conn.build_key(self.name)
        result = unlock(keys=[key], args=[self.identifier])
        if result:
            self.identifier = None

    async def aio_release(self):
        if self.identifier is None:
            return
        unlock = self.conn.register_script(self.__unlock_script)
        key = self.conn.build_key(self.name)
        result = await unlock(keys=[key], args=[self.identifier])
        if result:
            self.identifier = None

    def __enter__(self):
        self.acquire()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()

    async def __aenter__(self):
        await self.aio_acquire()
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self.aio_release()


# let user to use default cache
cache = default_cache = Cache()
