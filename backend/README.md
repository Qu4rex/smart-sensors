# Backend

FastAPI + SQLAlchemy 2 (async, драйвер asyncpg) + Alembic. База: PostgreSQL. Менеджер пакетов: [uv](https://docs.astral.sh/uv/).
Python версии из `.python-version`.

## Структура

```text
backend/
├── src/
│   ├── api/
│   │   ├── deps.py          # зависимости FastAPI (сессия, CRUD, сервисы, текущий пользователь)
│   │   └── v1/
│   │       ├── router.py    # собирает все роутеры под /api/v1
│   │       └── endpoints/   # эндпоинты: health.py, auth.py
│   ├── core/                # config.py (настройки), security.py (JWT, пароли), exceptions.py
│   ├── crud/                # запросы к БД, по классу на сущность
│   ├── db/                  # base.py (Base, TimestampMixin), session.py (engine, сессия)
│   ├── models/              # SQLAlchemy-модели
│   ├── schemas/             # Pydantic-схемы запросов и ответов
│   ├── services/            # бизнес-логика
│   └── main.py              # точка входа FastAPI
├── migration/               # Alembic: env.py и versions/
├── tests/                   # pytest 
├── alembic.ini
├── pyproject.toml           # зависимости, настройки ruff и pytest
└── .env.example
```

Слои вызывают друг друга сверху вниз: `endpoints` → `services` → `crud` → `models`.
Эндпоинт не ходит в БД напрямую.

## Настройки

Читаются из переменных окружения или файла `backend/.env` (`cp .env.example .env`).

| Переменная | Описание |
|------------|----------|
| `APP_NAME` | название в Swagger |
| `DEBUG` | `true` включает debug-режим и SQL-логи. На сервере только `false` |
| `CORS_ORIGINS` | JSON-массив разрешённых адресов, например `["http://localhost:5173"]` |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB` | подключение к БД. Эти же имена использует контейнер postgres |
| `JWT_SECRET` | секрет подписи токенов: `openssl rand -hex 64` |
| `ALGORITHM` | алгоритм JWT, по умолчанию `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | срок жизни обычного токена |
| `REMEMBER_ME_EXPIRE_DAYS` | срок жизни токена при «Запомнить меня» |

Строка подключения собирается из `POSTGRES_*` (`Settings.DATABASE_URL`), отдельной `DATABASE_URL` нет.

## Запуск

Нужна работающая база: из корня проекта `docker compose up -d postgres`.

```bash
uv sync                                        # зависимости (вместе с dev)
uv run alembic upgrade head                    # миграции
uv run uvicorn src.main:app --reload --port 8000
```

- API: http://localhost:8000/api/v1
- Проверка: http://localhost:8000/api/v1/health
- Swagger: http://localhost:8000/docs

## API авторизации

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/auth/register` | регистрация (`username` или `login`, `password`) |
| POST | `/api/v1/auth/login` | вход (JSON), `remember: true` даёт долгий токен |
| POST | `/api/v1/auth/token` | вход через форму OAuth2 (для кнопки Authorize в Swagger) |
| POST | `/api/v1/auth/logout` | отзывает токен (он попадает в таблицу `revoked_tokens`) |

Ошибки приложения приходят как `{"detail": "...", "code": "..."}`.
Правила логина и пароля (`schemas/user.py`) совпадают с frontend (`frontend/src/utils/validation.ts`),
меняйте их в обоих местах.

## Миграции

```bash
uv run alembic revision --autogenerate -m "add posts table"   # создать
uv run alembic upgrade head                                   # применить
uv run alembic downgrade -1                                   # откатить последнюю
uv run alembic check                                          # модели и миграции расходятся?
```

Автогенерация видит только модели, импортированные в `src/models/__init__.py`.
Новую модель обязательно добавьте туда. Всегда просматривайте созданный файл перед коммитом.
CI запускает `alembic check` и упадёт, если вы изменили модель и забыли миграцию.


## Тесты и качество кода

```bash
uv run pytest                  # тесты
uv run ruff check .            # линтер
uv run ruff format .           # автоформатирование
```