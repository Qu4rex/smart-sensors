from datetime import datetime

from pydantic import BaseModel, Field


class RoomCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class RoomRead(RoomCreate):
    id: int
    created_at: datetime
