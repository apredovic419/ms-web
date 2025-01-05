import random
import string
import time
from enum import StrEnum

from tortoise import Model, fields


class Notice(Model):
    # 公告文章
    class Meta:
        table = "notice"
        table_description = "公告栏文章"

    id = fields.IntField(pk=True)
    title = fields.CharField(max_length=64, description="标题")
    content = fields.TextField(description="html内容")
    display = fields.BooleanField(default=True, description="是否展示在网页主页")
    visit = fields.BooleanField(default=True, description="是否可以访问")
    create_time = fields.DatetimeField(description="创建时间")


class CashShop(Model):
    # 现金商城
    class Meta:
        table = "cashshop"
        table_description = "网页现金商场"

    id = fields.IntField(pk=True)
    title = fields.CharField(max_length=16, description="商品标题")
    desc = fields.CharField(max_length=64, description="商品描述", null=True, default=None)
    category = fields.CharField(max_length=32, null=True, default=None, description="物品分类", index=True)
    itemId = fields.IntField(description="物品ID")
    itemIco = fields.CharField(255, description="物品图标", default=None, null=True)
    count = fields.IntField(description="数量", default=1)
    price = fields.IntField(description="商品价格")
    currency = fields.CharField(max_length=12, description="货币种类", default="点券")
    display = fields.BooleanField(default=True, description="是否展示")
    canBuy = fields.BooleanField(default=True, description="是否可以购买")
    receiveMethod = fields.SmallIntField(description="收货方式0礼物 9快递 8邀请码", default=0)
    banGift = fields.BooleanField(default=True, description="是否禁止赠送")
    create_time = fields.DatetimeField(description="上架时间")
    start_sale_time = fields.DatetimeField(description="出售时间起", null=True, default=None)
    end_sale_time = fields.DatetimeField(description="出售时间终", null=True, default=None)
    amount = fields.IntField(description="货架总量", null=True, default=None)
    rank = fields.IntField(description="货架排序", default=0)
    limit_group = fields.CharField(max_length=64, null=True, default=None, description="限购组")
    user_limit = fields.IntField(description="账号限购数量", null=True, default=None)
    char_limit = fields.IntField(description="角色限购数量", null=True, default=None)
    expiration = fields.BigIntField(default=None, null=True)
    extend = fields.JSONField(description="装备扩展JSON字段", null=True, default=None)

    async def allow_user_purchase(self, account_name: str) -> bool:
        """是否允许用户购买
        :param account_name: 账号
        :return: 是否允许
        """
        if self.user_limit is None:
            return True
        if self.limit_group:
            cond = {"limit_group": self.limit_group}
        else:
            cond = {"shop_id": self.id}
        count = await ShoppingLog.filter(user=account_name, **cond).count()
        return count < self.user_limit

    async def allow_character_purchase(self, character_id: int) -> bool:
        """是否允许角色购买
        :param character_id: 角色ID
        :return: 是否允许
        """
        if self.char_limit is None:
            return True
        if self.limit_group:
            cond = {"limit_group": self.limit_group}
        else:
            cond = {"shop_id": self.id}
        count = await ShoppingLog.filter(char_id=character_id, **cond).count()
        return count < self.char_limit

    async def purchase_limit(self, account_name: str, char_id: int) -> int:
        """购买限制
        :param account_name: 账号
        :param char_id: 角色ID
        :return: 0: 无限制 1: 账号限制 2: 角色限制
        """
        if self.user_limit is None and self.char_limit is None:
            return 0
        if not self.allow_user_purchase(account_name):
            return 1
        if not self.allow_character_purchase(char_id):
            return 2
        return 0

    def can_buy(self) -> tuple[bool, str]:
        """是否可以购买
        :return: 是否可以购买
        """
        if not self.canBuy:
            return False, "不能购买该商品"
        if self.amount is not None and self.amount <= 0:
            return False, "商品库存不足"
        now = time.time()
        if self.start_sale_time is not None and self.start_sale_time.timestamp() > now:
            return False, "商品尚未开售"
        if self.end_sale_time is not None and self.end_sale_time.timestamp() < now:
            return False, "超过出售时间，不可购买"
        return True, ""


class OperateLog(Model):
    class Meta:
        table = "operate_log"
        table_description = "操作日志"

    id = fields.IntField(pk=True)
    user = fields.CharField(max_length=16, description="账号")
    character = fields.CharField(max_length=16, null=True, default=None, description="角色")
    type = fields.CharField(max_length=16, description="操作类型")
    content = fields.CharField(max_length=255, description="详细内容")
    create_time = fields.DatetimeField(description="创建时间", auto_now=True)

    @classmethod
    async def append_vote_log(cls, user_id, character_name, reward):
        await cls.create(
            user=user_id, type="投票奖励", content=f"{character_name} 获得 {reward} 点券"
        )


class ShoppingLog(Model):
    class Meta:
        table = "shopping_log"
        table_description = "购物日志"

    id = fields.IntField(pk=True)
    user = fields.CharField(max_length=16, description="消费账号", index=True)
    char_id = fields.IntField(description="角色ID", index=True)
    character = fields.CharField(max_length=16, description="收货角色")
    gift = fields.BooleanField(description="是否为礼物")
    shop_id = fields.IntField(description="货架ID")
    shop_name = fields.CharField(max_length=64, description="货物名称")
    count = fields.IntField(description="货物数量")
    price = fields.IntField(description="消费价格")
    currency = fields.CharField(max_length=12, description="消费货币类型", default="点券")
    limit_group = fields.CharField(
        max_length=64, default=None, null=True, description="货物所属货物组"
    )
    create_time = fields.DatetimeField(description="创建时间", auto_now=True)


class ItemType(Model):
    class Meta:
        table = "itemtype"
        table_description = "道具类型"

    id = fields.IntField(pk=True, description="类型ID")
    name = fields.CharField(max_length=10, description="类型名")
    display = fields.BooleanField(default=True, description="是否展示")

    @classmethod
    async def db_init(cls):
        types = {
            1: "帽子",
            2: "脸饰",
            3: "眼饰",
            4: "耳环",
            5: "上衣",
            6: "裤子",
            7: "鞋子",
            8: "手套",
            9: "披风",
            10: "盾牌",
            11: "武器",
            12: "套服",
            13: "戒指",
            14: "特殊",
            15: "其他",
        }
        for k, v in types.items():
            await cls.update_or_create(id=k, name=v)


class Invitation(Model):
    class Meta:
        table = "invitation"
        table_description = "邀请码"

    id = fields.IntField(pk=True)
    code = fields.CharField(30, unique=True)
    nx = fields.IntField(default=0, defalut="赠送点券")
    expire_time = fields.DatetimeField(description="截止有效时间", null=True, default=None)
    register_id = fields.IntField(default=None, null=True, description="使用该邀请码注册的账号id")
    generate_id = fields.IntField(default=None, null=True, description="生成该邀请码的账号id")
    note = fields.CharField(255, null=None, default=None, description="备注【生成来源+使用备注】")
    create_time = fields.DatetimeField(description="创建时间", auto_now_add=True)
    update_time = fields.DatetimeField(description="更改时间", auto_now=True)

    @staticmethod
    def random_code():
        """生成随机30位code"""
        ts = str(int(time.time() * 1000))
        p1 = "".join(random.choices(string.digits, k=4))
        p2 = ts[:7]
        p3 = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        p4 = ts[7:]
        p5 = "".join(random.choices(string.digits, k=5))
        return f"{p1}{p2}-{p3}-{p4}{p5}"


class MsItemCategory(StrEnum):
    Cash = "Cash"
    Cape = "Cape"
    Cap = "Cap"
    Mob = "Mob"
    Pants = "Pants"
    Shield = "Shield"
    Npc = "Npc"
    Shoes = "Shoes"
    Pet = "Pet"
    Accessory = "Accessory"
    Consume = "Consume"
    Coat = "Coat"
    Ring = "Ring"
    Glove = "Glove"
    Taming = "Taming"
    LongCoat = "Longcoat"
    PetEquip = "PetEquip"
    Weapon = "Weapon"
    Face = "Face"
    Ins = "Ins"
    Etc = "Etc"
    Hair = "Hair"
    Map = "Map"
    Quest = "Quest"


class MsData(Model):
    class Meta:
        table = "ms_data"
        table_description = "游戏资源数据"
        unique_together = ("oid", "category")

    id = fields.IntField(pk=True)
    oid = fields.CharField(max_length=15, description="物品ID")
    name = fields.CharField(max_length=100, description="物品名称")
    category = fields.CharEnumField(MsItemCategory, description="物品分类", index=True)
    desc = fields.CharField(max_length=255, null=True, description="物品描述")
    icon = fields.JSONField(description="物品图标")
    info = fields.JSONField(description="物品信息")
    attr = fields.JSONField(description="物品属性")


class MsCommodity(Model):
    class Meta:
        table = "ms_commodity"
        table_description = "游戏现金商品"

    id = fields.IntField(pk=True)
    oid = fields.CharField(max_length=12, description="商品ID", index=True)
    sn = fields.CharField(max_length=20, description="商品编号")
    count = fields.IntField(description="数量")
    gender = fields.CharField(max_length=2, description="性别限制")
    sale = fields.BooleanField(description="是否出售")
    period = fields.IntField(description="有效期", null=True)
    price = fields.IntField(description="价格", null=True)
    priority = fields.IntField(description="排序", null=True)
