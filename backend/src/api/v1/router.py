from fastapi import APIRouter, Depends

from src.api.v1.endpoints import auth, devices, health, rooms, rules, notifications
from src.api.deps import get_current_user

api_router = APIRouter()

api_router.include_router(health.router, tags=["system"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(devices.router, tags=["devices"], dependencies=[Depends(get_current_user)])
api_router.include_router(rooms.router, tags=["rooms"], dependencies=[Depends(get_current_user)])
api_router.include_router(rules.router, tags=["rules"], dependencies=[Depends(get_current_user)])
api_router.include_router(notifications.router, tags=["notifications"], dependencies=[Depends(get_current_user)])

