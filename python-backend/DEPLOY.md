# Deploy BelieVoo GHC Python Backend to ghc.believoo.com

> **Status**: Already deployed. The backend is live at `https://ghc.believoo.com` and `ghc.believoo.com/api` is proxied to the Python backend on port 8000.

## 1. Configure OVH credentials

Edit `/www/wwwroot/ghc/python-backend/.env`:

```env
SECRET_KEY=change-this-to-a-random-32-char-string
OVH_ENDPOINT=ovh-ca
OVH_APPLICATION_KEY=your_app_key
OVH_APPLICATION_SECRET=your_app_secret
OVH_CONSUMER_KEY=your_consumer_key
OVH_SUBSIDIARY=CA
```

Get keys from https://ca.api.ovh.com/createApp/ (or eu/us).

Then restart the service:

```bash
sudo systemctl restart believoo-ghc
```

## 2. Seed database

```bash
cd /www/wwwroot/ghc/python-backend
python3 seed.py
```

## 3. Production: systemd service

The service is already installed and enabled:

```bash
sudo systemctl status believoo-ghc
```

To reinstall:

```bash
sudo cp /www/wwwroot/ghc/python-backend/systemd/believoo-ghc.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable believoo-ghc
sudo systemctl start believoo-ghc
```

## 4. Nginx reverse proxy

Already configured in `/www/server/panel/vhost/nginx/ghc.believoo.com.conf`:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    ...
}
```

Reload if needed:

```bash
sudo /www/server/nginx/sbin/nginx -s reload
```

## 5. Cloudflare

If using Cloudflare:
- Set SSL/TLS mode to **Full (strict)** if you have a valid origin cert
- Turn off caching for `/api/*` (create a Page Rule: `ghc.believoo.com/api/*` → Cache Level: Bypass)

## 6. Test

```bash
curl https://ghc.believoo.com/health
curl https://ghc.believoo.com/api/server/plans?category=VPS
```

## 7. Sync OVH plans

Login as admin at `https://ghc.believoo.com/admin` and click **Sync OVH Plans**, or call:

```bash
curl -X POST https://ghc.believoo.com/api/admin/sync-ovh-plans \
  -H "Authorization: Bearer <admin-token>"
```

## 8. Important: Change default admin password

Default admin: `admin@believoo.com` / `admin123`. Change immediately via admin panel or database.
