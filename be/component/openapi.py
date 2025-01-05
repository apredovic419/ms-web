import dataclasses
from inspect import isclass
from typing import (
    Any,
    Callable,
    Literal,
    Optional,
    Set,
    Type,
    TypeVar,
    Union,
    get_args,
    get_origin,
)

from pydantic import BaseModel, RootModel
from sanic_ext.extensions.openapi import openapi
from sanic_ext.extensions.openapi.builders import OperationStore
from sanic_ext.extensions.openapi.openapi import *
from sanic_ext.extensions.openapi.types import Schema, is_pydantic
from sanic_ext.extras.validation.decorator import validate as validate_wrap

T = TypeVar("T")
MODEL = Optional[Union[Type[BaseModel], Type[RootModel], Any]]


def _component(model, ret=None) -> Set[Union[Type[BaseModel], Type[RootModel]]]:
    ret = ret or set()
    if get_origin(model) is Literal:
        return ret
    args = get_args(model)
    if not args:
        return ret
    for item in args:
        ret.update(_component(item, ret))
    for item in args:
        if not isclass(item):
            continue
        if is_pydantic(item):
            ret.add(item)
    return ret


def component(model: Union[Type[BaseModel], Type[RootModel]]):
    for field in model.model_fields.values():
        annotation = field.annotation

        if not isclass(annotation):
            for item in _component(annotation):
                definitions.Component(item)
                component(item)
            continue
        if is_pydantic(annotation):
            definitions.Component(annotation)
            component(annotation)


def response(
    response_model: MODEL = None,
    status: Union[Literal["default"], int] = "default",
    description: Optional[str] = None,
) -> Callable[[T], T]:
    def inner(func):
        if issubclass(response_model, (BaseModel, RootModel)):
            schema = response_model.model_json_schema(ref_template="#/components/schemas/{model}")
            content = {"application/json": schema}
            component(response_model)
        else:
            content = response_model
        openapi.response(status, content, description)(func)
        return func

    return inner


def body(
    model: MODEL,
    *,
    validate: bool = False,
    body_argument: str = "body",
    **kwargs,
) -> Callable[[T], T]:
    def inner(func):
        if issubclass(model, (BaseModel, RootModel)):
            schema = model.model_json_schema(ref_template="#/components/schemas/{model}")
            content = {"application/json": schema}
            component(model)
        else:
            content = model
        v = model if validate is True else False
        return openapi.body(content, validate=v, body_argument=body_argument, **kwargs)(func)

    return inner


def _parameter(model: Union[Type[BaseModel], Any], location: str) -> Callable[[T], T]:
    def inner(func):
        if issubclass(model, (BaseModel,)):
            model_schema = model.model_json_schema()
            for field_name, field_info in model.model_fields.items():
                field_schema = Schema(**model_schema["properties"][field_name])
                OperationStore()[func].parameter(field_name, field_schema, location)
        elif dataclasses.is_dataclass(model):
            fields = dataclasses.fields(model)
            for field in fields:
                OperationStore()[func].parameter(
                    field.name,
                    field.type,
                    location,
                    required=field.default is dataclasses.MISSING,
                    default=field.default,
                )

        return func

    return inner


def query(
    model: Union[Type[BaseModel], Any],
    *,
    validate: bool = False,
    query_argument: str = "query",
) -> Callable[[T], T]:
    def inner(func):
        if validate:
            store = OperationStore()
            old_func = func
            func = validate_wrap(query=model, query_argument=query_argument)(func)
            if builder := store.pop(old_func):
                store[func] = builder

        func = _parameter(model, "query")(func)

        return func

    return inner


def header(model: Union[Type[BaseModel], Any]) -> Callable[[T], T]:
    def inner(func):
        return _parameter(model, "header")(func)

    return inner


def cookie(model: Union[Type[BaseModel], Any]) -> Callable[[T], T]:
    def inner(func):
        return _parameter(model, "cookie")(func)

    return inner
