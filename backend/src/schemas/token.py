from pydantic import BaseModel


class Token(BaseModel):
    """Модель токена для ответа API."""

    access_token: str
    token_type: str = "bearer"