"""Набор эмуляторов устройств."""
from .barrier import Barrier
from .counter import Counter
from .elevator import Elevator
from .fire import FireDetector
from .leak_hub import LeakHub
from .leak_sensor import LeakSensor
from .light import Light
from .thermostat import Thermostat
from .ventilation import Ventilation

REGISTRY = {
    "leak": LeakSensor,
    "barrier": Barrier,
    "thermostat": Thermostat,
    "elevator": Elevator,
    "hub": LeakHub,
    "counter": Counter,
    "ventilation": Ventilation,
    "fire": FireDetector,
    "light": Light,
}
