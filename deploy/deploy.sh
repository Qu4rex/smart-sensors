# Деплой на сервере. Запускается из GitHub Actions по SSH после копирования файлов,
# но можно запускать и вручную: bash deploy/deploy.sh
#
# Что делает:
#   1. проверяет, что на сервере есть настройки и сертификаты;
#   2. делает резервную копию БД;
#   3. пересобирает и перезапускает контейнеры;
#   4. ждёт, пока сервисы станут здоровыми, и проверяет сайт по HTTPS.
# Если что-то пошло не так, завершается с ошибкой (деплой в GitHub станет красным).
#
# Переменные: SKIP_BACKUP=1 пропустить бэкап БД; KEEP_BACKUPS=10 сколько копий хранить.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

KEEP_BACKUPS="${KEEP_BACKUPS:-10}"

log() { printf '\n==> %s\n' "$*"; }
fail() { printf '\nОШИБКА: %s\n' "$*" >&2; exit 1; }

show_diagnostics() {
  printf '\n--- docker compose ps ---\n'
  docker compose ps || true
  printf '\n--- логи (последние 60 строк) ---\n'
  docker compose logs --tail=60 || true
}

# --- 1. Проверки ----------------------------------------------------------------
log "Проверяю окружение"

command -v docker >/dev/null || fail "Docker не установлен"
docker compose version >/dev/null 2>&1 || fail "Нет плагина docker compose"

[ -f backend/.env ] || fail "Нет backend/.env. Создайте его по инструкции docs/deploy.md"

# Значения из .env.example нельзя использовать на боевом сервере.
if grep -qE '^(POSTGRES_PASSWORD|JWT_SECRET)=.*change_me' backend/.env; then
  fail "В backend/.env остались значения change_me. Сгенерируйте секреты (docs/deploy.md)"
fi
if grep -qE '^DEBUG=true' backend/.env; then
  fail "В backend/.env включён DEBUG=true. На сервере должно быть DEBUG=false"
fi

for cert in fullchain.pem privkey.pem; do
  [ -f "frontend/nginx/ssl/$cert" ] || fail "Нет frontend/nginx/ssl/$cert. Выпустите сертификат (docs/ssl.md)"
done

# На сервере не должно быть dev-файла: он открывает порты базы и backend наружу.
[ ! -f docker-compose.override.yml ] || fail "Найден docker-compose.override.yml. Удалите его на сервере"

# --- 2. Бэкап БД ------------------------------------------------------------------
if [ "${SKIP_BACKUP:-0}" = "1" ]; then
  log "Бэкап пропущен (SKIP_BACKUP=1)"
elif running_services="$(docker compose ps --status running --services 2>/dev/null || true)" \
  && grep -qx postgres <<<"$running_services"; then
  log "Резервная копия БД"
  mkdir -p backups
  backup="backups/pre-deploy-$(date +%Y-%m-%d-%H%M%S).sql.gz"
  docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$backup"
  echo "Сохранено: $backup"
  # Оставляем только свежие копии
  # shellcheck disable=SC2012  # имена файлов задаём мы сами, спецсимволов в них нет
  ls -1t backups/pre-deploy-*.sql.gz | tail -n +"$((KEEP_BACKUPS + 1))" | xargs -r rm --
else
  log "База ещё не запущена (первый деплой), бэкап не нужен"
fi

# --- 3. Сборка и запуск -------------------------------------------------------------
log "Собираю и запускаю контейнеры"
if ! docker compose up -d --build --remove-orphans --wait --wait-timeout 240; then
  show_diagnostics
  fail "Контейнеры не запустились или не стали healthy"
fi

# --- 4. Проверка сайта -----------------------------------------------------------
log "Проверяю сайт по HTTPS"
healthy=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  # -k: сертификат выписан на домен, а мы стучимся на 127.0.0.1
  if curl -fsk --max-time 5 https://127.0.0.1/api/v1/health >/dev/null \
    && curl -fsk --max-time 5 https://127.0.0.1/ >/dev/null; then
    healthy=1
    break
  fi
  echo "Попытка $attempt: сайт пока не отвечает, жду 3 с..."
  sleep 3
done

if [ "$healthy" -ne 1 ]; then
  show_diagnostics
  fail "Сайт не отвечает по https://127.0.0.1/ (frontend и /api/v1/health)"
fi

# --- 5. Уборка -------------------------------------------------------------------
log "Удаляю старые образы"
docker image prune -f >/dev/null

log "Готово"
docker compose ps