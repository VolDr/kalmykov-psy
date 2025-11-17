# Canvas Multiplayer Deployment Guide

This document contains all information needed to deploy the canvas multiplayer feature.

## Architecture Overview

```
Client Browser
    |
    ├── HTTPS (port 443) ───► Nginx ───► SvelteKit (port 3000)
    |
    └── WSS (port 443/ws) ──► Nginx ───► WebSocket Server (port 3001)
```

## Environment Variables

### Required `.env` additions:

```bash
# WebSocket server port (default: 3001)
WS_PORT=3001
```

### Optional SvelteKit public env:

```bash
# Public WebSocket URL (auto-detected if not set)
# PUBLIC_WS_URL=/ws
```

## Nginx Configuration

Add this to your existing nginx config (where you proxy to SvelteKit):

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates (already configured)
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Existing SvelteKit proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # NEW: WebSocket proxy for multiplayer
    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Long-lived connection timeouts
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

After editing, reload nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Database Migration

Canvas scenes table is defined in `src/db/schema.ts`:

```typescript
export const scenes = pgTable('scenes', {
	id: uuid().primaryKey().notNull(),
	data: jsonb().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull()
});
```

### Drizzle Migration Workflow

1. **Generate migration** (if schema changed):

```bash
npx drizzle-kit generate
```

2. **Apply migration**:

```bash
# Preview changes
npx drizzle-kit push --dry-run

# Apply to database
npx drizzle-kit push
```

Or if using migration files:

```bash
npx drizzle-kit migrate
```

3. **Verify table**:

```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_name = 'scenes'
);
```

### Manual SQL (if needed)

If migration doesn't work, apply directly:

```sql
-- From drizzle/0001_scenes_table.sql
CREATE TABLE IF NOT EXISTS scenes (
  id uuid PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scenes_updated_at ON scenes (updated_at DESC);
```

## Running Services

### Development

Open two terminals:

```bash
# Terminal 1: SvelteKit dev server
npm run dev

# Terminal 2: WebSocket server with hot reload
npm run ws:server:dev
```

### Production with PM2

1. Build the application:

```bash
npm run build
```

2. Start both services with PM2:

```bash
pm2 start ecosystem.config.cjs
```

This starts:

- `kalmykov-psy-web` (SvelteKit) on port 3000
- `kalmykov-psy-ws` (WebSocket) on port 3001

3. Save PM2 process list:

```bash
pm2 save
```

4. Setup PM2 startup (run on server reboot):

```bash
pm2 startup
# Follow the instructions it prints
```

### PM2 Monitoring

```bash
# Check status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit

# Restart services
pm2 restart all

# Stop services
pm2 stop all
```

## SSL/WSS Notes

- **No additional certificates needed** - nginx terminates SSL
- Client connects to `wss://yourdomain.com/ws`
- Nginx decrypts and forwards plain `ws://` to port 3001
- All WebSocket traffic is encrypted in transit

## Usage in Code

### Basic (single-player):

```svelte
<Canvas />
```

### Multiplayer enabled:

```svelte
<Canvas
	multiplayer={true}
	wsUrl="wss://yourdomain.com/ws"
	sceneId="scene-uuid-here"
	userName="Alice"
/>
```

### Auto-detect URL (recommended):

```typescript
onMount(() => {
	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	wsUrl = `${protocol}//${window.location.host}/ws`;
});
```

## Features

- **Real-time cursor tracking**: See other users' cursors with names
- **Live shape updates**: Add, move, delete shapes synchronized instantly
- **Connection status**: Visual indicator (green/yellow/red/gray)
- **Offline queue**: Operations queued when disconnected, sent on reconnect
- **Automatic reconnection**: Exponential backoff (1s, 2s, 4s, 8s, 16s)
- **Presence debouncing**: Cursor updates batched to reduce traffic (50ms)

## Security Considerations

- Rate limiting: 100 requests/minute per IP (configurable)
- CSRF protection: Origin header validation
- UUID validation: Scene IDs must be valid UUIDs
- Input validation: Zod schemas validate all incoming data
- No auth yet: Uncomment auth checks in `+server.ts` when ready

## Scaling Considerations

For high-traffic deployments:

1. Replace in-memory rate limiter with Redis
2. Use Redis for WebSocket pub/sub (multiple WS server instances)
3. Add authentication/authorization
4. Consider message size limits
5. Implement operation conflict resolution (CRDT or OT)

## Troubleshooting

### WebSocket connection fails

- Check nginx config: `nginx -t`
- Verify WS server running: `pm2 status`
- Check browser console for errors
- Test direct connection: `wscat -c ws://localhost:3001`

### Operations not syncing

- Check browser Network tab for WebSocket messages
- Verify scene IDs match between clients
- Check WS server logs: `pm2 logs kalmykov-psy-ws`

### Cursor lag

- Normal: 50ms debounce + network latency
- Adjust `presenceDebounceMs` in SyncClient options

## Files Reference

- `server/websocket.ts` - Standalone WebSocket server
- `ecosystem.config.cjs` - PM2 configuration
- `src/lib/canvas/sync/client.ts` - Client-side WebSocket logic
- `src/lib/canvas/sync/server.ts` - Server-side room management
- `src/lib/canvas/sync/types.ts` - Message protocols
- `src/lib/canvas/ui/Canvas.svelte` - Main canvas with multiplayer UI
- `src/routes/canvas/+page.svelte` - Demo page with multiplayer toggle

## Quick Start Checklist

- [ ] Add nginx `/ws` location block
- [ ] Reload nginx: `sudo systemctl reload nginx`
- [ ] Verify scenes table exists in PostgreSQL
- [ ] Build app: `npm run build`
- [ ] Start with PM2: `pm2 start ecosystem.config.cjs`
- [ ] Save PM2: `pm2 save`
- [ ] Setup PM2 startup: `pm2 startup`
- [ ] Test multiplayer on `/canvas` page
