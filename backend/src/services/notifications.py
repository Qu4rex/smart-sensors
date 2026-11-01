import time

MAX_ITEMS = 50

_items = []
_next_id = 1


def notify(title, text="", level="info", source=None):
    """Создаёт уведомление:
    level: info, warning, critical
    source: кто создал. Пример: rules или elevator
    """
    global _next_id
    item = {
        "id": _next_id,
        "time": time.strftime("%H:%M:%S"),
        "level": level,
        "title": title,
        "text": text,
        "source": source,
    }
    _items.append(item)
    _next_id += 1
    del _items[:-MAX_ITEMS]
    return item


def get_new(after_id=0):
    """уведомления с id больше after_id"""
    return [n for n in _items if n["id"] > after_id]
