# smart-emulators

Commit rules:


• feat: — Новый функционал (добавили новую фичу, страницу, кнопку, логику).
• Пример: feat: добавлена форма регистрации пользователей
• fix: — Исправление багов (починили то, что работало неправильно).
• Пример: fix: исправлена ошибка валидации email при отправке
• docs: — Документация (изменили README.md, добавили комментарии к коду, обновили инструкции).
• Пример: docs: обновлена инструкция по запуску проекта в README
• style: — Стиль и оформление (правка отступов, форматирование, удаление лишних пробелов). Код при этом не меняет свою логику.
• Пример: style: переформатирован код по стандарту PEP 8
• refactor: — Рефакторинг (изменение кода ради улучшения его структуры, производительности или читаемости). Новых фич нет, баги не чинились.
• Пример: refactor: оптимизирована функция подсчета стоимости
    

Веб-приложения smart-emulator.

- **Backend:** FastAPI + SQLAlchemy 2 (async) + Alembic, подробности в [backend/README.md](backend/README.md)
- **Frontend:** React + TypeScript + Vite, подробности в [frontend/README.md](frontend/README.md)
- **База данных:** PostgreSQL
- **Запуск:** Docker Compose (nginx + backend + postgres)
- **CI/CD:** GitHub Actions (линтеры, тесты, автодеплой на Ubuntu-сервер)

## Структура проекта

```text
.
├── backend/                  # FastAPI-приложение (src/, migration/, tests/)
├── frontend/                 # React-приложение (src/) и конфиг nginx
├── deploy/                   # скрипт деплоя на сервере --------- в разработке
├── docs/                     # инструкции: docker, ssl, деплой --------- в разработке
├── .github/                  # GitHub Actions и Dependabot --------- в разработке
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
