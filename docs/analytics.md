# Аналитика и отслеживание событий

Справочник по тому, как на проекте устроена аналитика. Две независимые системы:

1. **Яндекс.Метрика** — внешний веб-аналитический сервис (счётчик, цели, вебвизор).
2. **Собственное отслеживание** — события пишутся в свою БД (PostgreSQL) + проброс в воронку SaleBot.

---

## 1. Яндекс.Метрика

**Counter ID: `105424317`** (захардкожен в нескольких местах).

### Инициализация
Скрипт счётчика вставлен инлайном в `<svelte:head>` в [src/routes/+layout.svelte](../src/routes/+layout.svelte) (≈строки 82–119). Загружает `tag.js`, вызывает `ym(105424317, 'init', …)` с опциями:

| Опция | Значение | Что делает |
|---|---|---|
| `ssr` | `true` | поддержка серверного рендера |
| `webvisor` | `true` | запись сессий (вебвизор) |
| `clickmap` | `true` | карта кликов |
| `ecommerce` | `'dataLayer'` | электронная коммерция через `dataLayer` |
| `accurateTrackBounce` | `true` | точный показатель отказов |
| `trackLinks` | `true` | отслеживание внешних ссылок |

Есть `<noscript>` fallback с пиксельной картинкой `mc.yandex.ru/watch/105424317`.

### SPA-навигация
SvelteKit — это SPA, поэтому переходы между страницами не перезагружают документ. В `afterNavigate()` (там же, ≈строка 53) вручную вызывается:
```js
window.ym(105424317, 'hit', window.location.href);
```
Так Метрика получает просмотр на каждый клиентский переход.

---

## 2. Собственное отслеживание целей (`reachGoal`)

Центральная функция — [src/lib/metrika.ts](../src/lib/metrika.ts) → `reachGoal(goal, params?)`.

Каждый вызов делает **две вещи одновременно**:
1. Шлёт цель в Яндекс.Метрику: `window.ym(105424317, 'reachGoal', goal, params)`.
2. Шлёт POST на свой эндпоинт `/api/analytics` с телом `{ goal, sessionId, page, params }`.

Ключевые детали:
- `SESSION_ID` генерируется через `crypto.randomUUID()` и хранится в `sessionStorage` под ключом `sid` — один на вкладку.
- `page` = `window.location.pathname`.
- Ошибки сети глотаются молча (`.catch(() => {})`) — аналитика не должна ломать UX.
- Работает только в браузере (guard `if (!browser) return`).

### Серверный приём — `/api/analytics`
[src/routes/api/analytics/+server.ts](../src/routes/api/analytics/+server.ts): валидирует наличие `goal` и пишет строку в таблицу `analytics_events`. `params` сохраняется в JSONB только если это непустой объект.

### Таблица `analytics_events`
Определена в [src/db/schema.ts](../src/db/schema.ts) (≈строка 21):
```
id         bigserial PK
created_at timestamp default now()
goal       text NOT NULL
session_id text
page       text
params     jsonb
```

### Просмотр в админке
[src/routes/admin/analytics/+page.server.ts](../src/routes/admin/analytics/+page.server.ts) грузит три среза:
- `topGoals` — все цели с подсчётом, по убыванию.
- `recent` — последние 50 событий.
- `byDay` — события за 7 дней, сгруппированные по дню и цели (сырой SQL).

---

## 3. Скролл-цели (`useScrollGoals`)

[src/lib/useScrollGoals.ts](../src/lib/useScrollGoals.ts) → `initScrollGoals()`.

Декларативный механизм: в разметку ставятся маркеры
```html
<div data-scroll-goal="lead_scroll_50"></div>
```
`IntersectionObserver` (threshold 0.1) при первом появлении маркера вызывает `reachGoal(goal)`, дедуплицирует через `Set`, затем `unobserve`.

Вызывается в `onMount` на: [MainGridNew.svelte](../src/lib/components/layout/MainGridNew.svelte), и лид-магнит-страницах `useful/vacation-did-not-help`, `useful/organized-burnout`, `useful/focus-attention`.

---

## 4. Известные цели (`goal`)

Собраны из вызовов `reachGoal(...)` по проекту:

**Главная / лендинг (`MainGridNew.svelte`, `info/+page.svelte`):**
`hero_cta_click`, `mid_cta_click`, `pricing_single_click`, `pricing_package_click`, `pricing_intro_click`, `modal_intro_click`, `modal_closed_without_action` (params: `source`, `time_spent`).

**Лид-магниты (`useful/*`):**
`lead_cta_seen`, `lead_booking_click`, `modal_intro_click`, плюс скролл-цели через `data-scroll-goal`.

**Баннеры / реклама:**
`telegram_banner_click` ([TelegramBanner.svelte](../src/lib/components/TelegramBanner.svelte)), `ad_cta_click` (params: `ad` — `vacation` | `attention`) — единая цель для всех страниц `ads/*` ([ads/vacation](../src/routes/ads/vacation/+page.svelte), [ads/attention](../src/routes/ads/attention/+page.svelte)).

**Опросники (`QuestionnaireStep.svelte`):**
`questionnaire_email_submitted`, `questionnaire_progress_25/50/75`, `questionnaire_completed` (params: `result`, `questions_answered`, `email_provided`), `questionnaire_telegram_click`.

**Клип-статьи (`useful/[slug]`, `ClipQuiz.svelte`, см. [docs/clip-articles.md](clip-articles.md)):**
Имена целей общие для всех статей, конкретная статья различается по параметру `article` (= slug):
`clip_opened`, `clip_progress_25/50/75`, `clip_quiz_started`, `clip_quiz_completed` (params: `article`, `result`), `clip_bot_results_click` (params: `article`, `result`). Заводить в Метрике по одному разу — покрывают все будущие клип-статьи.

**Воронка записи (`booking/+page.svelte`, `booking/success`):**
`booking_date_selected`, `booking_hour_selected`, `booking_step2_reached`, `booking_payment_initiated` / `acquaintance_booking_initiated`, `acquaintance_booking_confirmed`, `booking_payment_success`.
Эти цели тоже идут через `reachGoal` (раньше билась только в Метрику локальным `trackGoal` — исправлено, теперь попадает и в свою БД).

**Разовая оплата (`single/+page.svelte`):**
`single_payment_initiated` (фиксируется в `pay()` перед редиректом на Робокассу), `single_payment_success`.

**Провал оплаты (`booking/fail`):**
`payment_failed`.

> ⚠️ **Общие страницы оплаты.** И запись (`/api/booking`), и прямая оплата (`/api/pay`, single/package) редиректят на одни и те же `/booking/success` и `/booking/fail` (см. `successUrl`/`failUrl` в [api/pay](../src/routes/api/pay/+server.ts)). Отдельного `/payment/*` роута нет — проверка `/payment/success` в layout мёртвая.
> На `/booking/success` цель различается по `bookedAt`: есть бронь → `booking_payment_success`, нет (прямая оплата) → `single_payment_success`. На `/booking/fail` цель одна общая — `payment_failed` (на этой странице нет данных, чтобы отличить поток).

> При добавлении новой цели держи имена в snake_case и осмысленными — отдельного реестра целей нет, источник истины = вызовы `reachGoal` в коде.

---

## 5. Воронка лид-магнитов → SaleBot

Отдельная серверная воронка для рекламных лид-магнитов. НЕ путать с `reachGoal` — здесь события привязаны к конкретному клиенту SaleBot и пробрасываются в чат-бот.

### Идентификация клиента: `/go/*` редиректы + cookie `sb_client_id`
Ссылки из рассылок SaleBot ведут на короткие редиректы [src/routes/go/](../src/routes/go/). Каждый ставит **HttpOnly** cookie `sb_client_id` (secure, sameSite=lax, 30 дней) и редиректит на нужную страницу:

| Путь | Редирект на |
|---|---|
| `/go/v/[clientId]` | `/useful/vacation-did-not-help` |
| `/go/v/a/[clientId]` | `/useful/vacation-did-not-help?to=acquaintance` |
| `/go/t/[clientId]` | `/useful/organized-burnout` |
| `/go/q/[clientId]` | `/useful/burnout-questionnaire` |
| `/go/q/a/[clientId]`, `/go/t/a/[clientId]` | (варианты `…/a/` — поток «знакомство») |

`clientId` валидируется (`Number.isSafeInteger && > 0`). Cookie **HttpOnly** — клиентский JS его не читает, только сервер.

### Клиентский трекинг чтения: `setupLeadMagnetTracking`
[src/lib/client/leadMagnetTracking.ts](../src/lib/client/leadMagnetTracking.ts). Запускается на лид-магнит-странице (только если есть `sbClientId`). Два события:
- **`opened`** — сразу при загрузке.
- **`read75`** — когда выполнены ОБА условия: проскроллено ≥ 75 % (`readThreshold`) И прошло ≥ 30 с (`minimumReadingTimeMs`).

Отправляет POST на `/api/lm-progress` с `{ leadMagnet, event, progress }`. `clientId` в тело НЕ кладётся — сервер читает его из cookie. Глубина скролла пересчитывается на scroll/resize и через `ResizeObserver` на body (ловит ленивую подгрузку картинок). In-memory флаги (`read75InFlight`, `read75Sent`) гасят дубли в рамках одной загрузки.

### Серверная обработка: `/api/lm-progress`
[src/routes/api/lm-progress/+server.ts](../src/routes/api/lm-progress/+server.ts):
1. Берёт `clientId` из cookie `sb_client_id`; нет валидного — тихо `{ ok, skipped }`.
2. Валидирует `leadMagnet` (whitelist `ALLOWED_LEAD_MAGNETS`: `['otpusk', 'focus', 'burnout']`) и `event` (`['opened','read75']`).
3. Атомарный upsert в `lead_magnet_events` с `onConflictDoUpdate` (no-op SET ради RETURNING). Если строка уже `sent` → дубль, выход.
4. Атомарный инкремент `attempts` с условием `status != 'sent'` — защита от гонок. 0 строк → конкурентный запрос уже обрабатывает.
5. Шлёт callback в SaleBot ([salebot.server.ts](../src/lib/server/salebot.server.ts) → `POST chatter.salebot.pro/api/<KEY>/callback`). Успех → `status='sent'`, `sent_at=NOW()`. Ошибка → `status='failed'`, `last_error`.

### Событие оплаты записи → SaleBot (`consultation_booked`)
Помимо лид-магнитов, в воронку SaleBot пробрасывается факт оплаты консультации. В [robokassa/result/+server.ts](../src/routes/api/payments/robokassa/result/+server.ts) при подтверждённой оплате, если у брони есть `sbClientId`, шлётся callback `{ message: 'consultation_booked', consultation_booked: 1 }`. `sbClientId` приходит из cookie `sb_client_id` в момент бронирования.

### Таблица `lead_magnet_events`
[src/db/schema.ts](../src/db/schema.ts) (≈строка 388):
```
id          bigserial PK
client_id   bigint NOT NULL          -- SaleBot client_id
lead_magnet text NOT NULL            -- напр. 'otpusk'
event_name  text NOT NULL            -- 'opened' | 'read75'
status      enum('pending','sent','failed') default 'pending'
attempts    integer default 0
last_error  text
created_at  timestamp default now()
sent_at     timestamp
UNIQUE (client_id, lead_magnet, event_name)   -- межсессионная дедупликация
```

### SaleBot payload (`buildPayload`)
Поля строятся **динамически из имени лид-магнита** — префикс `lm_<leadMagnet>`. Шаблон:
- `opened` → `{ client_id, message: 'lm_<lm>_opened', lm_<lm>_opened: 1, lm_<lm>_stage: 'opened' }`
- `read75` → `{ client_id, message: 'lm_<lm>_read75', lm_<lm>_read75: 1, lm_<lm>_stage: 'after_read', lm_<lm>_progress: 75 }`

Соответствие страниц и имён (каждое имя = отдельная воронка и отдельная дедупликация):

| Страница | `leadMagnet` | `/go/*` | Поля в SaleBot |
|---|---|---|---|
| `useful/vacation-did-not-help` | `otpusk` | `/go/v/`, `/go/v/a/` | `lm_otpusk_opened`, `lm_otpusk_read75`, `lm_otpusk_stage`, `lm_otpusk_progress` |
| `useful/organized-burnout` | `burnout` | `/go/t/` | `lm_burnout_opened`, `lm_burnout_read75`, `lm_burnout_stage`, `lm_burnout_progress` |
| `useful/focus-attention` | `focus` | — (через `?sb_client_id=`) | `lm_focus_opened`, `lm_focus_read75`, `lm_focus_stage`, `lm_focus_progress` |

> ⚠️ Для каждого имени в **SaleBot** должны быть заведены обработчики на `message` (`lm_<lm>_opened` / `lm_<lm>_read75`) и переменные `lm_<lm>_*`, иначе колбек уходит, но бот ничего не делает.

Ключ API: env-переменная `SALEBOT_API_KEY`.

---

## Шпаргалка: куда смотреть

| Хочу… | Файл |
|---|---|
| Изменить Метрику / counter ID | `src/routes/+layout.svelte` |
| Добавить клиентскую цель | вызвать `reachGoal()` из `src/lib/metrika.ts` |
| Добавить скролл-цель | поставить `data-scroll-goal="…"` в разметке |
| Посмотреть свои события | `/admin/analytics` |
| Схема таблиц | `src/db/schema.ts` (`analytics_events`, `lead_magnet_events`) |
| Воронка лид-магнитов | `src/lib/client/leadMagnetTracking.ts` + `src/routes/api/lm-progress/+server.ts` |
| Новый лид-магнит в воронке | добавить имя в `ALLOWED_LEAD_MAGNETS` + `setupLeadMagnetTracking({ leadMagnet })` на странице (+ опц. `/go/*` редирект). `buildPayload` править НЕ нужно — поля строятся из имени |
