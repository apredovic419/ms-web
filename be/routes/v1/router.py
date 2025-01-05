from sanic import Blueprint, Sanic

from config import settings

app = Sanic.get_app(settings.app_name)
bp = Blueprint("v1", url_prefix="/api/v1")
