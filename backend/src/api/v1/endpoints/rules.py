from fastapi import APIRouter
from pydantic import BaseModel
from src.services import rules

router = APIRouter(prefix="/rules")


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


@router.get("")
async def list_rules():
    return list(rules.rules.values())

@router.post("")
async def create_rule(rule: RuleIn):
    return rules.add_rule(rule.model_dump())

@router.delete("/{rule_id}")
async def delete_rule(rule_id: int):
    rules.delete_rule(rule_id)
    return {"ok": True}

@router.get("/log")
async def get_log():
    return rules.log