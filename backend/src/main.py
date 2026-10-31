from fastapi import FastAPI, Request

from src.api.v1.router import api_router

app = FastAPI(title="Example")

app.include_router(api_router, prefix="/api/v1")