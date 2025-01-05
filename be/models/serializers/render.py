from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class ForgotPageArgs(BaseModel):
    username: str = ""
    code: str = ""


class DocHelpResponse(BaseModel):
    title: str
    create_time: str
    content: str


class CaptchaRequest(BaseModel):
    __support_domain__ = {
        "qq.com",
        "gmail.com",
        "163.com",
        "126.com",
        "yahoo.com",
        "foxmail.com",
        "hotmail.com",
        "fcp233.cn",
        "outlook.com",
        "139.com",
        "189.com",
        "aliyun.com",
        "sina.cn",
        "sina.com",
    }

    email: str

    def valid_domain(self) -> bool:
        return self.email.split("@")[-1].lower() in self.__support_domain__


class RegisterRequest(BaseModel):
    username: str = Field(min_length=5, max_length=13)
    email: str = Field(pattern=r"[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$")
    code: str
    pwd1: str = Field(pattern=r"[\da-zA-Z!@#$%^&*,./|}{()_+=\-]{6,16}$")
    pwd2: str
    birthday: date
    invitation_code: str = ""
    captcha: str = ""

    @field_validator("username")
    @classmethod
    def to_lower(cls, v: str):
        return v.lower()

    @model_validator(mode="after")
    def check_pwd(self):
        if self.pwd1 != self.pwd2:
            raise ValueError("两次密码不一致")
        return self


class ResetPwdCaptchaRequest(BaseModel):
    username: str


class ResetPasswordRequest(BaseModel):
    username: str
    password: str = Field(pattern=r"[\da-zA-Z!@#$%^&*,./|}{()_+=\-]{6,16}$")
    captcha: str
