import json
from threading import Lock
from typing import List, Optional

import grpc
from google.protobuf.internal.python_message import GeneratedProtocolMessageType

from config import RPCConfig
from models.game import Character, User
from services.rpc import magicms_pb2 as pb_type
from services.rpc.magicms_pb2_grpc import GreeterStub

__all__ = ["MagicService", "pb_type", "ProtoBufSerializer"]
__author__ = "magcims"


class ProtoBufSerializer:
    """为ProtoBuf消息类提供的序列化器接口

    :param message_type: Pydantic模型类
    """

    def __init__(self, message_type: type[GeneratedProtocolMessageType]):
        self.message_type = message_type

    def loads(self, s, *args, **kwargs):
        return self.message_type.FromString(s)  # noqa

    @staticmethod
    def dumps(obj, *args, **kwargs):
        return obj.SerializeToString()


class SingletonMeta(type):
    __instance = None
    __lock = Lock()

    def __call__(cls, *args, **kwargs):
        with cls.__lock:
            if not cls.__instance:
                cls.__instance = super().__call__(*args, **kwargs)
        return cls.__instance


class MagicService(metaclass=SingletonMeta):
    pb_module = pb_type
    service_config = {
        "methodConfig": [
            {
                "name": [{"service": "rpcclient.Greeter"}],
                "retryPolicy": {
                    "maxAttempts": 3,
                    "initialBackoff": "0.1s",
                    "maxBackoff": "1s",
                    "backoffMultiplier": 2,
                    "retryableStatusCodes": ["UNAVAILABLE"],
                },
            }
        ]
    }
    options = [
        ("grpc.keepalive_time_ms", 3600000),
        ("grpc.keepalive_timeout_ms", 10000),
        ("grpc.keepalive_permit_without_calls", True),
        ("grpc.enable_retries", 1),
        ("grpc.service_config", json.dumps(service_config))
    ]

    def __init__(
        self,
        host: str = "localhost",
        port: int = 50015,
        tls=True,
        root_certificates=None,
        private_key=None,
        certificate_chain=None,
        metadata=None,
    ):
        if tls:
            credentials = grpc.ssl_channel_credentials(
                root_certificates, private_key, certificate_chain
            )
            channel = grpc.aio.secure_channel(f"{host}:{port}", credentials, options=self.options)
        else:
            channel = grpc.aio.insecure_channel(f"{host}:{port}", options=self.options)
        if metadata:
            self.metadata = [(k, v) for k, v in metadata.items()]
        else:
            self.metadata = None
        self.stub = GreeterStub(channel)
        self.enabled = True

    @classmethod
    def load_from_config(cls, cfg: RPCConfig) -> "MagicService":
        """从对象属性加载服务"""
        params = {"host": cfg.host, "port": cfg.port, "tls": cfg.tls, "metadata": cfg.metadata}
        if cfg.root_certificates:
            with open(cfg.root_certificates, "rb") as f:
                params["root_certificates"] = f.read()
        if cfg.certificate_chain:
            with open(cfg.certificate_chain, "rb") as f:
                params["certificate_chain"] = f.read()
        if cfg.private_key:
            with open(cfg.private_key, "rb") as f:
                params["private_key"] = f.read()
        client = cls(**params)
        client.enabled = cfg.enable
        return client

    @staticmethod
    def _build_asset_req(name, _type, number, message=None):
        params = {"name": name, "type": _type, "number": number, "message": message}
        for k, v in list(params.items()):
            if v is None:
                del params[k]
        req = pb_type.NxRequest(**params)
        return req

    @staticmethod
    def _build_msg_req(
        _type: pb_type.MessageType,
        content: str = None,
        recv: str = None,
        send: str = None,
    ) -> pb_type.MessageRequest:
        """构建消息请求"""
        params = {"type": _type, "message": content, "recv": recv, "send": send}
        for k, v in list(params.items()):
            if v is None:
                del params[k]
        req = pb_type.MessageRequest(**params)
        return req

    async def set_server_message(self, content: str) -> pb_type.CommonReply:
        """设置服务器滚动消息
        :param content: 消息内容
        :return: CommonReply {result: bool, message: str}
        """
        res = await self.stub.Message(
            self._build_msg_req(pb_type.server, content),
            metadata=self.metadata,
        )
        return res

    async def send_notice(self, content: str) -> pb_type.CommonReply:
        """发送全服消息
        :param content: 消息内容
        :return: CommonReply {result: bool, message: str}
        """
        res = await self.stub.Message(
            self._build_msg_req(pb_type.notice, content),
            metadata=self.metadata,
        )
        return res

    async def send_char_message(self, recv: str, content: str) -> pb_type.CommonReply:
        """向指定玩家发送私人消息（黄色消息）
        :param recv: 目标玩家名
        :param content: 消息内容
        :return: CommonReply {result: bool, message: str}
        """
        res = await self.stub.Message(
            self._build_msg_req(pb_type.personal, content, recv), metadata=self.metadata
        )
        return res

    async def send_note(self, send: str, recv: str, content: str) -> pb_type.CommonReply:
        """向指定玩家发送消息并通知（消息道具）
        :param send: 发送署名（不要求真实玩家名称）
        :param recv: 目标玩家名
        :param content: 消息内容
        :return: CommonReply {result: bool, message: str}
        """
        res = await self.stub.Message(
            self._build_msg_req(pb_type.note, content, recv, send),
            metadata=self.metadata,
        )
        return res

    async def send_delivery_note(self, send: str, recv: str) -> pb_type.CommonReply:
        """向指定玩家发送快递到达通知（快递）
        :param send: 发送署名（不要求真实玩家名称）
        :param recv: 目标玩家名
        :return: CommonReply {result: bool, message: str}
        """
        res = await self.stub.Message(
            self._build_msg_req(pb_type.delivery, send=send, recv=recv),
            metadata=self.metadata,
        )
        return res

    async def get_online(self, **kwargs) -> (int, List[str]):
        """返回在线人数和在线角色
        :return: 在线
        """
        res = await self.stub.GetOnline(
            pb_type.Empty(),
            **kwargs,
            metadata=self.metadata,
        )
        return res.count, list(res.data)

    async def ban(self, name: str, message: str = None) -> pb_type.CommonReply:
        params = {"name": name}
        if message:
            params["message"] = message
        res = await self.stub.BanUser(
            pb_type.CommonRequest(**params),
            metadata=self.metadata,
        )
        return res

    async def get_char_info(self, name: str) -> Optional[pb_type.CharacterReply]:
        res = await self.stub.GetCharacterInfo(
            pb_type.CommonRequest(name=name),
            metadata=self.metadata,
        )
        if res.online:
            return res

    async def add_nx(self, name: str, number: int, message: str = None) -> pb_type.CommonReply:
        """向指定玩家增减点券(NX)
        :param name: 目标角色名
        :param number: 变动数量 负数为减
        :param message: 推送私人消息内容
        :return: CommonReply {result: bool, message: str(调整后的数额)}
        """
        req = self._build_asset_req(name, pb_type.nx, number, message)
        res = await self.stub.GiveNX(req, metadata=self.metadata)
        return res

    async def add_mp(self, name: str, number: int, message: str = None) -> pb_type.CommonReply:
        """向指定玩家增减抵用券(maplePoint)
        :param name: 目标角色名
        :param number: 变动数量 负数为减
        :param message: 推送私人消息内容
        :return: CommonReply {result: bool, message: str}
        """
        req = self._build_asset_req(name, pb_type.mp, number, message)
        res = await self.stub.GiveNX(req, metadata=self.metadata)
        return res

    async def add_np(self, name: str, number: int, message: str = None) -> pb_type.CommonReply:
        """向指定玩家增减信用卡(nxPrepaid)(可用于赠送)
        :param name: 目标角色名
        :param number: 变动数量 负数为减
        :param message: 推送私人消息内容
        :return: CommonReply {result: bool, message: str}
        """
        req = self._build_asset_req(name, pb_type.np, number, message)
        res = await self.stub.GiveNX(req, metadata=self.metadata)
        return res

    async def disconnect(self, name: str) -> pb_type.CommonReply:
        """断开指定玩家连接
        :param name: 目标角色名
        :return: CommonReply {result: bool, message: str}
        """
        res = await self.stub.Disconnect(
            pb_type.CommonRequest(name=name),
            metadata=self.metadata,
        )
        return res

    async def get_hired_shop(self, **kwargs) -> pb_type.MerchantReply:
        """获取雇佣商人信息
        :return:
        """
        res = await self.stub.GetMerchantShop(
            pb_type.Empty(),
            **kwargs,
            metadata=self.metadata,
        )
        return res

    async def _execute(self, command, *params) -> pb_type.CommonReply:
        """创建一个虚拟客户端以最高权限执行游戏中的命令
        :return:
        """
        res = await self.stub.Execute(
            pb_type.CommandRequest(command=command, params=params),
            metadata=self.metadata,
        )
        return res

    async def save_all(self):
        """执行数据库序列化任务"""
        return await self._execute("saveall")

    async def shutdown(self, delay: int):
        """在delay分钟后关闭游戏服务器"""
        return await self._execute("shutdown", str(delay))

    async def find_online_char_by_uid(self, uid: int) -> Optional[Character]:
        """通过账号id找到在线角色 如果账号未在线，返回None
        :param uid: 账号id
        :return:
        """
        c, n = await self.get_online(timeout=8)
        char = await Character.filter(name__in=n, accountid=uid).first()
        if char:
            return char

    async def find_online_char_by_username(self, username: str) -> Optional[Character]:
        """通过账号名找到在线角色 如果账号未在线，返回None"""
        user = await User.filter(name=username).first()
        if user:
            return await self.find_online_char_by_uid(user.id)

