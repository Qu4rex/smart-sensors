# Frontend

React 19 + TypeScript + Vite. Роутинг: react-router. Стили: обычный CSS с переменными (светлая и тёмная тема).

## Структура

```text
frontend/
├── src/
│   ├── api/              # client.ts (единый fetch-клиент), auth.ts (запросы авторизации)
│   ├── assets/           # логотипы, фон
│   ├── components/
│   │   ├── Auth/         # формы входа: AuthLayout, Field, RequireAuth, GuestOnly, иконки
│   │   ├── Layout/       # основной шаблон с боковой панелью
│   │   ├── Sidebar/      # меню, профиль, диалог выхода
│   │   └── icons/        # базовый Icon для всех SVG-иконок
│   ├── hooks/            # useTheme
│   ├── pages/            # страницы
│   ├── styles/           # tokens.css (цвета, размеры), base, layout, sidebar, auth, settings
│   ├── test/setup.ts     # настройка тестового окружения
│   ├── utils/            # token.ts (JWT в браузере), validation.ts (правила логина и пароля)
│   ├── App.tsx           # маршруты
│   └── main.tsx
├── nginx/nginx.conf      # конфиг nginx для Docker (HTTPS, прокси /api/, SPA)
├── Dockerfile
└── .env.example
```

## Запуск

```bash
cp .env.example .env     # Windows: copy .env.example .env
npm ci
npm run dev              # http://localhost:5173
```

Vite проксирует `/api` на `http://localhost:8000`, поэтому backend должен быть запущен
(см. [../backend/README.md](../backend/README.md)), а CORS настраивать не нужно.

## Команды

```bash
npm run dev            # сервер разработки
npm run build          # проверка типов (tsc) и production-сборка в dist/
npm run preview        # посмотреть собранную версию
npm run lint           # eslint
npm run format         # prettier: отформатировать все файлы
npm run format:check   # prettier: только проверить (его запускает CI)
npm test               # vitest, один прогон
npm run test:watch     # vitest в режиме слежения
```

Версия Node указана в `.nvmrc` (та же, что в Dockerfile и CI).

## Переменные окружения

| Переменная     | Описание                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------ |
| `VITE_API_URL` | адрес API. По умолчанию `/api/v1` (запросы идут на тот же домен). Задаётся на этапе сборки |