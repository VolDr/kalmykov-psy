# Instagram-автоответы

Автоматизация по ключевым словам через официальный **Instagram API with Instagram Login**
(Facebook-страница не нужна, достаточно профессионального аккаунта):

- публичный ответ на комментарий под постом/рилсом;
- сообщение в директ автору комментария (private reply);
- ответ на входящее сообщение в директе.

Правила настраиваются в админке: `/admin/bot/instagram`. На один комментарий/сообщение
срабатывает **первое** подходящее правило (по возрастанию id). Свои комментарии и
исходящие сообщения (echo) игнорируются, повторные доставки вебхука — тоже
(таблица `instagram_processed`).

## Лимиты Meta

- Private reply на комментарий: **одно сообщение на комментарий**, в течение 7 дней,
  до 750/час на аккаунт.
- Ответ в директе: в течение 24 часов после входящего сообщения (для автоответа на
  входящее — всегда ок).

## Настройка (один раз)

1. **Аккаунт**: Instagram переводится в профессиональный (Business или Creator).
2. **Приложение Meta**: [developers.facebook.com](https://developers.facebook.com) →
   Create App → тип «Business» → добавить продукт **Instagram** → «API setup with
   Instagram login».
3. **Токен**: в разделе Instagram → API setup сгенерировать долгоживущий access token
   для своего аккаунта (кнопка Generate token после привязки аккаунта). Токен живёт
   60 дней и продлевается запросом `GET /refresh_access_token` — пока продлеваем руками
   раз в ~месяц.
4. **Разрешения**: `instagram_business_basic`, `instagram_business_manage_messages`,
   `instagram_business_manage_comments`. Пока приложение в **Development mode** и
   аккаунт добавлен в тестеры/роли приложения — App Review не нужен.
5. **Вебхук**: в приложении → Webhooks → Instagram:
   - Callback URL: `https://kalmykov-psy.ru/api/instagram/webhook`
   - Verify token: значение `INSTAGRAM_VERIFY_TOKEN` из `.env`
   - Подписаться на поля **`comments`** и **`messages`**.
6. **Env** (`.env` на проде, затем перезапуск):

   ```
   INSTAGRAM_ACCESS_TOKEN=<долгоживущий токен из шага 3>
   INSTAGRAM_VERIFY_TOKEN=<случайная строка, та же что в шаге 5>
   INSTAGRAM_APP_SECRET=<App Secret из Settings → Basic>
   INSTAGRAM_PROXY=socks5://127.0.0.1:1080
   ```

   `INSTAGRAM_PROXY` — тот же SOCKS5, что для Telegram Bot API: graph.instagram.com
   с хостинга напрямую недоступен. Без `INSTAGRAM_ACCESS_TOKEN` интеграция полностью
   выключена (вебхук отвечает 200 и ничего не делает).

## Как это работает в коде

- `src/routes/api/instagram/webhook/+server.ts` — GET-верификация подписки и приём
  событий (подпись `X-Hub-Signature-256` проверяется, если задан `INSTAGRAM_APP_SECRET`).
- `src/lib/server/instagram.server.ts` — матчинг правил и вызовы Graph API
  (`/{comment_id}/replies`, `/me/messages`).
- Таблицы: `instagram_rules` (правила, счётчик срабатываний) и `instagram_processed`
  (идемпотентность). Миграция `drizzle/0008_instagram_rules.sql` — применяется
  вручную через psql, как остальные.

## TikTok

Публичного API для ответов на комментарии и директ у TikTok нет (только партнёрская
программа Messaging Partners для платформ уровня Sprinklr). Единственное «лёгкое» —
нативное приветственное сообщение: приложение TikTok → бизнес-аккаунт →
Business Suite → Auto messages.
