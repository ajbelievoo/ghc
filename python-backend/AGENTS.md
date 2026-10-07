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
