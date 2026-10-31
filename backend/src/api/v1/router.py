from fastapi import APIRouter

from src.api.v1.endpoints import health
from src.api.v1.endpoints import devices
api_router = APIRouter()

api_router.include_router(health.router, tags=["system"])
api_router.include_router(devices.router, tags=["system"])