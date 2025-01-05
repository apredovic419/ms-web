"""
游戏通用Model
"""
from typing import List, Optional

import bcrypt
from tortoise import Model, fields
from tortoise.expressions import F
from tortoise.functions import Count, Sum


class User(Model):

    class Meta:
        table = "accounts"
        indexes = (
            ("id_2", "id", "nxCredit", "maplePoint", "nxPrepaid"),
            ("id", "id", "name"),
            ("ranking1", "id", "banned"),
        )

    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=13, unique=True)
    password = fields.CharField(max_length=128)
    pin = fields.CharField(max_length=10, default="")
    pic = fields.CharField(max_length=26, default="")
    loggedin = fields.SmallIntField(default=0)
    lastlogin = fields.DatetimeField(null=True)
    createdat = fields.DatetimeField(auto_now_add=True)
    birthday = fields.DateField(default="2018-06-20")
    banned = fields.SmallIntField(default=0)
    banreason = fields.TextField(null=True)
    macs = fields.TextField(null=True)
    nxCredit = fields.IntField(null=True, default=0)
    maplePoint = fields.IntField(null=True, default=0)
    nxPrepaid = fields.IntField(null=True, default=0)
    characterslots = fields.SmallIntField(default=3)
    gender = fields.SmallIntField(default=10)
    tempban = fields.DatetimeField(default="2018-06-20 00:00:00")
    greason = fields.SmallIntField(default=0)
    tos = fields.SmallIntField(default=0)
    sitelogged = fields.TextField(null=True)
    webadmin = fields.IntField(null=True, default=0)
    nick = fields.CharField(max_length=20, default=None, null=True)
    mute = fields.IntField(null=True, default=0)
    email = fields.CharField(max_length=45, default=None, null=True)
    ip = fields.TextField(null=True)
    rewardpoints = fields.IntField(default=0)
    votepoints = fields.IntField(default=0)
    hwid = fields.CharField(max_length=12, default="")
    language = fields.SmallIntField(default=2)

    @staticmethod
    def create_password(password: str) -> str:
        hash_pw = bcrypt.gensalt(12)
        pwd = bcrypt.hashpw(bytes(password, encoding="utf8"), hash_pw)
        return pwd.decode()

    @staticmethod
    async def check_password(user: str, password: str) -> int:
        """核查账号密码
        :param user: 账号名
        :param password: 明文密码
        :return: -1 (账号不存在) 0（密码不正确） 1 (密码正确)
        """
        u = await User.filter(name=user).first()
        if not u:
            return -1
        hash_pw = bytes(u.password, encoding="utf8")
        if bcrypt.hashpw(bytes(password, encoding="utf8"), hash_pw) == hash_pw:
            return 1
        else:
            return 0

    @staticmethod
    async def create(user: str, password: str, **kwargs) -> Optional["User"]:
        """创建账号"""
        u = await User.filter(name=user)
        if u:
            return None
        password = User.create_password(password)
        user = User(name=user, password=password, **kwargs)
        await user.save()
        return user

    def set_password(self, password: str) -> None:
        """手动保存方可生效"""
        self.password = User.create_password(password)

    def __str__(self):
        return self.name

    @classmethod
    async def add_nx(cls, user_id: int, nx: int) -> None:
        await cls.filter(id=user_id).update(nxCredit=F("nxCredit") + nx)

    async def sos(self) -> int:
        """卡号自救
        :return: 0 (成功) 1 (账号未在线)
        """
        if self.loggedin != 0:
            await User.filter(id=self.id).update(loggedin=1)
            return 0
        return 1


class Character(Model):

    class Meta:
        table = "characters"
        indexes = (
            ("id", "accountid", "name"),
            ("level", "exp"),
            ("gm", "job"),
            ("accountid", "world"),
        )

    id = fields.IntField(pk=True)
    accountid = fields.IntField(index=True, default=0)
    world = fields.IntField(default=0)
    name = fields.CharField(max_length=13, default="")
    level = fields.SmallIntField(default=1)
    exp = fields.IntField(default=0)
    gachaexp = fields.IntField(default=0)
    str = fields.IntField(default=12)
    dex = fields.IntField(default=5)
    luk = fields.IntField(default=4)
    int = fields.IntField(default=4)
    hp = fields.IntField(default=50)
    mp = fields.IntField(default=5)
    maxhp = fields.IntField(default=50)
    maxmp = fields.IntField(default=5)
    meso = fields.IntField(default=0)
    hpMpUsed = fields.IntField(default=0)
    job = fields.IntField(default=0)
    skincolor = fields.IntField(default=0)
    gender = fields.IntField(default=0)
    fame = fields.IntField(default=0)
    fquest = fields.IntField(default=0)
    hair = fields.IntField(default=0)
    face = fields.IntField(default=0)
    ap = fields.IntField(default=0)
    sp = fields.CharField(max_length=128, default="0,0,0,0,0,0,0,0,0,0")
    map = fields.IntField(default=0)
    spawnpoint = fields.IntField(default=0)
    gm = fields.IntField(default=0)
    party = fields.IntField(default=0, index=True)
    buddyCapacity = fields.IntField(default=25)
    createdate = fields.DatetimeField(auto_now_add=True)
    rank = fields.IntField(default=1)
    rankMove = fields.IntField(default=0)
    jobRank = fields.IntField(default=1)
    jobRankMove = fields.IntField(default=0)
    guildid = fields.IntField(default=0)
    guildrank = fields.IntField(default=5)
    messengerid = fields.IntField(default=0)
    messengerposition = fields.IntField(default=4)
    mountlevel = fields.IntField(default=1)
    mountexp = fields.IntField(default=0)
    mounttiredness = fields.IntField(default=0)
    omokwins = fields.IntField(default=0)
    omoklosses = fields.IntField(default=0)
    omokties = fields.IntField(default=0)
    matchcardwins = fields.IntField(default=0)
    matchcardlosses = fields.IntField(default=0)
    matchcardties = fields.IntField(default=0)
    MerchantMesos = fields.IntField(default=0)
    HasMerchant = fields.SmallIntField(default=0)
    equipslots = fields.IntField(default=24)
    useslots = fields.IntField(default=24)
    setupslots = fields.IntField(default=24)
    etcslots = fields.IntField(default=24)
    familyId = fields.IntField(default=-1)
    monsterbookcover = fields.IntField(default=0)
    allianceRank = fields.IntField(default=5)
    vanquisherStage = fields.IntField(default=0)
    ariantPoints = fields.IntField(default=0)
    dojoPoints = fields.IntField(default=0)
    lastDojoStage = fields.IntField(default=0)
    finishedDojoTutorial = fields.SmallIntField(default=0)
    vanquisherKills = fields.IntField(default=0)
    summonValue = fields.IntField(default=0)
    partnerId = fields.IntField(default=0)
    marriageItemId = fields.IntField(default=0)
    reborns = fields.IntField(default=0)
    PQPoints = fields.IntField(default=0)
    dataString = fields.CharField(max_length=64, default="")
    lastLogoutTime = fields.DatetimeField(default="2015-01-01 05:00:00")
    lastExpGainTime = fields.DatetimeField(default="2015-01-01 05:00:00")
    partySearch = fields.SmallIntField(default=1)
    jailexpire = fields.BigIntField(default=0)

    def __str__(self):
        return f"<{self.id} - {self.name}>"

    async def show_equip_info(self) -> dict[str, "InvItem"]:
        """获取角色外观装备信息
        :return: 装备信息
        """
        # -1 帽子  -2 脸饰 -3 眼饰 -4 耳环 -5 上衣 -6 裤子 -7 鞋子
        # -8 手套 -9 披风 -109 现金披风 -10 盾牌 -11 武器 -12 戒指 -17 吊坠
        equip_info = {}
        equips = await InvItem.filter(characterid=self.id, inventorytype=-1)
        for equip in equips:
            if equip.position in (-1, -101):
                if "Cap" not in equip_info or equip.position == -101:
                    equip_info["Cap"] = equip
            elif equip.position in (-2, -102):
                if "AccessoryFace" not in equip_info or equip.position == -102:
                    equip_info["AccessoryFace"] = equip
            elif equip.position in (-3, -103):
                if "AccessoryEye" not in equip_info or equip.position == -103:
                    equip_info["AccessoryEye"] = equip
            elif equip.position in (-4, -104):
                if "AccessoryEar" not in equip_info or equip.position == -104:
                    equip_info["AccessoryEar"] = equip
            elif equip.position in (-5, -105):
                if "Coat" not in equip_info or equip.position == -105:
                    equip_info["Coat"] = equip
            elif equip.position in (-6, -106):
                if "Pants" not in equip_info or equip.position == -106:
                    equip_info["Pants"] = equip
            elif equip.position in (-7, -107):
                if "Shoes" not in equip_info or equip.position == -107:
                    equip_info["Shoes"] = equip
            elif equip.position in (-8, -108):
                if "Glove" not in equip_info or equip.position == -108:
                    equip_info["Glove"] = equip
            elif equip.position in (-9, -109):
                if "Cape" not in equip_info or equip.position == -109:
                    equip_info["Cape"] = equip
            elif equip.position in (-10, -110):
                if "Shield" not in equip_info or equip.position == -110:
                    equip_info["Shield"] = equip
            elif equip.position in (-11, -111):
                if "Weapon" not in equip_info or equip.position == -111:
                    equip_info["Weapon"] = equip
        return equip_info


class Guild(Model):
    class Meta:
        table = "guilds"
        table_description = "家族"
        indexes = (("guildid", "name"),)

    _member_count: int = 0
    _leader_name: str = ""
    _alliance_name: str = ""

    guildid = fields.IntField(pk=True)
    leader = fields.IntField(default=0)
    GP = fields.IntField(default=0)
    logo = fields.IntField(null=True, default=None)
    logoColor = fields.SmallIntField(default=0)
    name = fields.CharField(max_length=45)
    rank1title = fields.CharField(max_length=45, default="Master")
    rank2title = fields.CharField(max_length=45, default="Jr. Master")
    rank3title = fields.CharField(max_length=45, default="Member")
    rank4title = fields.CharField(max_length=45, default="Member")
    rank5title = fields.CharField(max_length=45, default="Member")
    capacity = fields.IntField(default=10)
    logoBG = fields.IntField(null=True, default=None)
    logoBGColor = fields.SmallIntField(default=0)
    notice = fields.CharField(max_length=101, default=None, null=True)
    signature = fields.IntField(default=0)
    allianceId = fields.IntField(default=0)

    @property
    def pub_notice(self):
        if not self.notice:
            return ""
        if isinstance(self.notice, str) and self.notice.startswith("[p]"):
            return self.notice.replace("[p]", "", 1).strip()
        return ""

    @property
    def member(self):
        return self._member_count

    @member.setter
    def member(self, value: int):
        self._member_count = value

    @property
    def leader_name(self):
        return self._leader_name

    @leader_name.setter
    def leader_name(self, value: str):
        self._leader_name = value

    @property
    def alliance_name(self):
        return self._alliance_name

    @alliance_name.setter
    def alliance_name(self, value: str):
        self._alliance_name = value

    @staticmethod
    async def get_top_n(n=100) -> List["Guild"]:
        guilds = await Guild.filter().limit(n).order_by("-GP")
        members = (
            await Character.filter(guildid__in=[guild.guildid for guild in guilds])
            .annotate(count=Count("id"))
            .group_by("guildid")
            .values("guildid", "count")
        )
        members_dict = {member["guildid"]: member["count"] for member in members}
        for guild in guilds:
            guild.member_count = members_dict.get(guild.guildid, 0)
        sort_guilds = list(
            sorted(
                guilds,
                reverse=True,
                key=lambda g: g.GP * 1000
                + members_dict[g.guildid] * 100
                + g.capacity * 10
                - g.guildid,
            )
        )
        return sort_guilds


class InvItem(Model):
    class Meta:
        table = "inventoryitems"
        table_description = "背包物品"

    inventoryitemid = fields.IntField(pk=True)
    type = fields.SmallIntField()
    characterid = fields.IntField(null=True, default=None, index=True)
    accountid = fields.IntField(null=True, default=None)
    itemid = fields.IntField(default=0, description="物品代码")
    inventorytype = fields.IntField(default=0, description="物品种类 1装备 2消耗 3设置 4其他 5特殊")
    position = fields.IntField(default=0, description="背包位置")
    quantity = fields.IntField(default=0, description="数量")
    owner = fields.TextField()
    petid = fields.IntField(default=-1)
    flag = fields.IntField()
    expiration = fields.BigIntField(default=-1)
    giftFrom = fields.CharField(max_length=26)


class InvEquip(Model):
    class Meta:
        table = "inventoryequipment"
        table_description = "装备属性"

    inventoryequipmentid = fields.IntField(pk=True)
    inventoryitemid = fields.IntField(default=0, description="指向InvItem的主键")
    upgradeslots = fields.IntField(default=0)
    level = fields.IntField(default=0)
    str = fields.IntField(default=0)
    dex = fields.IntField(default=0)
    int = fields.IntField(default=0)
    luk = fields.IntField(default=0)
    hp = fields.IntField(default=0)
    mp = fields.IntField(default=0)
    watk = fields.IntField(default=0)
    matk = fields.IntField(default=0)
    wdef = fields.IntField(default=0)
    mdef = fields.IntField(default=0)
    acc = fields.IntField(default=0)
    avoid = fields.IntField(default=0)
    hands = fields.IntField(default=0)
    speed = fields.IntField(default=0)
    jump = fields.IntField(default=0)
    locked = fields.IntField(default=0)
    vicious = fields.IntField(default=0)
    itemlevel = fields.IntField(default=1)
    itemexp = fields.IntField(default=0)
    ringid = fields.IntField(default=-1)


class DueyPackage(Model):
    class Meta:
        table = "dueypackages"
        table_description = "快递数据"

    PackageId = fields.IntField(pk=True)
    ReceiverId = fields.IntField()
    SenderName = fields.CharField(max_length=13)
    Mesos = fields.IntField(null=True, default=0)
    TimeStamp = fields.DatetimeField()
    Message = fields.CharField(max_length=200, null=True, default=None)
    Checked = fields.SmallIntField(null=True, default=1)
    Type = fields.SmallIntField(null=True, default=0)


class Gift(Model):
    class Meta:
        table = "gifts"
        table_description = "商城礼物"

    id = fields.IntField(pk=True)
    to = fields.IntField(description="被赠人Id")
    _from = fields.CharField(source_field="from", max_length=13)
    message = fields.TextField()
    sn = fields.IntField(description="商品编号")
    ring = fields.IntField(source_field="ringid", default=-1, description="戒指")


class QuestStatus(Model):
    class Meta:
        table = "queststatus"
        table_description = "任务状态"

    queststatusid = fields.IntField(pk=True)
    characterid = fields.IntField(description="角色ID")
    quest = fields.IntField(description="任务ID")
    status = fields.IntField(default=0, description="状态")
    time = fields.IntField()
    expire = fields.BigIntField()
    forfeited = fields.IntField()
    completed = fields.IntField(description="完成1 未完成0")
    info = fields.SmallIntField()

    @classmethod
    async def stat_completed_by_characters(cls, characters=None) -> dict[int, int]:
        """统计完成任务数量
        :param characters: 角色ID列表, 默认为None, 表示所有角色
        :return: {角色ID: 完成任务数量}
        """
        queryset = cls.filter(completed=1)
        if characters:
            queryset = queryset.filter(characterid__in=characters)
        queryset = queryset.annotate(count=Count("queststatusid")).group_by("characterid")
        queryset = queryset.order_by("-count").values("characterid", "count")
        return {item["characterid"]: item["count"] async for item in queryset}


class MonsterBook(Model):
    class Meta:
        table = "monsterbook"
        table_description = "怪物书"

    charid = fields.IntField()
    cardid = fields.IntField()
    level = fields.IntField(null=True, default=1)

    @classmethod
    async def stat_level_by_characters(cls, characters=None) -> dict[int, int]:
        """统计怪物书卡牌等级
        :param characters: 角色ID列表, 默认为None, 表示所有角色
        :return: {角色ID: 卡牌数量}
        """
        queryset = cls.filter()
        if characters:
            queryset = queryset.filter(charid__in=characters)
        queryset = queryset.annotate(count=Sum("level")).group_by("charid")
        queryset = queryset.order_by("-count").values("charid", "count")
        return {item["charid"]: item["count"] async for item in queryset}


class IpBans(Model):
    class Meta:
        table = "ipbans"
        table_description = "ip禁止"

    ipbanid = fields.IntField(pk=True)
    ip = fields.CharField(40)
    aid = fields.CharField(40)


class Pet(Model):
    class Meta:
        table = "pets"
        table_description = "宠物列表"

    petid = fields.IntField(pk=True)
    name = fields.CharField(13, null=True, default=None)
    level = fields.IntField(default=1)
    closeness = fields.IntField(default=0)
    fullness = fields.IntField(default=100)
    summoned = fields.SmallIntField(default=0)
    flag = fields.IntField(default=0)


class DropData(Model):
    class Meta:
        table = "drop_data"
        table_description = "怪物掉落数据"

    id = fields.BigIntField(pk=True)
    dropperid = fields.IntField()
    itemid = fields.IntField(default=0)
    minimum_quantity = fields.IntField(default=1)
    maximum_quantity = fields.IntField(default=1)
    questid = fields.IntField(default=0)
    chance = fields.IntField(default=0)


class NpcShop(Model):
    class Meta:
        table = "shops"
        table_description = "NPC - 商店ID对应表"

    shopid = fields.IntField(pk=True)
    npcid = fields.IntField()


class NpcShopItem(Model):
    class Meta:
        table = "shopitems"
        table_description = "NPC商店数据"

    shopitemid = fields.IntField(pk=True)
    shopid = fields.IntField()
    itemid = fields.IntField()
    price = fields.IntField(default=0)
    pitch = fields.IntField(default=0)
    position = fields.IntField()


class NameChange(Model):
    class Meta:
        table = "namechanges"
        table_description = "改名记录"

    id = fields.IntField(pk=True)
    characterid = fields.IntField()
    old = fields.CharField(13)
    new = fields.CharField(13)
    requestTime = fields.DatetimeField()
    completionTime = fields.DatetimeField(null=True, default=True)


class CustomAuthority(Model):
    class Meta:
        table = "custom_authority"
        table_description = "动态权限表"

    id = fields.IntField(pk=True)
    characterid = fields.IntField()
    command = fields.CharField(255)
    expire = fields.DatetimeField()


class Alliance(Model):
    class Meta:
        table = "alliance"
        table_description = "联盟"

    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=13, index=True)
    capacity = fields.IntField(default=0)
    notice = fields.CharField(max_length=20)
    rank1 = fields.CharField(max_length=11)
    rank2 = fields.CharField(max_length=11)
    rank3 = fields.CharField(max_length=11)
    rank4 = fields.CharField(max_length=11)
    rank5 = fields.CharField(max_length=11)
