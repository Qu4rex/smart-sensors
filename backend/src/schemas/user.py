import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

LOGIN_RE = re.compile(r'^(?:\+7|8|7)\d{10}$')
PASSWORD_RE = re.compile(r"^[!-~]{8,18}$")


class UserBase(BaseModel):
    """Базовая модель пользователя."""

    login: str


class UserCreate(BaseModel):
    """Тело запроса на регистрацию: логин и пароль.

    Логин принимается в поле `login` (фронтенд шлёт `login`).
    """

    login: str
    password: str

    @field_validator("login")
    @classmethod
    def validate_login(cls, value: str) -> str:
        if not LOGIN_RE.fullmatch(value):
            raise ValueError(
                "Логин: требуется в формате номера телефона, "
                "дальше только латинские буквы и цифры"
            )
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not PASSWORD_RE.fullmatch(value):
            raise ValueError("Пароль: от 8 до 18 латинских букв, цифр и символов, без пробелов")
        return value


class UserUpdate(BaseModel):
    """Тело PATCH /me: меняются только переданные поля."""

    first_name: str | None = Field(default=None, min_length=3, max_length=64)
    second_name: str | None = Field(default=None, min_length=3, max_length=64)

    @field_validator("first_name", "second_name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Имя не может быть пустым")
        if not re.fullmatch(r"^[A-Za-zА-Яа-яЁё\-' ]+$", value):
            raise ValueError("Имя: только буквы, дефис, апостроф и пробел")
        return value


class LoginRequest(BaseModel):
    """Тело запроса на вход (JSON)."""

    login: str = Field(min_length=10, max_length=64)
    # Верхняя граница защищает от очень длинных строк при хешировании
    password: str = Field(min_length=1, max_length=128)
    remember: bool = False  # True = запомнить на REMEMBER_ME_EXPIRE_DAYS дней


class UserRead(UserBase):
    """Модель пользователя для ответа API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    first_name: str | None
    second_name: str | None
    created_at: datetime
