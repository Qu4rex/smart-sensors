from datetime import datetime

from pydantic import BaseModel, Field


class Command(BaseModel):
    signal: str
    value: int | float | str


class StoredDeviceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    device_type: str = Field(min_length=1, max_length=64)
    room: str | None = Field(default=None, max_length=64)


class StoredDeviceUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class StoredDeviceRead(StoredDeviceCreate):
    id: int
    serial: str
    created_at: datetime
