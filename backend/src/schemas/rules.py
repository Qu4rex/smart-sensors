from pydantic import BaseModel
class When(BaseModel):
    device: str
    signal: str
    op: str = "=="
    value: int | float | str

class Action(BaseModel):
    device: str
    signal: str
    value: int | float | str

class RuleIn(BaseModel):
    name: str
    when: When
    then: list[Action]


class SimulateIn(BaseModel):
    rule_id: int | None = None
    when: When | None = None
    value: int | float | str | None = None
