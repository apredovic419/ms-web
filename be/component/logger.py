import importlib
import os
import platform
import warnings
from types import MethodType
from typing import Literal

from component.context import ctx_request_id

IS_PYPY = platform.python_implementation() == "PyPy"


def std_logger():
    import logging
    from logging import handlers

    logging.root.setLevel(logging.NOTSET)
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    formatter = logging.Formatter(
        "%(asctime)s - %(filename)s:%(lineno)d - %(funcName)s[%(process)d]"
        " - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %X",
    )
    ch = logging.StreamHandler()
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    # 为了兼容loguru的add方法
    # 仅实现了必要的功能
    def patch_add(
        self,
        sink: str,
        sink_type: Literal["file", "py_object", "py_class"] = "file",
        sink_config: dict = None,
        **kwargs,
    ):
        handler = _init_sink(sink, sink_type, sink_config)
        if isinstance(handler, str):
            if not os.path.exists(sink):
                os.makedirs(os.path.dirname(sink), exist_ok=True)

            handler = handlers.TimedRotatingFileHandler(
                sink, when="midnight", interval=1, backupCount=7
            )
        handler.setLevel(logging.DEBUG)
        handler.setFormatter(formatter)
        self.addHandler(handler)

    logger.add = MethodType(patch_add, logger)
    return logger


def _init_sink(sink: str, sink_type: Literal["file", "py_object", "py_class"], sink_config: dict):
    if sink_type == "py_object":
        module, target = sink.rsplit(".", 1)
        mod = importlib.import_module(module)
        sink = getattr(mod, target)
    elif sink_type == "py_class":
        module, target = sink.rsplit(".", 1)
        mod = importlib.import_module(module)
        cls = getattr(mod, target)
        if sink_config:
            sink = cls(**sink_config)
        else:
            sink = cls()
    return sink


def _patch_add(
    self,
    sink: str,
    sink_type: Literal["file", "py_object", "py_class"] = "file",
    sink_config: dict = None,
    **kwargs,
):
    """Patched 'add' method for the logger.

    This method is used to add a new sink to the logger.
    It supports adding both file and Python object sinks.

    :param sink: The sink to be added. If 'sink_type' is 'file', this should be the file path.
        If 'sink_type' is 'py_object', this should be the fully qualified name of the Python object.
    :param sink_type: Literal["file", "py_object"], optional The type of the sink to be added.
        It can be either 'file' or 'py_object'. Default is 'file'.
    :param kwargs: Additional keyword arguments to be passed to
        the original 'add' method of the logger.
    :return: The return value of the original 'add' method of the logger.
    """
    if filter_str := kwargs.get("filter", ""):
        # we only support lambda filter
        if filter_str.strip().startswith("lambda"):
            kwargs["filter"] = eval(filter_str.strip())
        else:
            warnings.warn("Only lambda filter is supported, but got: %s" % filter_str)
            kwargs.pop("filter")
    sink = _init_sink(sink, sink_type, sink_config)
    return self.original_add(sink, **kwargs)


if IS_PYPY:
    logger = std_logger()
else:
    try:
        from loguru import logger as _logger

        logger = _logger.patch(
            lambda record: record["extra"].update(request_id=ctx_request_id.get())
        )
        logger.original_add = logger.add
        logger.add = MethodType(_patch_add, logger)
    except ImportError:
        logger = std_logger()
