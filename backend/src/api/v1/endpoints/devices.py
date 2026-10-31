from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from src.services import device_hub
from src.api.deps import CurrentUserDep, SessionDep
from src.models.user_device import UserDevice
from src.schemas.devices import Command, StoredDeviceCreate, StoredDeviceRead, StoredDeviceUpdate
router = APIRouter(prefix="/devices")


@router.get("")
async def list_devices():
    return {name: {"title": d.title, "state": device_hub.get_state(name)}
            for name, d in device_hub.devices.items()}


@router.get("/stored", response_model=list[StoredDeviceRead])
async def list_stored_devices(current_user: CurrentUserDep, session: SessionDep):
    result = await session.execute(
        select(UserDevice).where(UserDevice.owner_id == current_user.id).order_by(UserDevice.id)
    )
    return list(result.scalars())


@router.post("/stored", response_model=StoredDeviceRead, status_code=201)
async def create_stored_device(
    data: StoredDeviceCreate, current_user: CurrentUserDep, session: SessionDep
):
    device = UserDevice(
        serial=uuid4().hex,
        name=data.name.strip(),
        device_type=data.device_type,
        room=data.room.strip() if data.room else None,
        owner_id=current_user.id,
    )
    session.add(device)
    await session.commit()
    await session.refresh(device)
    return device


@router.patch("/stored/{device_id}", response_model=StoredDeviceRead)
async def update_stored_device(
    device_id: int, data: StoredDeviceUpdate, current_user: CurrentUserDep, session: SessionDep
):
    result = await session.execute(
        select(UserDevice).where(UserDevice.id == device_id, UserDevice.owner_id == current_user.id)
    )
    device = result.scalar_one_or_none()
    if device is None:
        raise HTTPException(status_code=404, detail="Устройство не найдено")
    device.name = data.name.strip()
    device.room = data.room.strip() if data.room else None
    await session.commit()
    await session.refresh(device)
    return device


@router.delete("/stored/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stored_device(device_id: int, current_user: CurrentUserDep, session: SessionDep):
    result = await session.execute(
        select(UserDevice).where(UserDevice.id == device_id, UserDevice.owner_id == current_user.id)
    )
    device = result.scalar_one_or_none()
    if device is None:
        raise HTTPException(status_code=404, detail="Устройство не найдено")
    await session.delete(device)
    await session.commit()


@router.get("/{name}")
async def get_device(name: str):
    device = device_hub.devices[name]
    return {"title": device.title,
            "state": device_hub.get_state(name),
            "declaration": device.declaration()}


@router.post("/{name}/command")
async def send_command(name: str, cmd: Command):
    device_hub.send_command(name, cmd.signal, cmd.value)
    return {"ok": True, "state": device_hub.get_state(name)}

@router.post("/leak/wet")
async def set_leak(wet: bool):
    """намочить (true) или высушить (false) датчик протечки"""
    device_hub.devices["leak"].set_wet(wet)
    return {"ok": True}
