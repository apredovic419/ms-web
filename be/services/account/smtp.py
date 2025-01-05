from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from aiosmtplib import SMTP, SMTPException, SMTPRecipientRefused, SMTPRecipientsRefused

from component.logger import logger
from config import SMTPConfig


class SMTPError(Exception):
    def __init__(self, message: str, status: int):
        self.message = message
        self.status = status


class SMTPService:
    def __init__(self, config: SMTPConfig):
        self.config = config
        self.c = SMTP(hostname=self.config.host, port=self.config.port, use_tls=self.config.use_tls)

    async def send_mime(
        self,
        to: str,
        subject: str,
        content: str,
        subtype: str = "plain",
    ):
        message = MIMEMultipart()
        message["From"] = self.config.username
        message["To"] = to
        message["Subject"] = subject
        message.attach(MIMEText(content, subtype))
        try:
            async with self.c:
                await self.c.login(self.config.username, self.config.password)
                await self.c.send_message(message)
        except (SMTPRecipientRefused, SMTPRecipientsRefused):
            raise SMTPError("收件服务器拒绝接收", 500)
        except SMTPException:
            raise SMTPError("SMTP服务相关错误", 500)
        except Exception as err:
            logger.warning(f"send_captcha error: {err}")
            raise SMTPError(f"未知错误: {err}", 500)
