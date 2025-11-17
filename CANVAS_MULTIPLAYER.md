# Canvas Multiplayer - Локальный запуск

## Обзор

Canvas поддерживает режим multiplayer (совместное редактирование в реальном времени) через WebSocket.

## Быстрый старт

### 1. Запуск WebSocket сервера

```bash
# Запуск сервера (по умолчанию на порту 3001)
npm run ws:server

# Или с автоперезагрузкой при изменениях
npm run ws:server:dev

# С кастомным портом
WS_PORT=4000 npm run ws:server
```

### 2. Запуск приложения

В отдельном терминале:

```bash
npm run dev
```

### 3. Использование multiplayer canvas

#### В демо режиме (/canvas)

```typescript
// Откройте /canvas?multiplayer=true
// Или используйте компонент с пропсами:

<Canvas
  multiplayer={true}
  wsUrl="ws://localhost:3001"
  sceneId="demo-scene-1"
  userId="user-123"
  userName="Иван"
/>
```

#### В admin панели (/admin/canvas?id=clientId)

Multiplayer автоматически активируется при включении переключателя "Поделиться" в меню canvas.

## Архитектура

### WebSocket сервер (`server/websocket.ts`)

- Порт по умолчанию: **3001**
- Поддерживает множественные комнаты (scenes)
- Отслеживает присутствие пользователей (presence)
- Синхронизирует операции между клиентами

### Клиентская часть (`src/lib/canvas/sync/`)

- **client.ts** - WebSocket клиент
- **types.ts** - типы для операций и presence
- **server.ts** - серверная логика синхронизации

## Функциональность

### Синхронизируемые операции

- ✅ Добавление фигур
- ✅ Обновление фигур (перемещение, трансформация)
- ✅ Удаление фигур
- ✅ Группировка/разгруппировка
- ✅ Изменение слоев (z-index)
- ✅ Изменение свойств (цвет, обводка, заливка)

### Присутствие пользователей (Presence)

- Курсор в реальном времени
- Выделенные элементы других пользователей
- Имена пользователей
- Статус подключения

### Индикатор статуса

В правом верхнем углу отображается статус подключения:

- 🟢 **Online** - подключен
- 🟡 **Connecting...** - подключение
- 🔴 **Reconnecting...** - переподключение
- ⚪ **Offline** - отключен

## Конфигурация

### Переменные окружения

```bash
# .env
WS_PORT=3001  # Порт WebSocket сервера
```

### Параметры сервера

```typescript
// server/websocket.ts
const syncServer = createSyncServer({
  maxOperationsPerRoom: 100,     // Макс операций в истории комнаты
  presenceTimeoutMs: 30000       // Таймаут неактивности (30 сек)
});
```

## Тестирование

### 1. Откройте два браузера

```bash
# Браузер 1
http://localhost:5173/canvas?multiplayer=true&sceneId=test

# Браузер 2 (в приватном режиме или другой браузер)
http://localhost:5173/canvas?multiplayer=true&sceneId=test
```

### 2. Проверьте функциональность

- Создайте фигуру в одном окне - она должна появиться в другом
- Переместите фигуру - изменения синхронизируются
- Наблюдайте за курсорами других пользователей

## Production deployment

### Docker

```dockerfile
# Dockerfile.websocket
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .

EXPOSE 3001
CMD ["npm", "run", "ws:server"]
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  websocket:
    build:
      context: .
      dockerfile: Dockerfile.websocket
    ports:
      - "3001:3001"
    environment:
      - WS_PORT=3001
    restart: unless-stopped
```

### Systemd service

```ini
# /etc/systemd/system/canvas-ws.service
[Unit]
Description=Canvas WebSocket Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/kalmykov-psy
ExecStart=/usr/bin/npm run ws:server
Restart=on-failure
Environment=WS_PORT=3001

[Install]
WantedBy=multi-user.target
```

## Troubleshooting

### "Connection failed" в браузере

1. Проверьте, запущен ли WebSocket сервер:
   ```bash
   lsof -i :3001
   ```

2. Проверьте URL в консоли браузера

3. Проверьте CORS (если используете разные домены)

### "Active rooms: 0" в логах сервера

- Клиенты не подключены или не отправили sceneId
- Проверьте параметры multiplayer в Canvas компоненте

### Высокая задержка синхронизации

- Проверьте сетевое подключение
- Уменьшите `maxOperationsPerRoom` для меньшего payload
- Используйте локальный WebSocket сервер для разработки

## Безопасность

⚠️ **Важно для production:**

1. **Аутентификация** - добавьте проверку токенов при подключении
2. **Авторизация** - проверяйте права доступа к сценам
3. **Rate limiting** - ограничьте количество операций в секунду
4. **Валидация** - проверяйте все входящие операции
5. **HTTPS/WSS** - используйте защищенное соединение

## Мониторинг

Сервер логирует:
- Подключения/отключения клиентов
- Количество активных комнат (каждую минуту)
- Ошибки обработки сообщений

Для production рекомендуется настроить:
- Prometheus metrics
- Централизованное логирование
- Health checks

## Дополнительные ресурсы

- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [ws library documentation](https://github.com/websockets/ws)
- [Canvas документация](./CLAUDE.md)
