# smart-emulators

Веб-приложения smart-sensors.

- **Backend:** FastAPI + SQLAlchemy 2 (async) + Alembic, подробности в [backend/README.md](backend/README.md)
- **Frontend:** React + TypeScript + Vite, подробности в [frontend/README.md](frontend/README.md)
- **База данных:** PostgreSQL
- **Запуск:** Docker Compose (nginx + backend + postgres)
- **CI/CD:** GitHub Actions (линтеры, тесты, автодеплой на Ubuntu-сервер)

Commit rules:

### `feat:` — Новые фичи
Используется, когда вы добавляете новый функционал для пользователя или новую логику в проект.
* **Пример:** `feat: добавлена возможность авторизации через Google`

### `fix:` — Исправление ошибок
Используется, когда вы устраняете баг или ошибку в существующем коде.
* **Пример:** `fix: исправлена ошибка валидации email при отправке`

### `docs:` — Документация
Применяется при любых изменениях в текстовом сопровождении проекта: README, инструкции или комментарии в коде.
* **Пример:** `docs: обновлена инструкция по запуску проекта в README`

### `style:` — Стиль и оформление
Правки, которые влияют только на внешний вид кода (отступы, форматирование, удаление лишних пробелов). Логика работы кода **не меняется**.
* **Пример:** `style: переформатирован код по стандарту PEP 8`

### `refactor:` — Рефакторинг
Изменение структуры кода ради улучшения его читаемости, производительности или архитектуры. При этом **новые фичи не добавляются** и **баги не исправляются**.
* **Пример:** `refactor: оптимизирована функция подсчета стоимости`


## Структура проекта

```text
.
├── backend/                  # FastAPI-приложение (src/, migration/, tests/)
├── frontend/                 # React-приложение (src/) и конфиг nginx
├── deploy/                   # скрипт деплоя на сервере
├── docs/                     # инструкции: docker, ssl, деплой
├── .github/                  # GitHub Actions
├── docker-compose.yml        # боевой запуск (наружу открыты только 80 и 443)
└── docker-compose.override.yml  # только для разработки: открывает порты базы и backend
```

## Быстрый старт для разработки

Нужны: Docker, [uv](https://docs.astral.sh/uv/), Node.js (версия в `frontend/.nvmrc`).

```bash
cp backend/.env.example backend/.env      # Windows: copy backend\.env.example backend\.env
docker compose up -d postgres             # база на 127.0.0.1:5432
```

Backend (http://localhost:8000, Swagger: http://localhost:8000/docs):

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn src.main:app --reload --port 8000
```

Frontend (http://localhost:5173), в другом терминале:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Vite проксирует `/api` на backend, поэтому CORS настраивать не нужно.

## Проверки качества

Те же проверки запускает CI на каждый pull request.

| Что | Backend (`cd backend`) | Frontend (`cd frontend`) |
|-----|------------------------|--------------------------|
| Линтер | `uv run ruff check .` | `npm run lint` |
| Форматирование | `uv run ruff format .` | `npm run format` |
| Тесты | `uv run pytest` | `npm test` |
