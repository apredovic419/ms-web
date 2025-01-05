from __future__ import annotations

import os
from functools import cached_property
from pathlib import Path
from typing import Any, Optional, Union

from pydantic import BaseModel, Field, MongoDsn, RedisDsn
from pydantic.fields import FieldInfo
from pydantic_settings import BaseSettings, PydanticBaseSettingsSource, SettingsConfigDict

try:
    import tomllib  # support on python3.11+
except ImportError:
    import tomli as tomllib  # compatible


class _TomlConfigSettingsSource(PydanticBaseSettingsSource):
    """
    A simple settings source class that loads variables from a Toml file
    at the project's root.

    """

    @cached_property
    def file_content_json(self):
        if os.environ.get("ENV", "dev") == "prod":
            filepath = "conf/prod.toml"
        else:
            filepath = "conf/dev.toml"
        encoding = self.config.get("env_file_encoding")
        return tomllib.loads(Path(filepath).read_text(encoding))

    def get_field_value(self, field: FieldInfo, field_name: str) -> type[Any, str, bool]:
        field_value = self.file_content_json.get(field_name)
        return field_value, field_name, False

    def prepare_field_value(
        self, field_name: str, field: FieldInfo, value: Any, value_is_complex: bool
    ) -> Any:
        return value

    def __call__(self) -> dict[str, Any]:
        d: dict[str, Any] = {}

        for field_name, field in self.settings_cls.model_fields.items():
            field_value, field_key, value_is_complex = self.get_field_value(field, field_name)
            field_value = self.prepare_field_value(field_name, field, field_value, value_is_complex)
            if field_value is not None:
                d[field_key] = field_value

        return d


class HttpConfig(BaseModel):
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    single_process: bool = True
    workers: int = 1
    access_log: bool = True
    auto_reload: bool = None
    reload_dir: Union[list[str], str] = None

    def __init__(self, **data):
        super().__init__(**data)
        if self.workers < 1:
            self.workers = os.cpu_count() or 1


class JwtAuth(BaseModel):
    salt: str
    algorithm: str = "HS256"
    headers: dict = {"alg": "HS256"}
    expiration: int = 604800
    refresh_expiration: int = 2592000
    authentications: list[str] = []
    permissions: list[str] = []
    throttles: list[str] = []


class SMTPConfig(BaseModel):
    host: str
    port: int
    use_tls: bool
    username: str
    password: str


class GameServerConfig(BaseModel):
    host: str
    port: int


class RPCConfig(BaseModel):
    enable: bool = False
    tls: bool = False
    host: str
    port: int
    root_certificates: str
    certificate_chain: str
    private_key: str
    metadata: Optional[dict]


class GTop100Config(BaseModel):
    authorized: list[str]
    vote_url: str
    site_id: str
    reward: int
    accumulate: int
    limit: int


class DatabaseConnections(BaseModel):
    game: str
    web: str


class DatabaseApp(BaseModel):
    models: list[str]
    default_connection: str


class DatabaseApps(BaseModel):
    game: DatabaseApp
    web: DatabaseApp


class DatabaseConfig(BaseModel):
    use_tz: bool
    timezone: str
    connections: DatabaseConnections
    apps: DatabaseApps


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_nested_delimiter="__")

    env: str = "dev"
    recover: bool = Field(default=False)
    recover_interval: float = Field(default=60)
    k8s: bool = Field(default=False)
    invitation_required: bool = Field(default=False)
    mongo_dsn: Optional[MongoDsn] = None
    redis_dsn: Optional[RedisDsn] = None
    auto_discovery: list[str]
    http_config: HttpConfig = HttpConfig()
    app_config: dict
    ext_config: dict
    static_root: Optional[str] = None
    db: DatabaseConfig
    caches: dict = {"serializer": "ujson", "default": {"engine": "memory"}}
    jwt_auth: Optional[JwtAuth] = None
    logger: dict
    smtp: Optional[SMTPConfig] = None
    game_server: Optional[GameServerConfig] = None
    rpc_server: Optional[RPCConfig] = None
    gtop100: Optional[GTop100Config] = None

    def __init__(self, **values: Any):
        super().__init__(**values)
        if self.redis_dsn:
            self.caches.get("redis", {}).update(
                host=self.redis_dsn.host,
                port=self.redis_dsn.port,
                password=self.redis_dsn.password,
                db=int(self.redis_dsn.path.lstrip("/")) if self.redis_dsn.path else 0,
            )

    @cached_property
    def app_name(self):
        os.environ.setdefault("APP_NAME", "MagicWeb")
        return os.getenv("APP_NAME")

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        return (
            env_settings,
            _TomlConfigSettingsSource(settings_cls),
            init_settings,
            file_secret_settings,
        )


def pull_config():
    """This method allows you to read certain configurations from the configuration service before initialization."""
    ...


pull_config()
settings = Settings()
