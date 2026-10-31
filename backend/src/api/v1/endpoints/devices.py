from fastapi import APIRouter, Query
#from pydantic import BaseModel

from src.services import device_hub
from src.schemas.devices import Command
router = APIRouter(prefix="/devices")


@router.get("")
async def list_devices():
    return {name: {"title": d.title, "state": device_hub.get_state(name)}
            for name, d in device_hub.devices.items()}


@router.get("/{name}")
async def get_device(name: str):
    device = device_hub.devices[name]
    return {"title": device.title,
            "state": device_hub.get_state(name),
            "declaration": device.declaration()}


@router.post("/{name}/command")
async def send_command(name: str, cmd: Command):
    device_hub.send_command(name, cmd.signal, cmd.value)
    return {"ok": True}

@router.post("/leak/wet")
async def set_leak(wet: bool):
    """намочить (true) или высушить (false) датчик протечки"""
    device_hub.devices["leak"].set_wet(wet)
    return {"ok": True}

@router.post(
    "/{name}/emergency",
    summary="emergency set",
    description="включает (on=true) или сбрасывает (on=false) аварийное состояние устройства",
)
async def set_emergency(name: str, on: bool = Query(description="true - авария, false - сброс")):
    device_hub.set_emergency(name, on)
    return {"ok": True}