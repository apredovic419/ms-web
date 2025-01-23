from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer, model_validator


class UserName(BaseModel):
    username: str


class LoginRequest(UserName):
    password: str


class LoginResponse(BaseModel):
    token: str
    refresh_token: str
    expires_in: int
    refresh_expires_in: int
    token_type: str = "Bearer"


class UserInfoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    name: str
    nick: Optional[str] = ""
    email: Optional[str]
    logged_in: int = Field(alias="loggedin")
    last_login: Optional[datetime] = Field(alias="lastlogin")
    nx: int = Field(alias="nxCredit")
    mp: int = Field(alias="maplePoint")
    np: int = Field(alias="nxPrepaid")
    slots: int = Field(alias="characterslots")
    gender: int
    banned: int = 0
    banned_reason: Optional[str] = None
    web_admin: Optional[int] = 0
    reward_point: int = Field(alias="rewardpoints")
    vote_points: int = Field(alias="votepoints")
    language: int
    create_at: datetime = Field(alias="createdat")


class UpdatePwdRequest(BaseModel):
    origin_pwd: str = Field(alias="op")
    new_pwd: str = Field(alias="password")


class CheckInRequest(BaseModel):
    character_id: int


class ClientUpdateRequest(BaseModel):
    size: int = 0


class ClientUpdateResponse(BaseModel):
    key: str


class GameOnlineResponse(BaseModel):
    status: str
    invite: bool = False
    count: int
    characters: Optional[list[str]] = None


class CharRankRequest(BaseModel):
    page: int = Field(default=1, ge=1)
    size: int = 10
    job: Literal[
        "all",
        "beginner",
        "warrior",
        "magician",
        "bowman",
        "thief",
        "pirate",
        "cygnus",
        "aran",
    ] = "all"
    sort: Literal["level", "fame", "quest", "monsterbook"] = "level"

    @property
    def cond(self):
        c = {"gm__lt": 2}
        if self.job == "beginner":
            c["job"] = 0
        elif self.job == "warrior":
            c["job__range"] = (100, 132)
        elif self.job == "magician":
            c["job__range"] = (200, 232)
        elif self.job == "bowman":
            c["job__range"] = (300, 322)
        elif self.job == "thief":
            c["job__range"] = (400, 422)
        elif self.job == "pirate":
            c["job__range"] = (500, 522)
        elif self.job == "cygnus":
            c["job__range"] = (1000, 1999)
        elif self.job == "aran":
            c["job__range"] = (2100, 2112)
        return c

    @model_validator(mode="after")
    def transform(self):
        if self.sort not in {"fame", "quest", "monsterbook"}:
            self.sort = "level"
        return self

    def __str__(self):
        return f"{self.size}-{self.job}-{self.sort}-{self.page}"


class GuildItem(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    guild_id: int = Field(alias="guildid")
    gp: int = Field(alias="GP")
    logo: Optional[int]
    logo_color: int = Field(alias="logoColor")
    name: str
    logo_bg: Optional[int] = Field(alias="logoBG")
    logo_bg_color: int = Field(alias="logoBGColor")
    member: int
    capacity: int
    notice: Optional[str] = Field(alias="pub_notice")
    alliance_name: Optional[str]
    leader_name: str
    leader_id: int = Field(alias="leader")


class CharRankItem(BaseModel):
    id: int
    name: str
    level: int
    job: int
    job_rank: int
    fame: int
    rank: int
    job_name: str = ""
    guild_name: str = ""
    guild: Optional[GuildItem] = None
    quest_count: int = 0
    monster_book: int = 0


class CharRankResponse(BaseModel):
    total: int
    items: list[CharRankItem]


class PageInfo(BaseModel):
    page: int = Field(default=1, ge=1)
    size: int = 10

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size


class GuildRankResponse(BaseModel):
    total: int
    items: list[GuildItem]


class CharInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    account_id: int = Field(alias="accountid")
    name: str
    level: int
    str_: int = Field(alias="str")
    dex: int
    int_: int = Field(alias="int")
    luk: int
    max_hp: int = Field(alias="maxhp")
    max_mp: int = Field(alias="maxmp")
    gender: int
    map: int
    rank: int
    meso: int
    job: int
    gender: int
    fame: int
    hair: int
    face: int
    skin_color: int = Field(alias="skincolor")
    guild_id: int = Field(alias="guildid")
    create_date: datetime = Field(alias="createdate")
    last_logout_time: datetime = Field(alias="lastLogoutTime")
    jail_expire: int = Field(alias="jailexpire")


class CharListResponse(BaseModel):
    items: list[CharInfo]


class CharAvatarResponse(BaseModel):
    character_id: int
    image: str


class InvItemModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(alias="inventoryitemid")
    type: int
    character_id: int = Field(alias="characterid")
    item_id: int = Field(alias="itemid")
    inventory_type: int = Field(alias="inventorytype")
    position: int
    quantity: int
    owner: str
    pet_id: int = Field(alias="petid")
    flag: int
    expiration: int
    gift_from: str = Field(alias="giftFrom")


class CharItemResponse(BaseModel):
    items: list[InvItemModel]


class NoticeItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    create_time: datetime

    @field_serializer("create_time")
    def format_time(self, value):
        return value.strftime("%Y-%m-%d %X GMT%z")


class NoticeListResponse(BaseModel):
    items: list[NoticeItem]
    total: int


class CSItemType(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class CashShopTypeResponse(BaseModel):
    items: list[CSItemType]


class CSPoster(BaseModel):
    href: str = ""
    doc: str = ""
    redirect: str = ""
    title: str = ""


class CSItem(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    title: str
    desc: Optional[str] = ""
    category: Optional[str] = ""
    item_id: int = Field(alias="itemId")
    item_ico: Optional[str] = Field(alias="itemIco")
    price: int
    currency: str
    display: bool
    can_buy: bool = Field(alias="canBuy")
    receive_method: int = Field(alias="receiveMethod")
    ban_gift: bool = Field(alias="banGift")
    create_time: datetime
    start_sale_time: Optional[datetime]
    end_sale_time: Optional[datetime]
    amount: Optional[int]
    limit_group: Optional[str]
    user_limit: Optional[int]
    char_limit: Optional[int]
    expiration: Optional[int]

    @field_serializer("start_sale_time", "end_sale_time")
    def format_time(self, value: Optional[datetime]):
        if value:
            return value.strftime("%Y-%m-%d %X GMT%z")
        return value


class CSItemQueryArgs(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=24, ge=1, le=100)
    keyword: str = ""
    category: str = ""

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


class CSItemQueryResponse(BaseModel):
    total: int
    count: int
    items: list[CSItem]


class CSItemBuyRequest(BaseModel):
    shop_id: int
    character_id: int


class CSItemGiftRequest(BaseModel):
    shop_id: int
    accept: str
    birthday: str


class LibraryQueryArgs(PageInfo):
    category: str = "all"
    query: str = ""


class LibrarySourceArgs(PageInfo):
    category: Optional[str] = None
    oid: int = -1


class LibraryQueryResponse(BaseModel):
    total: int
    size: int
    page: int
    items: list[dict]


class VoteRedirectResponse(BaseModel):
    url: str
