import asyncio
import sys
from pathlib import Path
from src.services.notifications import notify
# эмуляторы используют плоские импорты
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "emulators"))

from devices import REGISTRY

NAMES = [
    "leak",
    "barrier",
    "thermostat",
    "counter",
    "light",
    "fire",
    "ventilation",
    "elevator",
]

devices = {name: REGISTRY[name](serial=f"ctrlaltelite_{name}_01") for name in NAMES}


async def tick_loop():
    while True:
        for device in devices.values():
            device.step(1)
        await asyncio.sleep(1)


def get_state(name):
    return {s.name: s.value for s in devices[name].signals.values()}


def send_command(name, signal, value):
    device = devices[name]
    device.handle_recv(
        {
            "recv": [
                {
                    "command": "management",
                    "id": device.serial,
                    signal: value,
                }
            ]
        }
    )


def set_emergency(name, on):
    """имитация аварии устройства: on=True включает, on=False сбрасывает"""
    notify("Лифт", "Авария в лифте", level="critical", source="elevator")
    device = devices[name]
    if name == "leak":
        device.set_wet(on)
    elif name == "fire":
        device.set_emergency(on)
    elif name == "barrier":
        device.set_obstacle(on)
        device.set_value("alarm", 1 if on else 0)
    elif name == "thermostat":
        device.set_fault(on)
    elif name == "elevator":
        if device.signals["emergency"].value != int(on):
            device.on_command("emergency_btn", 1)  # кнопка переключает аварию
    elif name == "counter":
        device.set_value("online", 0 if on else 1)  # пропала связь
    elif name == "ventilation":
        device.set_value("co2", 1900 if on else 450)
        device.set_value("pm25", 40 if on else 5)
    elif name == "light":
        send_command(name, "lamp", int(on))  # аварийное освещение
        if on:
            send_command(name, "brightness", 100)
