import asyncio
import sys
import time

from aiosmtplib import SMTP
from motor.motor_asyncio import AsyncIOMotorClient
from sanic import Sanic

from config import settings
from services.community.library import LibraryService, LibraryMongo, LibraryRDB
from services.rpc.service import MagicService

_app = Sanic.get_app(settings.app_name)


def recover(t: float = 10.0):
    from sanic.__main__ import main

    sys.argv = ["sanic", "inspect", "recover"]

    try:
        while True:
            time.sleep(t)
            main()
    except KeyboardInterrupt:
        pass


@_app.main_process_ready
async def ready(app: Sanic, _):
    if settings.recover:
        app.manager.manage("Sanic-Recover", recover, {"t": settings.recover_interval})


@_app.before_server_start
async def init_service(app: Sanic, loop):
    """initial async service"""
    app.ctx.RPC = MagicService.load_from_config(settings.rpc_server)
    app.ext.dependency(app.ctx.RPC)
    # If using MongoDB, the library data is provided by MongoDB; otherwise, use relational database
    if settings.mongo_dsn:
        db_name = settings.mongo_dsn.path.lstrip("/").split("?")[0]
        app.ctx.mongo = AsyncIOMotorClient(str(settings.mongo_dsn))
        app.ctx.mongo.db = app.ctx.mongo[db_name]
        app.ext.dependency(app.ctx.mongo)
        app.ext.add_dependency(LibraryService, LibraryMongo)
    else:
        app.ext.add_dependency(LibraryService, LibraryRDB)
    if smtp := settings.smtp:
        app.ctx.smtp = SMTP(hostname=smtp.host, port=smtp.port, use_tls=smtp.use_tls)
        app.ext.dependency(app.ctx.smtp)
        app.ext.dependency(smtp)
    if gtop := settings.gtop100:
        app.ext.dependency(gtop)
    if jwt := settings.jwt_auth:
        app.ext.dependency(jwt)


@_app.before_server_stop
async def close_tasks(app, loop):
    """cancel all tasks in the event loop before the server stops"""
    name = sys._getframe().f_code.co_name
    for task in asyncio.all_tasks():
        if task.get_coro().__name__ not in {name, "_server_event"}:
            task.cancel()
