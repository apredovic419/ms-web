from asyncio import iscoroutine
from functools import wraps
from typing import Optional

from jinja2 import Environment, FileSystemLoader
from jinja2.runtime import Undefined
from sanic.models.handler_types import RouteHandler
from sanic.request import Request
from sanic.response import html


class ExEnvironment(Environment):
    def getitem(self, obj, argument):
        v = Environment.getitem(self, obj, argument)
        return "" if isinstance(v, Undefined) else v

    def getattr(self, obj, attribute):
        v = Environment.getattr(self, obj, attribute)
        return "" if isinstance(v, Undefined) else v


def render(
    request: Request,
    template_name: str,
    context: Optional[dict] = None,
    headers: Optional[dict] = None,
    status: int = 200,
):
    """Returns a rendered file."""
    if not context:
        context = {}
    temp = ExEnvironment(loader=FileSystemLoader("templates"))
    temp = temp.get_template(template_name)
    temp.environment.globals.update(url_for=request.app.url_for)
    _text = temp.render(request=request, **context)
    return html(_text, status, headers)


def cache_page(second: int):
    """Cache return page implementation mechanism Add Cache-Control to the HTTP response header
    Different from the back-end caching function provided by the Cache class, cache_page is a front-end cache that depends on the browser.
    How to use
        1. Single view: Use the decorator @cache_page(60) directly in the view function or class method
        2. Global view: There are two ways to use cached pages in the entire view class
            2.1 Add the decorator @cache_page(60) to the class method dispatch_request
            2.2 Call the cache_page method in the routing table, such as cache_page(60)(Monitor.as_view())
    :param second: cache expiration time unit: seconds
    :return:
    """

    def wrap(func: RouteHandler) -> RouteHandler:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            response = func(*args, **kwargs)
            if iscoroutine(response):
                response = await response
            headers = {"Cache-Control": "max-age=%i" % second}
            response.headers.update(headers)
            return response

        return wrapper

    return wrap
