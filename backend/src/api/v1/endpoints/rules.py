from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.services import rules
from src.schemas.rules import When, Action, RuleIn
from src.services.notifications import notify

router = APIRouter(prefix="/rules")

@router.get("")
async def list_rules():
    """ Метод получения всех сценариев """
    return list(rules.rules.values())

@router.post("")
async def create_rule(rule: RuleIn):
    """ Метод создания сценария """
    return rules.add_rule(rule.model_dump())

@router.put("/{rule_id}")
async def update_rule(rule_id: int, rule: RuleIn):
    updated = rules.update_rule(rule_id, rule.model_dump())
    if updated is None:
        raise HTTPException(status_code=404, detail="Сценарий не найден")
    return updated

@router.delete("/{rule_id}")
async def delete_rule(rule_id: int):
    """ Метод удаления сценария по его id """
    rules.delete_rule(rule_id)
    return {"ok": True}

@router.get("/log")
async def get_log():
    """ Журнал активности сценариев"""
    return rules.log
