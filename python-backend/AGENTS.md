# GHC Python Backend Notes

## Dedicated configuration / stock

- `/server/plans/configuration` merges active `-mum`, `-sgp`, `-syd` siblings, returning `dcVariants` with exact plan codes, currency-converted period totals, monthly prices, installation fees, default specs and OS values.
- `_ded_dc_availability(plan)` uses the public `/dedicated/server/datacenter/availabilities` feed, matching the catalog's **default RAM and storage**, never the fastest unrelated configuration. Unknown/error stock is not payable or pre-bookable. Dedicated `ynm` is Mumbai; keep it distinct from VPS aliases.
- Dedicated orders validate native catalog durations, image, location and stock before payment. Provisioning uses the native pricing mode (`upfront12`/`upfront24` where supplied) and catalog default mandatory addons. Installation is charged once, excluded from the subscription's recurring amount.
- Dedicated pre-orders reuse the fee/refund queue and probe the same exact hardware on restock. Never retry a failed preorder with an existing upstream order ID. Tests in `tests/test_dedicated_configuration.py` mock provisioning and payment writes.
- The configurator currently offers the included hardware configuration and one dedicated server per order; arbitrary hardware upgrades and multiple server quantities are not implemented.

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

## Catalog sync & dedicated specs (added 2026-10-13)

- `catalog_sync_loop` in `main.py` runs `sync_all_catalogs` every 6h automatically (first run ~2 min after boot). Manual: `POST /api/admin/sync` or catalog.py router.
- Dedicated specs come from product `blobs.technical.server.cpu` + plan `addonFamilies[].default` (memory `ram-Ng`, storage `NxSIZEtech`, bandwidth `bandwidth-N` / `traffic-*-N`). Parsed extras land in `plan_catalogs.catalog_metadata._ghc` (cpu_model/threads/freq, ram/storage/bandwidth labels).
- `metal_ded_names` admin config = per-plan display-name overrides for dedicated; auto-fallback `default_dedicated_display_name()` → "Metal Advance 2 (2024)" style. `displayName`/`spec`/`metal margin` are exposed ONLY via `GET /api/metal/dedicated/plans` — `/api/server/plans` returns `spec` but no Metal names (keeps Metal branding out of the Essential channel).
- `metal_ded_margin` admin config = dedicated Metal margin % (independent of category margin; currently 35). Applied in `metal_dedicated_plans` and in `order_service` when `configuration._brand == "metal"` + category DEDICATED.
- Admin API: `GET/POST /api/admin/metal-dedicated` accepts `{names, marginPercent}`; `/api/admin/metal-vps` same shape for VPS.

## Pre-booking / stock waitlist (added 2026-10-18)

- `OrderStatus.WAITING_STOCK` — customer paid for an out-of-stock plan+DC; queued FIFO until OVH restocks.
- Flow: configure page sends `configuration._preorder=true` for an out-of-stock DC → `create_customer_order` adds the admin-set fee (`admin_configs.preorder_fee_type` = `percent`|`flat`, `preorder_fee_value`; flat stored in INR, converted to order currency; fee is taxed inside `taxable`) → all payment paths call `kickoff_after_payment()` which routes pre-orders to WAITING_STOCK (email + notification) instead of spawning provisioning.
- Watcher: `preorder_watcher_loop` in `main.py` (every 5 min) → `preorder_tick()` in `order_service.py`: refunds orders older than `preorder_refund_days` (default 30) via `credit_wallet`, re-queues `_preorder` PROVISIONING_FAILED orders (max 3 attempts, race-loss safety), and for each plan probes `_vps_dc_availability` — when the order's DC+OS family is `available`, it spawns normal provisioning (ONE order per plan+DC per cycle, FIFO by created_at).
- DC matching is OS-family aware: `_preorder_os_family()` → `linuxStatus`/`windowsStatus`. Validation: `_validate_configuration` accepts preorder DCs in the wider DC universe (rule-endpoint ∪ extras like BOM), not just catalog values.
- Admin APIs: `GET /api/admin/preorders` (settings + queue), `POST /api/admin/preorder-settings`, `POST /api/admin/preorders/{id}/refund` (manual early refund). Public settings exposed at `plan_configuration.preorder`.
- Caveat: OVH does NOT reserve stock — fulfillment rechecks live stock and can still lose the race; attempts are recorded in `configuration_payload._preorder_attempts`.

## Dedicated regional variants + configurable hardware (added 2026-10-18)

- One OVH dedicated model = several planCodes: base plan serves EU/NA DCs; `-mum`/`-sgp`/`-syd` siblings serve Mumbai (`ynm`)/Singapore/Sydney with their own prices. `_ded_family_plans()` groups them by stripping `_DED_REGION_SUFFIX`.
- `GET /api/server/plans/configuration` (dedicated) returns `dcVariants[dc]` = `{planCode, prices, totals, setupPrices, pricingModes, options, stock, spec, osValues}`. `stock` is a per-hardware-combo map `"<memory>|<storage>" -> {status, availability, deliveryHours}` from the PUBLIC no-auth feed `/dedicated/server/datacenter/availabilities` (addon codes carry the base-plan suffix — `_ded_stock_code()` strips it to match feed fqns). `_ded_dc_availability(plan, memory=, storage=)` checks the EXACT combo — never treat plan-level availability as combo stock.
- Order flow: `create_customer_order` swaps the plan to the DC's regional sibling BEFORE `_validate_configuration`/duration fetch (so `order.plan_code` is the real cart planCode), validates `_options` against that variant's `addonFamilies`, prices upgrades via `_ded_addon_prices()` (public `baremetalServers` catalog addons; family-default codes are free; upfront12/24 durations use the addon's native mode totals), and the availability check + `preorder_tick` probe use the ordered RAM/storage combo via `_ded_hw_from_config()`.
- Configure page: "Configure your server" — OVH-parity UI: Memory/Storage radios; **Public bandwidth = one card per speed with an inner traffic dropdown** (`traffic-{size}tb-{mbps}`/`traffic-unlimited-{mbps}`/`bandwidth-{mbps}` codes parsed via `bwParse`); single-choice mandatory families (vRack) render as fixed "Included" cards (`selectable:false`); license families render as product checkbox+edition-dropdown groups (Windows Server→"Operating system", SQL/Plesk/cPanel→"Applications and licenses", one edition per product). `cfgOptions` = `dcVariants[dc].options || options`; `activeLocations` recomputes in-stock DCs from `dedStockFor(dc)` per selected combo; subtotal adds `dedOptionsTotal` (mode-aware: `choices[].modes[pricingMode]` else monthly×months).

## Paid VPS add-ons / real option pricing (added 2026-10-18)

- `GET /api/server/plans/configuration` now returns `options`: per-family (`snapshot`, `automatedBackup`, `additionalDisk`, `cpanel`, `plesk`) choices with real OVH catalog prices + channel margin, converted to `?currency=`. `_vps_addon_prices()` reads the public catalog `/order/catalog/public/vps` (microcents ÷1e8, 30-min cache); `_vps_options_for_plan` applies Metal (`metal_vps_margin`) vs category margin via `brand=metal`.
- Frontend sends `configuration._options = [addonPlanCode...]`. `create_customer_order` validates codes against the plan's `addonFamilies` (excluding `os`/`storage`), prices them `sell × months × currency-rate`, adds to `taxable`, stores `_options`/`_options_price` in the payload. Bogus codes → 400.
- License safety: `option-cpanel-*`/`option-plesk-*` require a matching OS image string containing `cpanel`/`plesk`, and a licensed VPS image without its license code is rejected — OVH bills licenses regardless of activation.
- `_add_mandatory_options` honors `_options`: a selected addon replaces its family's mandatory default (premium backup replaces standard), non-mandatory families add only what the customer picked.

## Commitment durations & unified sell pricing (added 2026-10-18)

- `compute_sell_price(db, plan, duration, metal=)` in catalog_service is the SINGLE pricing path: raw → (per-plan override | channel margin | category margin) → VPS duration discount. Used by `_plan_to_frontend` (Essential + Metal listings) AND `create_customer_order` — display price always equals charged price (previously orders ignored the commitment discount baked into `final_price`).
- Duration discounts: `admin_configs.commitment_discounts` (Essential) / `metal_commitment_discounts` (Metal), JSON `{duration_label: pct}` — defaults {6_month:5, 12_month:15}. Derived months come from `admin_configs.commitment_months` (default [6,12]; 3_month removed).
- Per-plan margins: Essential = `plan_catalogs.override_margin` (bulk `POST /api/admin/plan-margins`); Metal VPS = `admin_configs.metal_vps_plan_margins` (via `POST /api/admin/metal-vps` `planMargins`).
- `GET/POST /api/admin/duration-settings` — months + both discount maps; POST re-derives VPS duration rows immediately (native catalog durations like 24_month are preserved via `catalog_metadata.pricings`).
