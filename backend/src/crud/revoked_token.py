from datetime import UTC, datetime

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.revoked_token import RevokedToken


class RevokedTokenCRUD:
    """Операции с отозванными токенами (чёрный список JWT) в базе данных."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def is_revoked(self, jti: str) -> bool:
        """Проверить, отозван ли токен с указанным jti."""

        return await self.session.get(RevokedToken, jti) is not None

    async def revoke(self, jti: str, expires_at: datetime) -> None:
        """Добавить токен в чёрный список."""

        self.session.add(RevokedToken(jti=jti, expires_at=expires_at))
        await self.session.flush()

    async def delete_expired(self) -> None:
        """Удалить из чёрного списка токены, которые и так уже просрочены."""

        await self.session.execute(
            delete(RevokedToken).where(RevokedToken.expires_at < datetime.now(UTC))
        )