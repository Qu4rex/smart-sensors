from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    """Пользователь приложения."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    login: Mapped[str] = mapped_column(String, unique=True, index=True)

    first_name: Mapped[str] = mapped_column(String, nullable=True)
    second_name: Mapped[str] = mapped_column(String, nullable=True)

    hashed_password: Mapped[str] = mapped_column(Text, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
