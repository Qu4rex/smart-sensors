from datetime import UTC, datetime, timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.exceptions import (
    InactiveUserError,
    InvalidCredentialsError,
    LoginAlreadyExistsError,
    LoginTakenError,
)
from src.core.security import create_access_token, hash_password, verify_password
from src.crud.revoked_token import RevokedTokenCRUD
from src.crud.user import UserCRUD
from src.models.user import User
from src.schemas.token import Token
from src.schemas.user import UserCreate

# Хеш-пустышка: проверяем пароль и для несуществующего пользователя,
# чтобы по времени ответа нельзя было понять, существует ли логин.
_DUMMY_HASHED_PASSWORD = hash_password("dummy-password")


class AuthService:
    """Сервис для аутентификации пользователей."""

    def __init__(self, session: AsyncSession, users: UserCRUD, revoked: RevokedTokenCRUD) -> None:
        self.session = session
        self.users = users
        self.revoked = revoked

    async def register_user(self, data: UserCreate) -> User:
        """Регистрирует нового пользователя в системе."""

        if await self.users.get_by_login(data.login):
            raise LoginTakenError

        try:
            user = await self.users.create(
                login=data.login,
                hashed_password=hash_password(data.password),
            )
            await self.session.commit()
        except IntegrityError:
            # Два параллельных запроса с одним логином: проверка выше обоих пропустила.
            await self.session.rollback()
            raise LoginAlreadyExistsError from None

        return user

    async def authenticate_user(self, login: str, password: str) -> User:
        """Аутентифицирует пользователя по login и паролю."""

        user = await self.users.get_by_login(login)

        if not user:
            verify_password(password, _DUMMY_HASHED_PASSWORD)
            raise InvalidCredentialsError

        if not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError

        if not user.is_active:
            raise InactiveUserError

        return user

    def create_access_token_for_user(self, user: User, remember: bool = False) -> Token:
        """Создаёт JWT токен для аутентифицированного пользователя.

        remember=True выдаёт долгоживущий токен (REMEMBER_ME_EXPIRE_DAYS дней).
        """

        expires_delta = timedelta(days=settings.REMEMBER_ME_EXPIRE_DAYS) if remember else None
        access_token = create_access_token(user_id=user.id, expires_delta=expires_delta)
        return Token(access_token=access_token, token_type="bearer")

    async def logout(self, payload: dict) -> None:
        """Отзывает токен: добавляет его jti в чёрный список и чистит просроченные записи."""

        expires_at = datetime.fromtimestamp(payload["exp"], UTC)
        try:
            await self.revoked.revoke(payload["jti"], expires_at)
            await self.revoked.delete_expired()
            await self.session.commit()
        except IntegrityError:
            # Токен уже отозван параллельным запросом: повторный выход ничего не меняет.
            await self.session.rollback()