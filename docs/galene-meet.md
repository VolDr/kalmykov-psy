# Galene + Svelte client (/meet)

UI: `src/routes/meet/+page.svelte`. Protocol is upstream Galene's MIT-licensed `static/protocol.js`, copied to `src/lib/galene/protocol.js` with one ES module export.

## Status

Frontend implementation is committed, **not yet validated end-to-end**. A running Galene backend, HTTPS, proper ICE/firewall access and a two-browser test are required before real consultations.

## Architecture

- `https://kalmykov-psy.ru/meet?room=consultation-01`: SvelteKit UI.
- `https://meet.kalmykov-psy.ru`: Galene HTTP/WebSocket endpoint via nginx.
- SvelteKit public environment variable: `PUBLIC_GALENE_ORIGIN=https://meet.kalmykov-psy.ru` (default is already this origin).
- Galene `data/config.json` must allow SvelteKit origins, e.g.:

```json
{
  "proxyURL": "https://meet.kalmykov-psy.ru/",
  "allowOrigin": [
    "https://kalmykov-psy.ru",
    "https://www.kalmykov-psy.ru"
  ]
}
```

## Build Galene outside the VPS

In PowerShell, with Go + Git installed and an amd64 Linux VPS:

```powershell
git clone https://github.com/jech/galene.git
cd galene
$env:GOOS="linux"
$env:GOARCH="amd64"
$env:CGO_ENABLED="0"
go build -ldflags="-s -w" -o galene .
scp .\galene root@YOUR_RU_VPS:/tmp/galene
scp -r .\static root@YOUR_RU_VPS:/tmp/galene-static
```

**The static directory is needed**, even though this Svelte client is separate, since Galene serves its standard UI and assets too. Verify `uname -m` before selecting GOARCH. Uploading the binary does not install Go on the VPS.

## Install and run on Russian Ubuntu VPS

Review all commands, back up existing nginx configuration, do not interfere with the PM2 website:

```bash
id galene >/dev/null 2>&1 || useradd --system --home /opt/galene --shell /usr/sbin/nologin galene
install -d -o galene -g galene /opt/galene/{data,groups}
install -m 755 /tmp/galene /opt/galene/galene
cp -a /tmp/galene-static /opt/galene/static
chown -R galene:galene /opt/galene
```

Set `/opt/galene/data/config.json` as above. Create a named group JSON in `/opt/galene/groups/` with `max-clients: 2`, `public:false` and unique hashed passwords, ideally with `galenectl`. Do **not** create an open anonymous wildcard room for consultations. The Galene administrative utility is preferred for generating hashes and managing users. Restrict private configuration files' permissions.

Sample systemd unit at `/etc/systemd/system/galene.service`:

```ini
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

[Install]
WantedBy=multi-user.target
```

Check Galene's exact CLI options with `/opt/galene/galene -help` before enabling. `-udp-range` with a single multiplexed media port should still be tested under real network conditions.

For `meet.kalmykov-psy.ru`, create A DNS record pointing at Russian VPS, then use an nginx HTTPS server with a valid certificate. Example location blocks *inside that server*:

```nginx
location / {
    proxy_pass http://127.0.0.1:8443;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
location /ws {
    proxy_pass http://127.0.0.1:8443/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
}
```

Open TCP/UDP 1194 and the relevant UDP media range in the VPS provider firewall as well as local firewall. Ports 443 for nginx and media ports must be reachable externally; no need to expose localhost 8443.

## Test checklist

1. `curl -I https://meet.kalmykov-psy.ru/group/consultation-01/.status` (test HTTP result; a GET returns JSON).
2. Confirm `Access-Control-Allow-Origin` for the actual Svelte origin and WebSocket handshake.
3. From two **different devices/networks**, open `https://kalmykov-psy.ru/meet?room=consultation-01`, enter configured credentials and test both directions of audio/video.
4. Test screen sharing, chat, joining/leaving, mobile browser, interrupted connectivity.
5. Monitor CPU, RAM, network, and the site during 50+ minutes. Do not use for confidential consultations before the privacy, access control and reliability review.

Galene docs: https://galene.org/galene-install.html and https://galene.org/galene-client.html
