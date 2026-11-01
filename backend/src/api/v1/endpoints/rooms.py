from fastapi import APIRouter, status
from sqlalchemy import select

from src.api.deps import CurrentUserDep, SessionDep
from src.models.user_room import UserRoom
from src.schemas.rooms import RoomCreate, RoomRead

router = APIRouter(prefix="/rooms")


@router.get("", response_model=list[RoomRead])
async def list_rooms(current_user: CurrentUserDep, session: SessionDep):
    result = await session.execute(
        select(UserRoom).where(UserRoom.owner_id == current_user.id).order_by(UserRoom.id)
    )
    return list(result.scalars())


@router.post("", response_model=RoomRead, status_code=status.HTTP_201_CREATED)
async def create_room(data: RoomCreate, current_user: CurrentUserDep, session: SessionDep):
    room = UserRoom(name=data.name.strip(), owner_id=current_user.id)
    session.add(room)
    await session.commit()
    await session.refresh(room)
    return room
