import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.api.v1.router import api_router
from src.core.config import settings
from src.core.exceptions import AppError

from src.api.v1.router import api_router
from src.services.device_hub import tick_loop



@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(tick_loop())
    yield
    task.cancel()


app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG, lifespan=lifespan)

app.include_router(api_router, prefix="/api/v1")