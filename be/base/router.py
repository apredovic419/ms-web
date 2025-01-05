from glob import glob
from importlib import import_module, util
from inspect import getmembers
from pathlib import Path
from types import ModuleType
from typing import Union

from sanic import Blueprint

__all__ = ("register",)


def register(app, *module_names: Union[str, ModuleType], recursive: bool = False):
    """自动发现module_names下的蓝图，也可以基于该方法向app绑定监听事件及中间件
    :param app: 应用实例
    :param module_names: 模块或py文件的字符串路径
    :param recursive: 是否递归查找目录
    """
    mod = app.__module__
    blueprints = set()
    _imported = set()

    def _find_bps(module):
        nonlocal blueprints

        for _, member in getmembers(module):
            if isinstance(member, Blueprint):
                blueprints.add(member)

    for module in module_names:
        if isinstance(module, str):
            module = import_module(module, mod)
            _imported.add(module.__file__)
        _find_bps(module)

        if recursive:
            base = Path(module.__file__).parent
            for path in glob(f"{base}/**/*.py", recursive=True):
                if path not in _imported:
                    name = "module"
                    if "__init__" in path:
                        *_, name, __ = path.split("/")
                    spec = util.spec_from_file_location(name, path)
                    spec_mod = util.module_from_spec(spec)
                    _imported.add(path)
                    spec.loader.exec_module(spec_mod)
                    _find_bps(spec_mod)

    for bp in blueprints:
        app.blueprint(bp)
