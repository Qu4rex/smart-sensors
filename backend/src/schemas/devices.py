from pydantic import BaseModel

class Command(BaseModel):
    signal: str
    value: int | float | str