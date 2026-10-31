import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.api.v1.router import api_router
from src.services.device_hub import tick_loop
from src.services.rules import rules_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    tasks = [asyncio.create_task(tick_loop()), asyncio.create_task(rules_loop())]
    yield
    for task in tasks:
        task.cancel()


app = FastAPI(title="Smart emulators", lifespan=lifespan)

app.include_router(api_router, prefix="/api/v1")