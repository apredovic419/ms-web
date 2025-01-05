from sanic import Sanic

from component.future import scheduled
from config import settings
from services.account.gtop100 import GTop100Service

_app = Sanic.get_app(settings.app_name)


@scheduled(repeat=60)
async def gtop_vote(app=None):
    """
    Check the IPs that voted today on GTop100
    :return:
    """
    cache = app.ctx.cache
    rpc = app.ctx.RPC
    server = GTop100Service(settings.gtop100, cache, rpc)
    await server.grant_reward()


if not _app.name.startswith("Test"):
    _app.add_task(gtop_vote(_app))
