import gzip
from dataclasses import dataclass
from urllib import parse
import io

from httpx import AsyncClient
from PIL import Image

from component.cache import Cache, PyObj
from models.game import Character


@dataclass
class MapleItem:
    itemId: int
    version: str = "253"


class MapleIoService:
    host = "https://maplestory.io"

    def __init__(self, client: AsyncClient):
        self.client = client

    def character_avatar_url(self, items: list[MapleItem]) -> str:
        url = self.host + "/api/character/"
        items_str = []
        for item in items:
            items_str.append('{"itemId":%s,"version":"%s"}' % (item.itemId, item.version))
            if item.itemId < 10000:
                items_str.append('{"itemId":1%s,"version":"%s"}' % (item.itemId, item.version))
        items_uri = parse.quote(",".join(items_str).replace(" ", ""))
        url += items_uri
        return url

    async def character_avatar(self, items: list[MapleItem]) -> bytes:
        url = self.character_avatar_url(items)
        response = await self.client.get(url)
        response.raise_for_status()
        return response.content


class RenderError(Exception):
    def __init__(self, message: str, status: int):
        self.message = message
        self.status = status


class RenderService:
    compress = gzip.compress
    decompress = gzip.decompress
    # These items don't support rendering in
    not_support_items = {
        1702191,
        1442223,
    }

    def __init__(self, cache: Cache = None):
        self.cache = cache

    @classmethod
    def dumps(cls, data: bytes) -> bytes:
        return cls.compress(data)

    @classmethod
    def loads(cls, data: bytes) -> bytes:
        return cls.decompress(data)

    async def render_character(self, serv: MapleIoService, character_id: int) -> bytes:
        """
        Render character photo, return webp format bytes
        while the image initial render, the image data will be cached for 15 minutes
        :param serv: MapleIoService
        :param character_id: character id
        :return: webp format bytes
        """

        async def get_image_data():
            char = await Character.filter(id=character_id).first()
            if not char:
                raise RenderError("Character does not exist", 404)
            equip = {
                "Skin": f"200{char.skincolor}",
                "Hair": str(char.hair),
                "Face": str(char.face),
                **{k: v.itemid for k, v in (await char.show_equip_info()).items()},
            }
            # When there is no weapon, the equipment is transparent by default to avoid rendering failure
            equip["Weapon"] = equip.get("Weapon", "1702224")
            equip = {k: v for k, v in equip.items() if v not in self.not_support_items}
            items = [MapleItem(itemId=int(v)) for v in equip.values()]
            try:
                data = await serv.character_avatar(items)
            except Exception as err:
                raise RenderError("角色渲染失败", 500) from err
            with Image.open(io.BytesIO(data)) as img:
                webp_buffer = io.BytesIO()
                img.save(webp_buffer, format="WEBP")
                webp_bytes = webp_buffer.getvalue()
            return webp_bytes

        key = f"Render:character_avatar:{character_id}"
        return await self.cache.get_or_set(key, get_image_data, ex=900, serializer=PyObj)
