import asyncio
import time
from abc import ABCMeta, abstractmethod
from typing import Literal, Optional

from grpc.aio import AioRpcError
from motor.motor_asyncio import AsyncIOMotorClient
from tortoise.queryset import F, Q

from component.cache import Cache
from services.constant import checkin_items
from models.community import CashShop, MsCommodity, MsData, MsItemCategory
from models.function import JsonContains, JsonQuote
from models.game import DropData, NpcShop, NpcShopItem
from models.serializers.v1 import LibraryQueryArgs, LibraryQueryResponse
from services.rpc.service import MagicService, ProtoBufSerializer


class WzData:
    def __init__(self, data: dict):
        self.data = data

    @property
    def id(self) -> str:
        return self.data.get("oid")

    @property
    def name(self) -> Optional[str]:
        return self.data.get("name")

    @property
    def desc(self) -> Optional[str]:
        return self.data.get("desc")

    @property
    def category(self) -> Optional[str]:
        return self.data.get("category")

    @property
    def icon(self) -> Optional[str]:
        return self.data.get("icon", {}).get("item")

    @property
    def stand(self) -> Optional[str]:
        return self.data.get("icon", {}).get("stand")

    @property
    def info(self) -> Optional[dict]:
        return self.data.get("info", {})

    @property
    def attr(self) -> Optional[dict]:
        return self.data.get("attr", {})


class LibraryService(metaclass=ABCMeta):
    @abstractmethod
    async def search(self, pvo: LibraryQueryArgs) -> LibraryQueryResponse:
        raise NotImplementedError

    @abstractmethod
    async def fetch_item(self, item_id: int | str) -> Optional[WzData]:
        raise NotImplementedError

    @abstractmethod
    async def get_doc_by_ids(self, item_ids: list[int] | list[str]) -> dict[str, WzData]:
        raise NotImplementedError

    @abstractmethod
    async def mob_info(self, mob_id: int) -> dict:
        raise NotImplementedError

    @abstractmethod
    async def npc_info(self, npc_id: int | str) -> dict:
        raise NotImplementedError

    @abstractmethod
    async def source_info(self, oid: int, timeout: float = None) -> dict:
        raise NotImplementedError

    @staticmethod
    def is_pet(item_id: int | str) -> bool:
        return int(item_id) // 1000 == 5000


class LibraryMongo(LibraryService):
    def __init__(self, db: AsyncIOMotorClient, rpc: MagicService, cache: Cache):
        self.db = db.db
        self.rpc = rpc
        self.cache = cache.select("redis")

    @abstractmethod
    async def npc_info(self, npc_id: int | str) -> dict:
        pass

    async def search(self, pvo: LibraryQueryArgs) -> LibraryQueryResponse:
        if not pvo.query:
            return LibraryQueryResponse(total=0, size=0, page=pvo.page, items=[])
        query = {
            "$or": [
                {"oid": {"$regex": f".*?{pvo.query}.*"}},
                {"name": {"$regex": f".*?{pvo.query}.*"}},
            ]
        }
        if "all" not in pvo.category:
            query["category"] = {"$in": pvo.category.split(",")}
        cursor = self.db.Data.find(query, {"_id": 0})
        cursor.skip(pvo.offset).limit(pvo.size)
        total, result = await asyncio.gather(
            self.db.Data.count_documents(query),
            cursor.to_list(length=pvo.size),
        )
        for i in range(len(result)):
            item = result[i]
            if "info" not in item and "attr" in item:
                item["info"] = item["attr"]
            if "attr" in item:
                del item["attr"]
        return LibraryQueryResponse(
            total=total,
            size=len(result),
            page=pvo.page,
            items=result,
        )

    async def get_doc_by_ids(self, item_ids: list[int] | list[str]) -> dict[str, WzData]:
        cursor = self.db.Data.find({"oid": {"$in": [str(i) for i in item_ids]}})
        document = await cursor.to_list(length=len(item_ids))
        document_map = {doc["oid"]: WzData(doc) for doc in document}
        return document_map

    async def fetch_item(self, item_id: int | str) -> Optional[WzData]:
        document = await self.db.Data.find_one({"oid": str(item_id)})
        if not document:
            return None
        return WzData(document)

    async def source_by_quest(self, oid: int) -> tuple[Literal["quest"], list[dict]]:
        """query the source of the item through the quest.
        :param oid:
        :return:
        """
        raise NotImplementedError

    async def source_by_drop(self, oid: int) -> tuple[Literal["drop"], list[dict]]:
        """Query the source of the item from the monster's drops.
        :param oid:
        :return:
        """
        query = await DropData.filter(itemid=oid).values("dropperid", "chance")
        ids = [str(x.get("dropperid")) for x in query]
        q = {"category": "Mob", "oid": {"$in": ids}}
        cursor = self.db.Data.find(q, {"name": 1, "oid": 1, "_id": 0})
        names = {}
        for o in await cursor.to_list(length=500):
            names[o["oid"]] = o["name"]
        for obj in query:
            obj["name"] = names.get(str(obj["dropperid"]))
        return "drop", query

    async def source_by_npc_shop(self, oid: int) -> tuple[Literal["npc_shop"], list[dict]]:
        """Query the source of the item from the npc shop.
        :param oid:
        :return:
        """
        query = await NpcShopItem.filter(itemid=oid, shopid__not=9999999).values(
            "shopid", "price", "pitch"
        )
        for shop in query:
            if (shop_id := shop.get("shopid")) <= 10000:  # 几个特殊的商店
                if ns := await NpcShop.filter(shopid=shop_id).first():
                    shop["shopid"] = ns.npcid
        price_dict = {str(x["shopid"]): x["price"] for x in query}
        pitch_dict = {str(x["shopid"]): x["pitch"] for x in query}
        if query:
            q = {
                "category": "Npc",
                "oid": {"$in": list(map(lambda x: str(x.get("shopid")), query))},
            }
            cursor = self.db.Data.find(q, {"name": 1, "oid": 1, "_id": 0})
            query = await cursor.to_list(length=100)
            for obj in query:
                obj["price"] = price_dict.get(obj["oid"])
                obj["pitch"] = pitch_dict.get(obj["oid"])
        return "npc_shop", query

    async def source_by_hire_shop(self, oid: int) -> tuple[Literal["hire_shop"], list[dict]]:
        """Query the source of the item from the character shop.
        :param oid:
        :return:
        """
        if not self.rpc.enabled:
            raise NotImplementedError
        items = []
        key, ex = ":HiredShop", 60
        ser = ProtoBufSerializer(self.rpc.pb_module.MerchantReply)
        query = await self.cache.get_or_set(key, self.rpc.get_hired_shop(timeout=5), ser, ex=ex)
        for hi in query.merchants:
            for mi in hi.items:
                if not mi.exist:
                    continue
                if oid != mi.id:
                    continue
                items.append(
                    {
                        "owner": hi.ownName,
                        "description": hi.description,
                        "oid": mi.id,
                        "price": mi.price,
                    }
                )
        return "hire_shop", items

    async def source_by_cash_shop(self, oid: int) -> tuple[Literal["cash_shop"], list[dict]]:
        """Query the source of the item from the cash shop.
        :param oid:
        :return:
        """
        q = {"oid": str(oid), "sale": True}
        cursor = self.db.Commodity.find(q, {"_id": 0})
        mongo = await cursor.to_list(length=100)
        return "cash_shop", mongo

    @staticmethod
    async def source_by_h5_shop(oid: int) -> tuple[Literal["h5_shop"], list[dict]]:
        """Query the source of the item from the web shop."""
        params = {"itemId": oid, "canBuy": 1, "display": 1}
        query = await CashShop.filter(**params).values("title", "price")
        return "h5_shop", query

    @staticmethod
    async def source_by_checkin(oid: int) -> tuple[Literal["checkin"], Optional[float]]:
        """Query the source of the item from the check-in system."""
        category = [
            "Weapon",
            "Ring",
            "Coat",
            "LongCoat",
            "Pants",
            "Cap",
            "Glove",
            "Shoes",
            "Cape",
            "Accessory",
        ]
        count = len(category)
        ans = None
        for c in category:
            if c not in checkin_items:
                count -= 1
                continue
            if str(oid) in checkin_items[c]:
                _ = 100 / (len(checkin_items[c]) * count)
                ans = float(f"{_:.3f}")
        return "checkin", ans

    async def source_by_npc_script(self, oid: int) -> tuple[Literal["npc_script"], dict]:
        """Query the source of the item from the npc script.
        :param oid:
        :return:
        """
        raise NotImplementedError

    async def get_mob_drop(self, mob_id: int):
        """Query the drops of a specific monster."""
        query = await DropData.filter(dropperid=mob_id, itemid__not=0).values("itemid", "chance")
        category_list = [
            "Cap",
            "Weapon",
            "Shoes",
            "Longcoat",
            "Coat",
            "Cape",
            "Glove",
            "Pants",
            "Accessory",
            "Ring",
            "Shield",
            "Consume",
            "Etc",
            "Ins",
        ]
        q = {
            "category": {"$in": category_list},
            "oid": {"$in": list(map(lambda x: str(x.get("itemid")), query))},
        }
        cursor = self.db.Data.find(q, {"name": 1, "oid": 1, "_id": 0})
        mongo = await cursor.to_list(length=500)
        names = {str(o["oid"]): o["name"] for o in mongo}
        for obj in query:
            name = names.get(str(obj["itemid"]), "NULL")
            obj["name"] = name
        return query

    async def get_mob_respawn(self, mob_id: int) -> list[dict]:
        """Query the interval for the next spawn of a specific monster."""
        key = f"mob:respawn:{mob_id}"
        respawn = await self.cache.zrange(key, 0, 20, withscores=True)
        return mob_respawn_status(respawn)

    async def mob_info(self, mob_id: int) -> dict:
        drop, spawn = await asyncio.gather(
            self.get_mob_drop(mob_id),
            self.get_mob_respawn(mob_id),
        )
        return {"drop": drop, "respawn": spawn}

    async def source_info(self, oid: int, timeout: float = None) -> dict:
        """Query the source of the item."""
        tasks = [
            asyncio.wait_for(self.source_by_drop(oid), timeout=timeout),
            asyncio.wait_for(self.source_by_npc_shop(oid), timeout=timeout),
            asyncio.wait_for(self.source_by_hire_shop(oid), timeout=timeout),
            asyncio.wait_for(self.source_by_cash_shop(oid), timeout=timeout),
            asyncio.wait_for(self.source_by_h5_shop(oid), timeout=timeout),
            asyncio.wait_for(self.source_by_checkin(oid), timeout=timeout),
            asyncio.wait_for(self.source_by_npc_script(oid), timeout=timeout),
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        result = {}
        for r in results:
            if isinstance(r, (NotImplementedError, asyncio.TimeoutError)):
                continue
            k, v = r
            if not v:
                continue
            result[k] = v
        return result


class LibraryRDB(LibraryService):
    def __init__(self, rpc: MagicService, cache: Cache):
        self.rpc = rpc
        self.cache = cache.select("redis")

    async def fetch_item(self, item_id: int | str) -> Optional[WzData]:
        documents = (
            await MsData.filter(oid=str(item_id))
            .limit(1)
            .values("oid", "name", "desc", "category", "icon", "info", "attr")
        )
        if not documents:
            return None
        return WzData(documents[0])

    async def get_doc_by_ids(self, item_ids: list[int] | list[str]) -> dict[str, WzData]:
        document = await MsData.filter(oid__in=[str(i) for i in item_ids]).values(
            "oid", "name", "desc", "category", "icon", "info", "attr"
        )
        document_map = {doc["oid"]: WzData(doc) for doc in document}
        return document_map

    async def get_mob_drop(self, mob_id: int):
        """查询怪物掉落物品"""
        # 注意 itemid可以是重复的
        query = await DropData.filter(dropperid=mob_id, itemid__not=0).values("itemid", "chance")
        category_list = [
            "Cap",
            "Weapon",
            "Shoes",
            "Longcoat",
            "Coat",
            "Cape",
            "Glove",
            "Pants",
            "Accessory",
            "Ring",
            "Shield",
            "Consume",
            "Etc",
            "Ins",
        ]
        queryset = MsData.filter(
            oid__in=[str(x.get("itemid")) for x in query], category__in=category_list
        )
        queryset = await queryset.limit(500).values("oid", "name")
        names = {str(o["oid"]): o["name"] for o in queryset}
        for obj in query:
            name = names.get(str(obj["itemid"]), "NULL")
            obj["name"] = name
        return query

    async def get_mob_respawn(self, mob_id: int) -> list[dict]:
        """查询怪物的下一次刷新时间区间"""
        key = f"mob:respawn:{mob_id}"
        respawn = await self.cache.zrange(key, 0, 20, withscores=True)
        return mob_respawn_status(respawn)

    async def get_mob_maps(self, mob_id: int) -> list[dict]:
        """查询怪物的刷新地图"""
        key = f"mob:maps:{mob_id}"
        maps = await self.cache.smembers(key)
        return [{"oid": int(m)} for m in maps]

    async def mob_info(self, mob_id: int) -> dict:
        drop, spawn = await asyncio.gather(
            self.get_mob_drop(mob_id),
            self.get_mob_respawn(mob_id),
        )
        return {"drop": drop, "respawn": spawn}

    async def npc_info(self, npc_id: int | str) -> dict:
        fn1 = JsonContains(F("info"), JsonQuote(str(npc_id)), "$.npc")
        queryset = MsData.annotate(c=fn1).filter(
            category__in=[MsItemCategory.Map, MsItemCategory.Quest],
            c__gt=0,
        )
        maps, quests = [], []
        async for row in queryset.values("oid", "name", "category"):
            if row.pop("category") == MsItemCategory.Map.value:
                maps.append(row)
            else:
                quests.append(row)
        result = {
            "map": maps,
            "quest": quests,
        }
        return result

    @staticmethod
    async def source_by_drop(oid: int) -> tuple[Literal["drop"], list[dict]]:
        """通过物品掉落查询物品来源
        :param oid:
        :return:
        """
        query = await DropData.filter(itemid=oid).values("dropperid", "chance")
        ids = [str(x.get("dropperid")) for x in query]
        queryset = MsData.filter(oid__in=ids, category="Mob").limit(500).only("oid", "name")
        names = {str(o.oid): o.name async for o in queryset}
        for obj in query:
            obj["name"] = names.get(str(obj["dropperid"]))
        return "drop", query

    @staticmethod
    async def source_by_npc_shop(oid: int) -> tuple[Literal["npc_shop"], list[dict]]:
        """通过NPC商店查询物品来源
        :param oid:
        :return:
        """
        query = await NpcShopItem.filter(itemid=oid, shopid__not=9999999).values(
            "shopid", "price", "pitch"
        )
        for shop in query:
            if (shop_id := shop.get("shopid")) <= 10000:  # 几个特殊的商店
                if ns := await NpcShop.filter(shopid=shop_id).first():
                    shop["shopid"] = ns.npcid
        price_dict = {str(x["shopid"]): x["price"] for x in query}
        pitch_dict = {str(x["shopid"]): x["pitch"] for x in query}
        if query:
            queryset = MsData.filter(oid__in=[str(x.get("shopid")) for x in query], category="Npc")
            query = await queryset.limit(100).values("oid", "name")
            for obj in query:
                obj["price"] = price_dict.get(obj["oid"])
                obj["pitch"] = pitch_dict.get(obj["oid"])
        return "npc_shop", query

    async def source_by_hire_shop(self, oid: int) -> tuple[Literal["hire_shop"], list[dict]]:
        """通过雇佣商店查询物品来源
        :param oid:
        :return:
        """
        if not self.rpc.enabled:
            raise NotImplementedError
        items = []
        key, ex = ":HiredShop", 60
        ser = ProtoBufSerializer(self.rpc.pb_module.MerchantReply)
        query = await self.cache.get_or_set(key, self.rpc.get_hired_shop(timeout=5), ser, ex=ex)
        for hi in query.merchants:
            for mi in hi.items:
                if not mi.exist:
                    continue
                if oid != mi.id:
                    continue
                items.append(
                    {
                        "owner": hi.ownName,
                        "description": hi.description,
                        "oid": mi.id,
                        "price": mi.price,
                    }
                )
        return "hire_shop", items

    @staticmethod
    async def source_by_cash_shop(oid: int) -> tuple[Literal["cash_shop"], list[dict]]:
        """通过现金商城查询物品来源
        :param oid:
        :return:
        """
        queryset = MsCommodity.filter(oid=str(oid), sale=True).limit(100)
        result = await queryset.values(
            "oid", "sn", "count", "gender", "period", "price", "priority"
        )
        return "cash_shop", result

    async def source_by_npc_script(self, oid: int) -> tuple[Literal["npc_script"], dict]:
        """通过NPC脚本查询物品来源
        :param oid:
        :return:
        """
        raise NotImplementedError

    @staticmethod
    async def source_by_quest(oid: int) -> tuple[Literal["quest"], dict]:
        """通过任务查询物品来源
        :param oid:
        :return:
        """
        fn = JsonContains(F("info"), JsonQuote(str(oid)), "$.item")
        queryset = MsData.annotate(c=fn).filter(category=MsItemCategory.Quest, c__gt=0).limit(100)
        result = await queryset.values("oid", "name")
        return "quest", result

    async def source_info(self, oid: int, timeout: float = None) -> dict:
        """查询物品来源"""
        tasks = [
            asyncio.wait_for(self.source_by_drop(oid), timeout=timeout),
            asyncio.wait_for(self.source_by_npc_shop(oid), timeout=timeout),
            asyncio.wait_for(self.source_by_hire_shop(oid), timeout=timeout),
            asyncio.wait_for(self.source_by_cash_shop(oid), timeout=timeout),
            asyncio.wait_for(LibraryMongo.source_by_h5_shop(oid), timeout=timeout),
            asyncio.wait_for(LibraryMongo.source_by_checkin(oid), timeout=timeout),
            asyncio.wait_for(self.source_by_quest(oid), timeout=timeout),
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        result = {}
        for r in results:
            if isinstance(r, (NotImplementedError, asyncio.TimeoutError, AioRpcError)):
                continue
            k, v = r
            if not v:
                continue
            result[k] = v
        return result

    @staticmethod
    async def make_map_info(items: list[dict]):
        if not items:
            return
        oid_set = set()
        info_list = []
        for item in items:
            info = item.get("info", {}) or {}
            oid_set.update(info.get("npc", []))
            oid_set.update(info.get("portal", []))
            oid_set.update([m["oid"] for m in info.get("mob", [])])
            info_list.append(info)
        if not oid_set:
            return
        document = await MsData.filter(
            oid__in=oid_set,
            category__in=[MsItemCategory.Map, MsItemCategory.Npc, MsItemCategory.Mob],
        ).values("oid", "name")
        doc_map = {doc["oid"]: WzData(doc) for doc in document}
        null_data = WzData({"name": "NULL"})
        for info in info_list:
            npc_list = []
            for npc_id in info.get("npc", []):
                name = doc_map.get(npc_id, null_data).name
                npc_list.append({"oid": npc_id, "name": name})
            info["npc"] = npc_list
            portal_list = []
            for portal_id in info.get("portal", []):
                name = doc_map.get(portal_id, null_data).name
                portal_list.append({"oid": portal_id, "name": name})
            info["portal"] = portal_list
            mob_list = []
            for mob in info.get("mob", []):
                name = doc_map.get(mob["oid"], null_data).name
                mob_list.append({"oid": mob["oid"], "name": name})
            info["mob"] = mob_list

    async def search(self, pvo: LibraryQueryArgs) -> LibraryQueryResponse:
        if not pvo.query:
            return LibraryQueryResponse(total=0, size=0, page=pvo.page, items=[])
        if pvo.query.isnumeric():
            q = Q(oid__contains=pvo.query) | Q(name__contains=pvo.query)
        else:
            q = Q(name__contains=pvo.query)
        queryset = MsData.filter(q).exclude(category=MsItemCategory.Quest).order_by("oid")
        if "all" not in pvo.category:
            queryset = queryset.filter(category__in=pvo.category.split(","))
        result = []
        total, rows = await asyncio.gather(
            queryset.count(),
            queryset.offset(pvo.offset).limit(pvo.size),
        )
        map_item = []
        for row in rows:
            item = {
                "oid": row.oid,
                "name": row.name,
                "desc": row.desc,
                "category": row.category.value,
                "icon": row.icon,
                "info": row.info or row.attr,
            }
            result.append(item)
            if row.category == MsItemCategory.Map:
                map_item.append(item)
        await self.make_map_info(map_item)
        return LibraryQueryResponse(
            total=total,
            size=len(result),
            page=pvo.page,
            items=result,
        )


def mob_respawn_status(respawn) -> list[dict]:
    """查询怪物的下一次刷新时间区间"""
    status = {
        12 * 3600: "12小时起",
        6 * 3600: "6小时起",
        3 * 3600: "3小时起",
        2 * 3600: "2小时起",
        3600: "1小时起",
        -300: "很快",
    }
    result = []
    for channel, ts in respawn:
        diff = int(ts / 1000 - time.time())
        for t, s in status.items():
            if diff > t * 1.1:  # 1.1为预估放大倍率
                result.append({"channel": int(channel), "status": s})
                break
    result = list(sorted(result, key=lambda x: x.get("channel", 0)))
    return result
