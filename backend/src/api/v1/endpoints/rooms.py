from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, select

from src.api.deps import CurrentUserDep, SessionDep
from src.models.user_room import UserRoom
from src.models.user_device import UserDevice
from src.schemas.rooms import RoomCreate, RoomRead, RoomUpdate

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


@router.patch("/{room_id}", response_model=RoomRead)
async def update_room(room_id: int, data: RoomUpdate, current_user: CurrentUserDep, session: SessionDep):
    room = await session.scalar(
        select(UserRoom).where(UserRoom.id == room_id, UserRoom.owner_id == current_user.id)
    )
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Комната не найдена")

    old_name = room.name
    room.name = data.name.strip()
    await session.execute(
        UserDevice.__table__.update()
        .where(UserDevice.owner_id == current_user.id, UserDevice.room == old_name)
        .values(room=room.name)
    )
    await session.commit()
    await session.refresh(room)
    return room


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(room_id: int, current_user: CurrentUserDep, session: SessionDep):
    room = await session.scalar(
        select(UserRoom).where(UserRoom.id == room_id, UserRoom.owner_id == current_user.id)
    )
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Комната не найдена")

    await session.execute(
        delete(UserDevice).where(UserDevice.owner_id == current_user.id, UserDevice.room == room.name)
    )
    await session.delete(room)
    await session.commit()
