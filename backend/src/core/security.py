from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
from pwdlib import PasswordHash

from src.core.config import settings

password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Хеширует пароль с использованием безопасного алгоритма хеширования."""

    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Проверяет, соответствует ли пароль хешу."""

    return password_hasher.verify(password, hashed_password)


def create_access_token(user_id: int, expires_delta: timedelta | None = None) -> str:
    """Создаёт JWT токен для пользователя с указанным user_id.

    Без expires_delta срок жизни берётся из ACCESS_TOKEN_EXPIRE_MINUTES.
    """

    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(UTC) + expires_delta
    payload = {"sub": str(user_id), "exp": expire, "jti": uuid4().hex}
    return jwt.encode(payload, settings.JWT_SECRET.get_secret_value(), algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Проверяет подпись и срок JWT токена. Возвращает payload или None, если токен невалиден."""

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET.get_secret_value(),
            algorithms=[settings.ALGORITHM],
            options={"require": ["exp", "sub", "jti"]},
        )
        int(payload["sub"])
    except jwt.InvalidTokenError, ValueError:
        return None
    return payload