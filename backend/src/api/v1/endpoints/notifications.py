from fastapi import APIRouter
from src.services import notifications

router = APIRouter(prefix="/notifications")

@router.get(
    "",
    summary="Новые уведомления",
    description="увед с id > after_id. Фронт запоминает последний id ",
)
async def get_notifications(after_id: int = 0):
    return notifications.get_new(after_id)

