import asyncio
from typing import Optional

from models.community import Notice
from models.serializers.v1 import NoticeItem, PageInfo


class NoticeService:

    @staticmethod
    async def list(
        vo: PageInfo,
        must_display: bool = False,
        must_visit: bool = False,
    ) -> tuple[int, list[NoticeItem]]:
        queryset = Notice.filter().order_by("-create_time")
        if must_display:
            queryset = queryset.filter(display=True)
        if must_visit:
            queryset = queryset.filter(visit=True)
        total, items = await asyncio.gather(
            queryset.count(),
            queryset.offset(vo.offset).limit(vo.size)
        )
        return total, [NoticeItem.model_validate(item) for item in items]

    @staticmethod
    async def get(
        nid: int,
        must_display: bool = False,
        must_visit: bool = False
    ) -> Optional[NoticeItem]:
        notice = await Notice.filter(id=nid).first()
        if not notice:
            return
        if notice.display is False and must_display:
            return
        if notice.visit is False and must_visit:
            return
        return NoticeItem.model_validate(notice)
