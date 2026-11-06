# Видеовстречи Galene — `kalmykov-psy`

## Архитектура

- Админка сайта: `/admin/meetings`. Создание, просмотр списка, удаление комнат, смена паролей.
- Видеоклиент: `/meet?room=meet-<id>`, пароль вводится отдельно.
- Galene: отдельный Go-бинарник на том же российском VPS, за nginx `https://meet.kalmykov-psy.ru`.
- Только сервер SvelteKit обращается к Galene Admin API по `http://127.0.0.1:8443/galene-api/v0/`.
- Браузер никогда не получает административные учетные данные. Публичный nginx должен блокировать `/galene-api/`.

**Не нужно создавать комнаты вручную в JSON!** Галене должен быть запущен и иметь `writableGroups: true`; комнаты создаются в админке.

## 1. Установка бинарника и статических файлов

Бинарник `/opt/galene/galene` уже скопирован на `box-758667`. Проверка: `/opt/galene/galene -help`. Go на VPS не нужен.

Если `/opt/galene/static` еще отсутствует, можно получить только статические файлы без сборки:

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/jech/galene.git /tmp/galene-source
git -C /tmp/galene-source sparse-checkout set static
mkdir -p /opt/galene/static
cp -a /tmp/galene-source/static/. /opt/galene/static/
```

## 2. Администратор Galene и запись комнат

Перед изменением существующей конфигурации сохраните резервную копию `/opt/galene/data/config.json`, если она уже есть.

Создайте локального пользователя процесса и каталоги:

```bash
id galene >/dev/null 2>&1 || useradd --system --home /opt/galene --shell /usr/sbin/nologin galene
mkdir -p /opt/galene/{data,groups,static}
```

Выполните Python-скрипт на VPS (пароль запрашивается интерактивно и **не попадает в историю команд**):

```bash
python3 - <<'PY'
from pathlib import Path
import getpass, hashlib, json, secrets, os
path = Path('/opt/galene/data/config.json')
cfg = json.loads(path.read_text()) if path.exists() else {}
password = getpass.getpass('Служебный пароль Galene Admin API: ')
if len(password) < 24:
    raise SystemExit('Нужен надежный пароль не короче 24 символов')
salt = secrets.token_bytes(16)
key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 200000)
users = cfg.get('users', {})
users['site-api'] = {
    'password': {
        'type': 'pbkdf2', 'hash': 'sha-256', 'key': key.hex(),
        'salt': salt.hex(), 'iterations': 200000
    },
    'permissions': 'admin'
}
cfg['users'] = users
cfg['writableGroups'] = True
cfg['proxyURL'] = 'https://meet.kalmykov-psy.ru/'
cfg['allowOrigin'] = ['https://kalmykov-psy.ru', 'https://www.kalmykov-psy.ru']
path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2))
os.chmod(path, 0o600)
print('Логин для сайта: site-api. Сохраните пароль в защищенном хранилище.')
PY
chown -R galene:galene /opt/galene
```

На SvelteKit-сервере в закрытой конфигурации PM2/окружении приложения, **не в Git**, задайте:

```dotenv
GALENE_ADMIN_URL=http://127.0.0.1:8443/
GALENE_ADMIN_USER=site-api
GALENE_ADMIN_PASSWORD=<тот_же_секрет_из_шага_2>
PUBLIC_GALENE_ORIGIN=https://meet.kalmykov-psy.ru
```

Не записывайте пароль в исходники, публичные конфиги, логи или в оболочку через `export ...` (команда может сохраниться в истории). Обновите окружение PM2 при следующем деплое через существующий механизм конфигурации сайта.

## 3. systemd

```ini
# /etc/systemd/system/galene.service
[Unit]
Description=Galene video conferencing
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=galene
Group=galene
WorkingDirectory=/opt/galene
ExecStart=/opt/galene/galene -insecure -http 127.0.0.1:8443 -turn :1194 -udp-range 50000
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now galene
systemctl status galene --no-pager
curl --max-time 5 http://127.0.0.1:8443/galene-api/v0/.groups/
```

Без Basic-авторизации последний запрос должен получить 401/403 (а не список комнат); если ответ 200 — проверьте защиту API.

## 4. nginx / HTTPS

Создайте отдельный `server` для `meet.kalmykov-psy.ru` с валидным Let's Encrypt сертификатом. Не меняйте конфигурацию основного сайта. После установки DNS и сертификата добавьте в HTTPS-блок:

```nginx
location ^~ /galene-api/ { return 404; }

location / {
    proxy_pass http://127.0.0.1:8443;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}
```

Затем `nginx -t` и только при успешной проверке `systemctl reload nginx`.
Разрешите в файрволе и на стороне провайдера TCP 443, TCP/UDP 1194 (TURN) и UDP 50000 (медиа). Реальные маршруты/порты нужно проверить при двухстороннем звонке.

## 5. Управление комнатами

Откройте `/admin/meetings`. Действия из существующей авторизованной админки:

- Создать приватную комнату с лимитом участников 2–12.
- При создании один раз увидеть случайные пароли ведущего `host` и гостя.
- Скопировать ссылку ведущего и гостевую ссылку. Пароль отдельно, без передачи в URL.
- Изменить пароль ведущего/гостя (предыдущий перестает действовать).
- Удалить комнату с подтверждением.

Группа Galene создается через официальный management API; пароли хешируются **самим Galene**. Эта реализация не хранит открытые пароли в базе.

**Текущий статус:** код интеграции есть в `wip-2`, но реальная работа на VPS, HTTPS, браузерные звонки и тесты не подтверждены. Не используйте для конфиденциальных консультаций до проверки.

Документация Galene: https://galene.org/galene-api.html, https://galene.org/galene.html
