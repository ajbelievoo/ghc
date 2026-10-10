# GHC Python Backend Notes

## Transactional Email

- SMTP configured in `.env` and `admin_configs` table: host `mail.believoo.com`, port `587`, user `noreply@believoo.com`, from `GHC - Go Host Cloud <noreply@believoo.com>`.
- `SMTP_VERIFY=true`: Postfix/Dovecot now serve a proper `mail.believoo.com` certificate. SNI is handled via `/etc/postfix/vmail_ssl.map` (base64-encoded combined chains) and Dovecot `local_name` SNI.
- Branded HTML template lives in `app/services/email_service.py` (dark navy header, GHC cyan #00f0ff accent, glowing logo at `https://ghc.believoo.com/images/ghc-email-logo.png`).
- Emails are sent for:
  - welcome (register)
  - email verification
  - password reset
  - team invite
  - wallet top-up
  - order payment received
  - service activated
  - order failed
  - renewal reminder (3 days before due)
  - service suspension (overdue)
- Email hooks:
  - `app/routers/auth.py`
  - `app/routers/team.py`
  - `app/services/payment_service.py`
  - `app/services/order_service.py`
  - `app/main.py` (`run_maintenance`)
- Service runs as `believoo-ghc.service` via uvicorn on `127.0.0.1:8000`.

## Database & Migrations

- SQLAlchemy is configured in `app/core/database.py`.
- `DATABASE_URL` in `.env` controls the database. For development the default is `sqlite:///./believoo_dev.db`.
- For production use PostgreSQL:
  - `DATABASE_URL=postgresql://ghc_user:ghc_password@localhost:5432/ghc_production`
  - Make sure `psycopg2-binary` is installed (`pip install -r requirements.txt`).
- Alembic is used for schema migrations.
  - Initialize / run: `python3 -m alembic upgrade head`
  - Generate a new migration: `python3 -m alembic revision --autogenerate -m "description"`
  - Baseline migration: `alembic/versions/2026_09_15_0642-1c5890ae1b59_baseline_schema.py`
- On startup:
  - SQLite: tables are auto-created and legacy column migrations are applied.
  - PostgreSQL: Alembic `upgrade head` runs automatically before the app serves requests.
- To migrate data from an existing SQLite database to PostgreSQL, see `scripts/migrate_sqlite_to_postgres.py`:
  ```bash
  export SQLITE_URL=sqlite:///./believoo_dev.db
  export POSTGRES_URL=postgresql://ghc_user:ghc_password@localhost:5432/ghc_production
  python3 scripts/migrate_sqlite_to_postgres.py
  ```
  After migration, set `DATABASE_URL` to the PostgreSQL URL and start the service.

## Health & Monitoring

- Health/readiness and Prometheus metrics are exposed via `app/routers/health.py`.
- Endpoints:
  - `GET /health` — returns `{"status":"ok","database":"ok","timestamp":"..."}`. Returns 500 if the DB is unreachable.
  - `GET /ready` — lightweight readiness probe.
  - `GET /metrics` — Prometheus exposition format.
- Request count and latency are tracked by the `metrics_middleware` in `app/main.py`.
- Additional counters available in `app/core/metrics.py` for payment webhooks, OVH API calls and orders.

## Security

- `SECRET_KEY` must be a long random string. The app will refuse to start with common placeholder values.
- `ADMIN_PASSWORD` must not be the default `admin123`. Set a strong password in `.env` before the first run.
- After schema changes, generate an Alembic migration and apply it before deploying.

## Operations

- Daily PostgreSQL backup: `/www/wwwroot/ops/backup-ghc.sh`.
- Ecosystem health monitoring: `/www/wwwroot/ops/health-check.sh` (checks `https://ghc.believoo.com/api/health`).
- Cron config: `/etc/cron.d/believoo-ecosystem`.

## Auto-scaling

- Models: `AutoScalingRule` and `AutoScalingEvent` in `app/models/models.py`.
- Service: `app/services/auto_scaling_service.py` evaluates rules every 5 minutes.
- Router: `app/routers/auto_scaling.py` exposes `/auto-scaling/rules` and `/auto-scaling/events`.
- Policies: define thresholds for `cpu`, `ram`, `disk`, `bandwidth`; actions: `notify`, `restart`, `upsize`, `downsize`.
- The evaluator uses the latest `UsageRecord` for a metric, with a planned fallback to OVH RTM / Proxmox metrics.
- Cooldown and idempotency prevent duplicate events within the configured cooldown window.
- The policy loop is started in `app/main.py` lifespan.
- API access is restricted to admin JWT or the `X-Service-Key` configured in `admin_configs` (`ghc_admin_service_key`).

## ⚠️ CRITICAL — Production OVH account: READ-ONLY service operations

The OVH account **ajaykumarsinghup24@gmail.com** hosts the MAIN production server for ALL
company websites and applications. **NEVER** perform mutating operations on its existing
services — no reinstall, terminate, suspend, IPMI/netboot, rDNS changes, IP moves, firewall
changes, volume changes, or contact/nichandle changes. A single destructive call can take
every site offline permanently.

- Safe: `GET` reads (catalogs, service info, `/me`, balance), catalog sync, local DB work.
- Safe: editing GHC/believoo code and its own databases.
- **Forbidden without explicit written user approval:** any POST/PUT/DELETE on `/vps/*`,
  `/dedicated/server/*`, `/ip/*`, `/ipLoadBalancing/*`, `/cloud/*` on the real account, and
  any `/order/cart/*/checkout` that would spend real account balance.
- Order/cart creation and real payment/provisioning tests require the user to confirm in
  the conversation first — always.

## Monitoring & Metrics (Phase A, added 2026-10-10)

- `app/services/metrics_service.py` — provider-neutral live metrics. Sources: OVH `/vps/{sn}/monitoring` (older ranges only; new ranges 500 → negatively cached 10 min) and Proxmox (`proxmox:<node>/<vmid>` in `subscriptions.service_name`, creds via `admin_configs` keys `proxmox_host`, `proxmox_token_id`, `proxmox_token_secret`, `proxmox_verify_ssl`). Always returns `{available, source, reason}` — never fabricates values.
- `MetricSample` table stores real samples every ~10 min via `metric_sampling_loop` in `main.py`; `/api/server/{id}/metrics/history?range=1h|24h|7d` serves them.
- `/api/server/{id}/uptime` computes uptime % (24h/7d/30d) from `server_ping_metrics`.
- `subscriptions.monitoring_enabled` toggles both ping monitor and sampling.
- Ping monitor alerts: 3 consecutive DOWN/TIMEOUT → email + `UserNotification`; recovery notice on first UP. Customer alert rules (`service_alert_rules`) evaluated per-check on latency/packet_loss and latest `MetricSample` for cpu/ram/disk; 30-min re-trigger cooldown.
- Status page: `/api/status/summary` (public, real 30d category uptime + incidents), `/api/status/subscribe`, `/api/status/unsubscribe/{token}`; admin CRUD `/api/admin/status/incidents` emails subscribers (`status_subscribers`) and optionally affected customers (maintenance notifications).
- OVH dedicated servers expose NO live metrics via API — RTM data is only visible inside the guest OS; the API returns explicit `available:false` with reason instead of fake data.
