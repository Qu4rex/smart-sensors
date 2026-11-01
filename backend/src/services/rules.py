import asyncio
import operator
import time
from datetime import datetime
from src.services import device_hub
from src.services.notifications import notify


OPS = {"==": operator.eq, "!=": operator.ne, ">": operator.gt,
       "<": operator.lt, ">=": operator.ge, "<=": operator.le}

rules = {}
log = []
_active = {}
_next_id = 1


def add_rule(rule):
    global _next_id
    rule = {"id": _next_id, **rule}
    rules[_next_id] = rule
    _next_id += 1
    return rule

def update_rule(rule_id, data):
    if rule_id not in rules:
        return None
    rule = {"id": rule_id, **data}
    rules[rule_id] = rule
    _active.pop(rule_id, None)
    return rule


def delete_rule(rule_id):
    """ удаляет правило по id """
    rules.pop(rule_id, None)
    _active.pop(rule_id, None)


def run_actions(rule):
    """ отправляет все команды из then и пишет срабатывание в журнал """
    for action in rule["then"]:
        if action["device"] == "notification":
            notify(rule["name"], str(action["value"]), level="critical", source="rules")
        else:
            device_hub.send_command(action["device"], action["signal"], action["value"])
    log.append({"time": time.strftime("%H:%M:%S"), "rule": rule["name"], "then": rule["then"]})
    del log[:-50]


def check_rules():
    """ Проверяет все правила. Срабатывает один раз, когда условие стало истинным """
    for rule_id, rule in list(rules.items()):
        try:
            when = rule["when"]
            value = device_hub.get_state(when["device"])[when["signal"]]
            now = OPS[when["op"]](value, when["value"])
            if now and not _active.get(rule_id):
                notify("Лифт", "Авария в лифте", level="critical", source="elevator")
                run_actions(rule)
            _active[rule_id] = now
        except Exception as exc:
            print(f"[rules] правило {rule_id}: {exc}")


def simulate(rule_id=None, when=None, value=None):
    """Пробная проверка условия: команды не отправляются, состояние устройств не меняется.
    value - введённое показание датчика; без него берётся текущее значение устройства.
    Ошибки: LookupError (нет сценария/устройства/сигнала), ValueError (неверные данные)."""
    rule = None
    if rule_id is not None:
        rule = rules.get(rule_id)
        if rule is None:
            raise LookupError("Сценарий не найден")
        when = rule["when"]
    if when is None:
        raise ValueError("Укажите сценарий или условие")

    if when["op"] not in OPS:
        raise ValueError(f"Неизвестный оператор «{when['op']}»")
    if when["device"] not in device_hub.devices:
        raise LookupError(f"Устройство «{when['device']}» не найдено")
    state = device_hub.get_state(when["device"])
    if when["signal"] not in state:
        raise LookupError(f"У устройства нет сигнала «{when['signal']}»")

    current = state[when["signal"]]
    checked = current if value is None else value
    try:
        triggered = bool(OPS[when["op"]](checked, when["value"]))
    except TypeError:
        raise ValueError(f"Нельзя сравнить «{checked}» и «{when['value']}»")

    return {
        "rule_id": rule["id"] if rule else None,
        "rule_name": rule["name"] if rule else None,
        "when": when,
        "current": current,
        "checked": checked,
        "from_input": value is not None,
        "triggered": triggered,
        # настоящий сценарий срабатывает один раз, пока условие не перестанет выполняться
        "already_active": bool(rule and _active.get(rule["id"])),
        "then": rule["then"] if rule else [],
    }


async def rules_loop():
    """Раз в секунду проверяет срабатывание"""
    while True:
        check_rules()
        await asyncio.sleep(1)