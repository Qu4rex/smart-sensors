import asyncio
import sys
from pathlib import Path

# эмуляторы используют плоские импорты
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "emulators"))

from devices import REGISTRY

NAMES = ["leak", "barrier", "thermostat", "counter", "light"]

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
    device.handle_recv({"recv": [{"command": "management", "id": device.serial, signal: value}]})