from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import InvalidTokenError
from src.core.security import decode_access_token
from src.crud.revoked_token import RevokedTokenCRUD
from src.crud.user import UserCRUD
from src.db.session import get_async_session
from src.models.user import User
from src.services.auth import AuthService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

SessionDep = Annotated[AsyncSession, Depends(get_async_session)]


def get_user_crud(session: SessionDep) -> UserCRUD:
    """Создаёт UserCRUD на сессии текущего запроса."""

    return UserCRUD(session)


UserCRUDDep = Annotated[UserCRUD, Depends(get_user_crud)]


def get_revoked_token_crud(session: SessionDep) -> RevokedTokenCRUD:
    """Создаёт RevokedTokenCRUD на сессии текущего запроса."""

    return RevokedTokenCRUD(session)


RevokedTokenCRUDDep = Annotated[RevokedTokenCRUD, Depends(get_revoked_token_crud)]


def get_auth_service(
    session: SessionDep, users: UserCRUDDep, revoked: RevokedTokenCRUDDep
) -> AuthService:
    """Создаёт AuthService. Сессия общая с CRUD: FastAPI кэширует зависимости в рамках запроса."""

    return AuthService(session, users, revoked)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


async def get_token_payload(
    token: Annotated[str, Depends(oauth2_scheme)], revoked: RevokedTokenCRUDDep
) -> dict:
    """Проверяет Bearer-токен (подпись, срок, отзыв) и возвращает его payload."""

    payload = decode_access_token(token)
    if payload is None or await revoked.is_revoked(payload["jti"]):
        raise InvalidTokenError
    return payload


TokenPayloadDep = Annotated[dict, Depends(get_token_payload)]


async def get_current_user(payload: TokenPayloadDep, users: UserCRUDDep) -> User:
    """Возвращает пользователя по Bearer-токену."""

    user = await users.get_by_id(int(payload["sub"]))
    if user is None or not user.is_active:
        raise InvalidTokenError
    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]
