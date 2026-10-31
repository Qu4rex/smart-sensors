from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Базовый класс для всех моделей SQLAlchemy.

    Имя таблицы каждая модель задаёт явно через __tablename__.
    """

    __abstract__ = True


class TimestampMixin:
    """Миксин для добавления временных меток создания и обновления к моделям SQLAlchemy."""

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )