from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    """Проверка работоспособности: используется healthcheck Docker и мониторингом."""

    return {"status": "ok"}
