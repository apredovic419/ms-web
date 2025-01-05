from loguru import logger
from orjson import dumps, loads
from sanic import Sanic
from tortoise.contrib.sanic import register_tortoise

from base import router
from base.custom_typing import SanicContext
from base.inspector import CustomInspector
from component.cache import cache
from component.context import get_or_init_executor, get_or_init_httpx
from component.error import BlueprintErrorHandler
from component.future import TimerManager
from component.logger import logger
from config import settings

app = Sanic(
    name=settings.app_name,
    ctx=SanicContext(),
    loads=loads,
    dumps=dumps,
    inspector_class=CustomInspector,
)


def setup(_app: Sanic):
    _app.config.update(settings.app_config)
    app.extend(config=settings.ext_config)
    if settings.static_root:
        _app.static("/static", settings.static_root)
    if settings.logger:
        logger.configure(**settings.logger)
    register_tortoise(_app, config=settings.db.model_dump())
    executor = get_or_init_executor(max_workers=10)
    _app.ext.dependency(executor)
    httpx = get_or_init_httpx()
    _app.ext.dependency(httpx)
    _app.ctx.cache = cache.config(settings.caches)
    _app.ext.dependency(_app.ctx.cache)
    _app.ctx.timer_manager = TimerManager()
    _app.ext.dependency(_app.ctx.timer_manager)
    _app.error_handler = BlueprintErrorHandler()
    router.register(_app, *settings.auto_discovery)
    _app.ext.dependency(settings)


setup(app)
if __name__ == "__main__":
    app.run(**settings.http_config.model_dump())
