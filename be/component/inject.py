import os
import warnings
from typing import Any, Dict, Generic, Type, TypeVar, get_origin, get_type_hints ,Union
from types import MethodType

import pydantic
from sanic import BadRequest, Request, Sanic
from sanic_ext.exceptions import ValidationError

T = TypeVar("T")


def clean_data(model: Type[object], data: Dict[str, Any]) -> Dict[str, Any]:
    hints = get_type_hints(model)
    return {key: _coerce(hints[key], value) for key, value in data.items()}


def _coerce(param_type, value: Any) -> Any:
    if get_origin(param_type) != list and isinstance(value, list) and len(value) == 1:
        value = value[0]

    return value


class InjectPydantic(Generic[T]):
    """pydantic模型注入

    :param m: pydantic模型
    :param kwargs: 额外参数，这些参数会传递给模型的model_validate方法
    """

    def __init__(self, m: Type[T], **kwargs):
        self.model = m
        self.kwargs = kwargs

    def query(self, request: Request) -> T:
        """从请求参数中提取数据"""
        data = clean_data(self.model, request.args)
        try:
            return self.model.model_validate(data)
        except pydantic.ValidationError as err:
            raise ValidationError(str(err))

    async def body(self, request: Request) -> T:
        """从请求体中提取数据"""
        await request.receive_body()
        try:
            data = request.json
        except BadRequest:
            data = clean_data(self.model, request.form)
        try:
            return self.model.model_validate(data)
        except pydantic.ValidationError as err:
            raise ValidationError(str(err))

    async def auto(self, request: Request) -> T:
        """从请求体或请求参数中提取数据"""
        try:
            return await self.body(request)
        except:
            return self.query(request)

    def model_validate(self, data: Any) -> T:
        return self.model.model_validate(data, **self.kwargs)


class Dependency(Generic[T]):
    def __init__(self, typ: Union[Type[T], MethodType], method: str = "auto"):
        app = Sanic.get_app(os.getenv("APP_NAME"))

        if isinstance(typ, MethodType):
            constructor = typ
            typ: Type[T] = typ.__self__  # type: ignore # noqa
            app.ext.add_dependency(typ, constructor)
        elif issubclass(typ, pydantic.BaseModel):
            inj = InjectPydantic(typ)
            method = getattr(inj, method)
            app.ext.add_dependency(typ, method)
        else:
            app.ext.add_dependency(typ)
            warnings.warn(
                f"The 'Dependency' class currently maybe not support {typ}",
                DeprecationWarning,
            )

    def __bool__(self):
        return False
