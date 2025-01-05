import asyncio
import time
from datetime import datetime
from typing import Callable

from tortoise import transactions
from tortoise.expressions import Q, F
from tortoise.transactions import in_transaction

from component.cache import Cache, Pydantic
from models.community import ItemType, CashShop, ShoppingLog, Invitation
from models.game import Character, User, Gift, DueyPackage, Pet, InvItem, InvEquip
from models.serializers.v1 import CSItemType, CSPoster, CSItem, CSItemQueryResponse
from services.account.invite import InviteService
from services.account.smtp import SMTPService
from services.community.library import LibraryService
from services.rpc.service import MagicService, pb_type


class CashShopError(Exception):
    def __init__(self, message: str, status: int):
        self.message = message
        self.status = status


class OfflineError(CashShopError):
    pass


class CashShopService:
    def __init__(
        self,
        rpc: MagicService,
        cache: Cache,
        wz: LibraryService,
        smtp: SMTPService,
    ):
        self.rpc = rpc
        self.cache = cache.select("redis")
        self.wz = wz
        self.smtp = smtp
        self.callback_message = ""

    async def item_types(self) -> list[CSItemType]:
        ser = Pydantic(CSItemType, nested=True)

        @self.cache.cache_fn(expire=300, serializer=ser, format_key="cs:item_types")
        async def fetch_types():
            queryset = await ItemType.filter(display=True)
            return [CSItemType.model_validate(item) for item in queryset]

        return await fetch_types()

    async def poster(self) -> dict:
        return await self.cache.get("cs:poster", default=lambda: CSPoster().model_dump())

    async def search_items(
        self,
        offset: int,
        limit: int,
        keyword: str,
        category: str,
    ) -> CSItemQueryResponse:
        queryset = CashShop.filter(display=True)
        if keyword:
            queryset = queryset.filter(Q(title__icontains=keyword) | Q(desc__icontains=keyword))
        if category:
            queryset = queryset.filter(category=category)
        total, cs_list = await asyncio.gather(
            queryset.count(),
            queryset.offset(offset).limit(limit).order_by("-rank", "-create_time", "-id"),
        )
        document = await self.wz.get_doc_by_ids([str(obj.itemId) for obj in cs_list])
        items = [CSItem.model_validate(item) for item in cs_list]
        for i in range(len(items)):
            item = items[i]
            doc = document.get(str(item.item_id))
            if not doc:
                continue
            if not item.desc and doc.desc:
                desc = doc.desc.replace(r"\r\n", "<br>").replace(r"\n", "<br>")
                if len(desc) > 43:
                    desc = desc[:43] + "..."
                item.desc = desc
            if not item.item_ico:
                if icon := doc.icon:
                    item.item_ico = icon
        return CSItemQueryResponse(total=total, count=len(items), items=items)

    @staticmethod
    def asset_check_v1(cs: CashShop, user: User, gift: bool) -> dict:
        if cs.currency == "点券":
            if user.nxCredit >= cs.price:
                currency = {"nxCredit": F("nxCredit") - cs.price}
            elif user.maplePoint >= cs.price:
                currency = {"maplePoint": F("maplePoint") - cs.price}
            elif user.nxPrepaid >= cs.price:
                currency = {"nxPrepaid": F("nxPrepaid") - cs.price}
            else:
                raise CashShopError("账户点券余额不足", 403)
        else:
            raise CashShopError("暂未开放该货币", 403)
        if gift:
            if user.nxPrepaid >= cs.price:
                currency = {"nxPrepaid": F("nxPrepaid") - cs.price}
            else:
                raise CashShopError("账户点券余额不足", 403)
        return currency

    async def asset_check_v2(
        self,
        cs: CashShop,
        user: pb_type.CharacterReply,
        gift: bool,
    ) -> tuple[Callable, str]:
        if cs.currency == "点券":
            if gift:
                if cs.price > user.np:
                    raise CashShopError("账户点券余额不足", 403)
                method = self.rpc.add_np
                message = (
                    f"[网页商城] 花费{cs.price}信用卡(NP)向%s赠送了 {cs.title}"
                    f"{'' if cs.count == 1 else '(%s)' % cs.count}！"
                )
            else:
                if cs.price > max(user.nx, user.mp, user.np):
                    raise CashShopError("账户点券余额不足", 403)
                if cs.count == 1:
                    message = f"[网页商城] 花费{cs.price}%s购买了 {cs.title}"
                else:
                    message = f"[网页商城] 花费{cs.price}%s购买了" f" {cs.title}({cs.count})"
                if user.nx >= cs.price:
                    method = self.rpc.add_nx
                    message = message % "点券(NX)"
                elif user.mp >= cs.price:
                    method = self.rpc.add_mp
                    message = message % "抵用券(MP)"
                else:
                    method = self.rpc.add_np
                    message = message % "信用卡(NP)"
            return method, message
        raise CashShopError("暂未开放该货币", 403)

    @staticmethod
    async def check_purchase_limit(user_id: int, character_id: int, cs: CashShop):
        """检查是否符合购买限制"""
        account = await User.filter(id=user_id).first()
        if cs.limit_group:
            cond = {"limit_group": cs.limit_group}
        else:
            cond = {"shop_id": cs.id}
        if cs.user_limit:
            count = await ShoppingLog.filter(user=account.name, **cond).count()
            if count >= cs.user_limit:
                raise CashShopError(f"无法购买，单个账号限购{cs.user_limit}件", 403)
        if cs.char_limit:
            count = await ShoppingLog.filter(char_id=character_id, **cond).count()
            if count >= cs.char_limit:
                raise CashShopError(f"无法购买，单个角色限购{cs.char_limit}件", 403)

    @staticmethod
    def check_can_buy(cs: CashShop):
        """检查商品是否可以购买"""
        if not cs.canBuy:
            raise CashShopError("不能购买该商品", 403)
        if cs.amount is not None and cs.amount <= 0:
            raise CashShopError("商品库存不足", 403)
        now = time.time()
        if cs.start_sale_time is not None and cs.start_sale_time.timestamp() > now:
            raise CashShopError("商品尚未开售", 403)
        if cs.end_sale_time is not None and cs.end_sale_time.timestamp() < now:
            raise CashShopError("超过出售时间，不可购买", 403)

    async def check_buy_action(
        self,
        user: User,
        character_id: int,
        shop_id: int,
    ) -> tuple[Character, CashShop]:
        """检查购买行为是否合法"""
        cr, cs = await asyncio.gather(
            Character.filter(id=character_id, accountid=user.id).first(),
            CashShop.filter(id=shop_id).first(),
        )
        if not (cs and cr):
            raise CashShopError("购买失败", 403)
        self.check_can_buy(cs)
        await self.check_purchase_limit(cr.accountid, cr.id, cs)
        return cr, cs

    async def check_gift_action(
        self,
        user: User,
        shop_id: int,
        accept: str,
        birthday: str,
    ) -> tuple[Character, CashShop]:
        """检查赠送行为是否合法"""
        cr = await Character.filter(name=accept).first()
        if not cr:
            raise CashShopError("收货人姓名不正确", 403)
        if cr.accountid == user.id:
            raise CashShopError("孤寡孤寡孤寡", 403)
        if str(user.birthday) != birthday:
            raise CashShopError("出生日期不正确", 403)
        cs = await CashShop.filter(id=shop_id).first()
        if not cs:
            raise CashShopError("购买失败", 403)
        self.check_can_buy(cs)
        await self.check_purchase_limit(cr.accountid, cr.id, cs)
        return cr, cs

    async def _ship_by_email(self, cs: CashShop, character: Character):
        """通过邮件发货"""
        account = await User.filter(id=character.accountid).first()
        if not account.email:
            raise CashShopError("账号未绑定邮箱，无法购买", 403)
        inv = await Invitation.create(
            code=Invitation.random_code(),
            expire_time=datetime.fromtimestamp(time.time() + cs.expiration),
            note=f"{account.name} 网页商城购买",
        )
        serv = InviteService(self.cache, self.smtp)
        await serv.send_invite(account.email, inv)

    @staticmethod
    async def _create_gift(to, item, _from="签到管理员", message="", ring=-1) -> Gift:
        data = {"to": to, "sn": item, "_from": _from, "message": message, "ring": ring}
        obj = await Gift.create(**data)
        return obj

    async def _ship_by_gift(
        self,
        cs: CashShop,
        character: Character,
        message: str,
    ):
        """通过游戏商城礼物发货 宠物无法通过礼物发货
        :param character: 角色
        :param message: 留言
        :return:
        """

        if self.wz.is_pet(cs.itemId):
            raise CashShopError("网页商城配置异常", 500)
        await self._create_gift(character.id, cs.itemId, message=f"{message}\n")

    @staticmethod
    async def create_delivery(
        receiver_id: int,
        sender_name: str,
        mesos: int = 0,
        timestamp: datetime = None,
        message: str = None,
        checked: int = 1,
        type_: int = 1,
    ) -> DueyPackage:
        """创建快递
        :param receiver_id: 接收人ID
        :param sender_name: 发送者名称
        :param mesos: 金币
        :param timestamp: 快递时间
        :param message:
        :param checked:
        :param type_:
        :return:
        """
        return await DueyPackage.create(
            ReceiverId=receiver_id,
            SenderName=sender_name,
            Mesos=mesos,
            TimeStamp=timestamp or datetime.now(),
            Message=message,
            Checked=checked,
            Type=type_,
        )

    async def create_pet(self, item_id, **kwargs) -> Pet:
        """创建一条pet信息并返回对象
        :param item_id:
        :return:
        """
        wz_data = await self.wz.fetch_item(item_id)
        attr = {"name": wz_data.name if wz_data else "unknown"}
        attr.update(**kwargs)
        obj = await Pet.create(**attr)
        return obj

    @staticmethod
    async def create_item(
        type_: int,
        cid: int,
        item_id: int,
        quantity: int = 1,
        position: int = 0,
        owner: str = "",
        pet_id: int = -1,
        flag: int = 0,
        expiration: int = -1,
        gift_from: str = "",
    ) -> InvItem:
        """
        :param type_: 背包 1, 仓库 2, 现金仓库-冒险家 3, 现金仓库-骑士团 4, 现金仓库-战神 5,
                     商铺 6, CASH_OVERALL 7 未知，结婚礼物 8, 快递柜 9;
        :param cid: 拥有角色ID 或 快递ID
        :param item_id: 物品id
        :param position: 位置
        :param quantity: 数量
        :param owner: 谁的
        :param pet_id: 宠物相关
        :param flag: 未知
        :param expiration: 时效 13位时间戳
        :param gift_from: 赠礼
        :return:
        """
        return await InvItem.create(
            type=type_,
            characterid=cid,
            itemid=item_id,
            inventorytype=str(item_id)[0],
            position=position,
            quantity=quantity,
            owner=owner,
            petid=pet_id,
            flag=flag,
            expiration=expiration,
            giftFrom=gift_from,
        )

    async def _ship_by_package(self, cs: CashShop, character: Character, message: str):
        """通过快递包裹发货"""
        query = await DueyPackage.filter(ReceiverId=character.id).count()
        if query >= 32:
            raise CashShopError("当前角色待接收的包裹过多，请签收后再尝试", 403)
        package = await self.create_delivery(character.id, "MagicMS", message=f"{message}")
        attr = {"item_id": cs.itemId, "quantity": cs.count}
        if cs.expiration:
            attr["expiration"] = int((time.time() + cs.expiration) * 1000)
        if self.wz.is_pet(cs.itemId):
            pet = await self.create_pet(cs.itemId)
            attr["pet_id"] = pet.petid
        if cs.char_limit is not None:
            attr["flag"] = 1
        item = await self.create_item(9, package.PackageId, **attr)
        if str(cs.itemId).startswith("1"):
            wz_data = await self.wz.fetch_item(cs.itemId)
            if not wz_data:
                raise CashShopError("物品配置异常", 500)
            attr = wz_data.attr
            extend = cs.extend if cs.extend else {}
            attr.update(**extend)
            await InvEquip.create(inventoryitemid=item.inventoryitemid, **attr)

    async def ship(self, cs: CashShop, character: Character, message: str = ""):
        if cs.receiveMethod == 0:
            await self._ship_by_gift(cs, character, message)
        elif cs.receiveMethod == 8:
            await self._ship_by_email(cs, character)
        elif cs.receiveMethod == 9:
            await self._ship_by_package(cs, character, message)
        else:
            raise CashShopError("网页商城配置异常", 500)
        if cs.amount is not None:
            # 库存减一
            await CashShop.filter(id=cs.id).update(amount=F("amount") - 1)

    async def discount(self, user: User, cr: Character, cs: CashShop):
        # TODO Implement this method
        ...

    async def callback(self, status: bool):
        # TODO Implement this method
        ...

    async def show_receiver_msg(self, cs: CashShop, recv: Character):
        if cs.receiveMethod == 0:
            await self.rpc.send_note(
                send="网页商城",
                recv=recv.name,
                content=f"您有一个新的快递({cs.title})，进入现金商城查收！",
            )
        else:
            await self.rpc.send_delivery_note("网页商城", recv.name)

    async def buy_item_by_rpc(
        self,
        user: User,
        char: Character,
        character_id: int,
        shop_id: int,
    ) -> str:
        recv, cs = await self.check_buy_action(user, character_id, shop_id)
        char_info = await self.rpc.get_char_info(char.name)
        if not char_info:
            raise OfflineError("账号已下线", 403)
        method, message = await self.asset_check_v2(cs, char_info, gift=False)
        await self.discount(user, recv, cs)  # 注册促销事件
        async with in_transaction("game"):
            try:
                await self.ship(cs, recv, "谢谢惠顾")  # 向收件人发货
            except (CashShopError, OfflineError) as err:
                await self.callback(False)
                raise err
            r = await method(char.name, -cs.price, message)
            if r.result is False:  # 扣款失败 抛出异常
                await self.callback(False)  # 促销事件失败回调
                raise CashShopError("扣款失败 稍后再试", 403)
            await self.callback(True)  # 促销事件成功回调
        await self.show_receiver_msg(cs, recv)
        await ShoppingLog.create(
            user=user.name,
            character=recv.name,
            gift=False,
            shop_id=cs.id,
            char_id=recv.id,
            shop_name=cs.title,
            count=cs.count,
            price=cs.price,
            currency=cs.currency,
            limit_group=cs.limit_group,
        )
        return self.callback_message or "购买成功"

    async def buy_item_by_db(self, user: User, character_id: int, shop_id: int) -> str:
        """购买物品，此方法要求账号不在线"""
        cr, cs = await self.check_buy_action(user, character_id, shop_id)
        async with transactions.in_transaction("game"):
            user = await User.filter(id=user.id).first()
            if user.loggedin != 0:
                raise CashShopError("账号在线时不能购买物品", 403)
            currency = self.asset_check_v1(cs, user, False)
            await self.discount(user, cr, cs)  # 此处可能会改变商品价格
            for key in list(currency.keys()):
                currency[key] = F(key) - cs.price
            try:
                await self.ship(cs, cr, "谢谢惠顾")
            except (CashShopError, OfflineError) as err:
                await self.callback(False)
                raise err
            await User.filter(id=user.id).update(**currency)
            await self.callback(True)
        await ShoppingLog.create(
            user=user.name,
            character=cr.name,
            gift=False,
            shop_id=cs.id,
            char_id=cr.id,
            shop_name=cs.title,
            count=cs.count,
            price=cs.price,
            currency=cs.currency,
            limit_group=cs.limit_group,
        )
        return self.callback_message or "购买成功"

    async def buy_item(self, user: User, character_id: int, shop_id: int) -> str:
        """购买物品"""
        if self.rpc.enabled and (char := await self.rpc.find_online_char_by_uid(user.id)):
            try:
                return await self.buy_item_by_rpc(user, char, character_id, shop_id)
            except OfflineError:
                return await self.buy_item_by_db(user, character_id, shop_id)
        return await self.buy_item_by_db(user, character_id, shop_id)

    async def gift_item_by_db(self, user: User, shop_id: int, accept: str, birthday: str) -> str:
        """赠送物品"""
        recv, cs = await self.check_gift_action(user, shop_id, accept, birthday)
        async with transactions.in_transaction("game"):
            user = await User.get(id=user.id)
            if user.loggedin != 0:
                raise CashShopError("账号在线时不能赠送物品", 403)
            currency = self.asset_check_v1(cs, user, True)
            await self.discount(user, recv, cs)  # 此处可能会改变商品价格
            for key in list(currency.keys()):
                currency[key] = F(key) - cs.price
            try:
                await self.ship(cs, recv, "来自网页商城的礼物")
            except (CashShopError, OfflineError) as err:
                await self.callback(False)
                raise err
            await User.filter(id=user.id).update(**currency)
            await self.callback(True)
        await ShoppingLog.create(
            user=user.name,
            character=recv.name,
            gift=True,
            shop_id=cs.id,
            char_id=recv.id,
            shop_name=cs.title,
            count=cs.count,
            price=cs.price,
            currency=cs.currency,
            limit_group=cs.limit_group,
        )
        return self.callback_message or "赠送成功"

    async def gift_item_by_rpc(
        self,
        user: User,
        char: Character,
        shop_id: int,
        accept: str,
        birthday: str,
    ) -> str:
        """赠送物品"""
        recv, cs = await self.check_gift_action(user, shop_id, accept, birthday)
        char_info = await self.rpc.get_char_info(char.name)
        if not char_info:
            raise OfflineError("账号已下线", 403)
        method, message = await self.asset_check_v2(cs, char_info, gift=True)
        message = message % recv.name
        await self.discount(user, recv, cs)  # 注册促销事件
        async with transactions.in_transaction("game"):
            try:
                await self.ship(cs, recv, f"来自网页商城的礼物 {cs.title}({cs.count})")
            except (CashShopError, OfflineError) as err:
                await self.callback(False)
                raise err
            r = await method(char.name, -cs.price, message)  # 扣款且通知
            if r.result is False:  # 扣款失败 抛出异常
                await self.callback(False)  # 促销事件失败回调
                raise CashShopError("扣款失败 稍后再试", 500)
            await self.callback(True)  # 促销事件成功回调
        await self.show_receiver_msg(cs, recv)
        await ShoppingLog.create(
            user=user.name,
            character=recv.name,
            gift=True,
            shop_id=cs.id,
            char_id=recv.id,
            shop_name=cs.title,
            count=cs.count,
            price=cs.price,
            currency=cs.currency,
            limit_group=cs.limit_group,
        )
        return self.callback_message or "赠送成功"

    async def gift_item(self, user: User, shop_id: int, accept: str, birthday: str) -> str:
        """购买物品"""
        if self.rpc.enabled and (char := await self.rpc.find_online_char_by_uid(user.id)):
            try:
                return await self.gift_item_by_rpc(user, char, shop_id, accept, birthday)
            except OfflineError:
                return await self.gift_item_by_db(user, shop_id, accept, birthday)
        return await self.gift_item_by_db(user, shop_id, accept, birthday)
