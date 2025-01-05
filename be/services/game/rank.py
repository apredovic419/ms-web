import asyncio

from tortoise.functions import Sum, Count

from component.cache import cache, Pydantic
from services.constant import JobInfo
from models.game import MonsterBook, QuestStatus, Character, Guild, Alliance
from models.serializers.v1 import (
    CharRankRequest,
    CharRankResponse,
    CharRankItem,
    GuildRankResponse,
    GuildItem,
)

cache = cache.select("redis")


class RankService:
    def __init__(self):
        self.cache = cache

    @classmethod
    @cache.cache_fn(expire=900, format_key="RankService:stat_monster_book")
    async def stat_monster_book_level(cls) -> dict[str, int]:
        """Statistic of the monster book card levels
        :return: {character_id: card_number}
        """
        queryset = MonsterBook.filter()
        queryset = queryset.annotate(count=Sum("level")).group_by("charid")
        queryset = queryset.order_by("-count").values("charid", "count")
        return {str(item["charid"]): item["count"] async for item in queryset}

    @classmethod
    @cache.cache_fn(expire=900, format_key="RankService:stat_quest_completed")
    async def stat_quest_completed(cls) -> dict[str, int]:
        """Statistic on the number of completed quests
        :return: {character_id: quest_number}
        """
        queryset = QuestStatus.filter(completed=1)
        queryset = queryset.annotate(count=Count("queststatusid")).group_by("characterid")
        queryset = queryset.order_by("-count").values("characterid", "count")
        return {str(item["characterid"]): item["count"] async for item in queryset}

    @staticmethod
    @cache.cache_fn(expire=300, serializer=Pydantic(CharRankResponse))
    async def rank(pvo: CharRankRequest) -> CharRankResponse:
        cond = pvo.cond
        offset = (pvo.page - 1) * pvo.size
        quest_stat = await RankService.stat_quest_completed()
        mb_stat = await RankService.stat_monster_book_level()
        if pvo.sort in {"quest", "monsterbook"}:
            if pvo.sort == "quest":
                ids = list(quest_stat.keys())
            else:
                ids = list(mb_stat.keys())
            if pvo.job == "all":
                ids = ids[offset : offset + pvo.size]
            total, chars = await asyncio.gather(
                Character.filter(**cond).count(), Character.filter(**cond, id__in=ids)
            )
            chars.sort(key=lambda x: ids.index(str(x.id)))
            if pvo.job != "all":
                chars = chars[offset : offset + pvo.size]
        else:
            queryset = Character.filter(**cond)
            total, chars = await asyncio.gather(
                queryset.count(),
                queryset.order_by(f"-{pvo.sort}", "rank").offset(offset).limit(pvo.size),
            )
        guilds = {char.guildid for char in chars}
        guild_dict = {g.guildid: g for g in await Guild.filter(guildid__in=guilds)}
        items = []
        for char in chars:
            guild = guild_dict.get(char.guildid)
            items.append(
                CharRankItem(
                    id=char.id,
                    name=char.name,
                    level=char.level,
                    job=char.job,
                    job_rank=char.jobRank,
                    fame=char.fame,
                    rank=char.rank,
                    job_name=JobInfo.get_by_code(char.job, char.job),
                    guild_name=guild.name if guild else "",
                    guild=GuildItem.model_validate(guild) if guild else None,
                    quest_count=quest_stat.get(str(char.id), 0),
                    monster_book=mb_stat.get(str(char.id), 0),
                )
            )
        return CharRankResponse(total=total, items=items)

    @staticmethod
    @cache.cache_fn(expire=300, serializer=Pydantic(GuildRankResponse))
    async def guild_rank(page: int, size: int):
        """Guild Rank"""
        offset = (page - 1) * size
        total, guilds = await asyncio.gather(Guild.all().count(), Guild.get_top_n(100))
        sort_guilds = guilds[offset : offset + size]
        leaders, alliances, members = await asyncio.gather(
            Character.filter(id__in=[guild.leader for guild in guilds]).all(),
            Alliance.filter(id__in=[guild.allianceId for guild in guilds]).all(),
            Character.filter(guildid__in={guild.guildid for guild in sort_guilds})
            .group_by("guildid").annotate(cnt=Count("id")).values("guildid", "cnt"),
        )
        leader_name_dict = {l.id: l.name for l in leaders}
        alliance_name_dict = {a.id: a.name for a in alliances}
        member_count_dict = {m["guildid"]: m["cnt"] for m in members}
        items = []
        for guild in sort_guilds:
            guild.leader_name = leader_name_dict.get(guild.leader, "")
            guild.alliance_name = alliance_name_dict.get(guild.allianceId, "")
            guild.member = member_count_dict.get(guild.guildid, 0)
            items.append(GuildItem.model_validate(guild))
        return GuildRankResponse(total=total, items=items)
