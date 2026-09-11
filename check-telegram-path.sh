#!/usr/bin/env bash
# Замер пути Telegram <-> сервер по участкам.
# Запускать на основном сервере (там, где .env и приложение):
#   bash check-telegram-path.sh
set -uo pipefail

cd "$(dirname "$0")"
if [ -f .env ]; then set -a; . ./.env; set +a; else echo "!! .env не найден в $(pwd)"; exit 1; fi

TOKEN="${TELEGRAM_CLIENT_BOT_TOKEN:-}"
[ -z "$TOKEN" ] && { echo "!! TELEGRAM_CLIENT_BOT_TOKEN пуст"; exit 1; }

API="https://api.telegram.org/bot$TOKEN/getMe"
PROXY_URL="https://bot-proxy.kalmykov-psy.ru:8443/api/telegram/webhook"
LOCAL_URL="http://127.0.0.1:3000/api/telegram/webhook"
FMT='  код=%{http_code}  dns=%{time_namelookup}s  connect=%{time_connect}s  tls=%{time_appconnect}s  ИТОГО=%{time_total}s\n'
N=3

hr() { printf '\n=== %s\n' "$1"; }

hr "1. ИСХОДЯЩИЙ: сервер -> api.telegram.org  (главный замер)"
echo "-- напрямую, без туннеля:"
for _ in $(seq $N); do curl -s -o /dev/null -w "$FMT" --max-time 20 "$API" || echo "  недоступно"; done
echo "-- через xray (socks5 127.0.0.1:1080):"
for _ in $(seq $N); do curl -s -o /dev/null -w "$FMT" --max-time 20 --socks5-hostname 127.0.0.1:1080 "$API" || echo "  недоступно"; done
echo "-- через xray, одно соединение на 3 запроса (так ходит приложение с keepAlive):"
curl -s --max-time 20 --socks5-hostname 127.0.0.1:1080 -w "$FMT" \
  -o /dev/null "$API" -o /dev/null "$API" -o /dev/null "$API" || echo "  недоступно"
echo "   Первый запрос холодный, у следующих connect/tls ~0 — это цена вызова"
echo "   из тёплого пула. Цепочка делает 2-3 вызова подряд."

hr "2. ВХОДЯЩИЙ: через прокси против прямого в приложение  (ожидается код 401)"
echo "-- через bot-proxy:8443:"
for _ in $(seq $N); do curl -sk -o /dev/null -w "$FMT" --max-time 20 -X POST "$PROXY_URL" || echo "  недоступно"; done
echo "-- напрямую в приложение (127.0.0.1:3000):"
for _ in $(seq $N); do curl -s -o /dev/null -w "$FMT" --max-time 20 -X POST "$LOCAL_URL" || echo "  недоступно"; done
echo "   Разница между блоками = накладные расходы прокси-плеча."

hr "3. СВЯЗНОСТЬ"
echo "-- ping api.telegram.org (ICMP часто режется, это не ошибка):"
ping -c3 -W2 api.telegram.org 2>&1 | tail -2 || true
echo "-- ping прокси 185.121.12.136:"
ping -c3 -W2 185.121.12.136 2>&1 | tail -2 || true
echo "-- xray слушает 1080:"
ss -tlnp 2>/dev/null | grep -q ':1080' && echo "  да" || echo "  НЕТ — туннель не поднят"
echo "-- доступность прокси по IPv4 и IPv6:"
curl -4 -sk -o /dev/null -w "  v4: код=%{http_code} %{time_total}s\n" --max-time 8 "$PROXY_URL" || echo "  v4: недоступно"
curl -6 -sk -o /dev/null -w "  v6: код=%{http_code} %{time_total}s\n" --max-time 8 "$PROXY_URL" || echo "  v6: недоступно"

hr "4. СОСТОЯНИЕ ВЕБХУКА У TELEGRAM"
curl -s --max-time 20 --socks5-hostname 127.0.0.1:1080 "https://api.telegram.org/bot$TOKEN/getWebhookInfo" \
  | python3 -c "import sys,json;r=json.load(sys.stdin).get('result',{});[print(f'  {k}: {r.get(k)}') for k in ('url','pending_update_count','last_error_date','last_error_message')]" 2>/dev/null \
  || echo "  не удалось получить"

hr "5. РЕАЛЬНАЯ СКОРОСТЬ ОБРАБОТКИ (последние 10 живых /start)"
if [ -n "${DATABASE_URL:-}" ]; then
  psql "${DATABASE_URL%%\?*}" -c "SELECT id, source_key, bot_started_at, round(extract(epoch from gate_shown_at - bot_started_at)::numeric,1) AS сек_до_шлагбаума FROM bot_contacts WHERE gate_shown_at IS NOT NULL ORDER BY bot_started_at DESC LIMIT 10" 2>&1 | sed 's/^/  /'
else
  echo "  DATABASE_URL пуст — пропускаю"
fi

printf '\n=== готово\n'
