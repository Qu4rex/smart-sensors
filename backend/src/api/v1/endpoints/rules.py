from fastapi import APIRouter
#from pydantic import BaseModel
from src.services import rules
from src.schemas.rules import When, Action, RuleIn

router = APIRouter(prefix="/rules")

@router.get("")
async def list_rules():
    """ Метод получения всех сценариев """
    return list(rules.rules.values())

@router.post("")
async def create_rule(rule: RuleIn):
    """ Метод создания сценария """
    return rules.add_rule(rule.model_dump())

@router.delete("/{rule_id}")
async def delete_rule(rule_id: int):
    """ Метод удаления сценария по его id """
    rules.delete_rule(rule_id)
    return {"ok": True}

@router.get("/log")
async def get_log():
    """ Журнал активности сценариев"""
    return rules.log