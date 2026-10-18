<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Deploy & theming notes

- Dedicated configure locations use `dcVariants`: picking a regional sibling updates the submitted plan code, commitment pricing, installation fee, OS values and specs. The catalog stock feed matches default RAM/storage. `unknown` stock cannot be purchased/pre-booked; known out-of-stock locations use the existing waitlist.
- Dedicated durations are native OVH terms; installation fees appear separately, paid only once. One dedicated server per order is currently supported. Use the included hardware configuration; upgrade option selectors are not implemented.

- `next build` exports statically to `dist2/` (`output: 'export'`). The FastAPI backend (`believoo-ghc.service`, `FRONTEND_DIST=frontend/dist`) serves `dist/`, so after building run: `rsync -a --delete --exclude='.well-known' dist2/ dist/` (`.well-known/acme-challenge` in dist/ is root-owned — keep it, needed for cert renewals).
- Theming is class-based: the inline script in `src/app/layout.tsx` adds `light`/`dark` to `<html>`. `globals.css` carries a long list of `html.dark .some-class { ... !important }` overrides that remap the light-first Tailwind classes — extend that list rather than refactoring components when a class looks wrong in dark mode.
- Light-mode dashboard sidebar: `.ghc-dash-sidebar` hook class + `html.light` scoped overrides in globals.css. `.ghc-logo-chip` is always dark (`#0b1020`) so the logo mark keeps contrast in both themes.
- Logo: `useGhcSettings()` → `logo_url` from `believoo.com/api/ghc-settings` (settings `ghc_logo`, `ghc_favicon`, served via `believoo.com/storage/...` → R2 `believoo/` prefix on `cdn.hitune.in`). Local copies in `public/images/`: `ghc-mark.png` (cropped mark), `ghc-icon.png` (square favicon), `ghc-logo.png` (full banner for auth pages).

## Metal channel (added 2026-10-12)

- The "Metal" top menu (`megaMenu` in `src/components/Navbar.tsx`, `highlight: true`) sells the SAME upstream VPS catalog under a separate margin + custom display names — so standard VPS margins stay untouched and existing VPS customers keep their original billing.
- `/metal/vps` (`src/app/metal/vps/`) — OVH-style VPS page; plans come from `GET /api/metal/vps/plans` (never `/api/server/plans` for this channel). Only the `vps-2027` range is listed (older families hidden by product decision). `?s=n8n|plesk|cpanel|wordpress` swaps the hero/breadcrumb copy via `METAL_FAMILIES` in `MetalVpsClient.tsx` — same plan set, different app positioning.
- `/metal/dedicated` (`src/app/metal/dedicated/`) — Metal-skinned dedicated server catalogue (all ranges: Advance/Game/Scale/Scale GPU/High Grade, anchored `#advance` etc.). Uses normal `fetchPlans("DEDICATED")`; `brand=metal` on configure links is harmless — backend Metal pricing only applies to VPS orders.
- All `/metal/*` pages use the shared "molten metal" dark theme in `globals.css` (`ghc-metal-*` classes: `-bg`, `-card` glass+glow hover, `-btn` gradient, `-text-grad`, `-orb-a/b/c`, `-scan` sheen, `-chip`, `-row`, `-tab`, `-fade` stagger via `--d`).
- Configure flow carries `brand=metal` in the URL → `configuration._brand = "metal"` → backend `create_customer_order` prices it with the Metal margin and stores the custom name as `display_name`.
- Metal margin % + plan names: admin panel `/admin` → Margins tab → orange "METAL" block (`GET/POST /api/admin/metal-vps`, stored in `admin_configs` keys `metal_vps_margin` / `metal_vps_names`).
- NOTE: build-time `fetch()` responses get cached in `.next/cache` across `next build` runs — stale plan data can persist. If pages show old prices after a backend change, `rm -rf .next/cache` before building. Never use `cache: "no-store"` in page-level fetches — it breaks `output: 'export'` prerendering (plans list renders empty).

## ⚠️ CRITICAL — Production OVH account is read-only

Upstream services on the OVH account **ajaykumarsinghup24@gmail.com** run the whole
company stack. Do not trigger reinstall/terminate/suspend/IP/rDNS/netboot/firewall or
any other mutating OVH call, and do not place test orders that spend account balance —
get explicit user approval first. See python-backend/AGENTS.md for details.

## Dedicated servers (Metal channel, added 2026-10-13)

- `/metal/dedicated` — molten-dark page listing all real OVH dedicated ranges (Advance/Game/Scale/Scale GPU/High Grade) via `GET /api/metal/dedicated/plans`, which returns `displayName` (admin override `admin_configs.metal_ded_names` else auto `Metal <Range> <n> (<year>)`) + `spec` + **Metal dedicated margin** (`admin_configs.metal_ded_margin`, currently 35%) applied to every duration price. Order path carries `brand=metal` → `order_service` uses the dedicated margin + custom name, same as Metal VPS.
- `/api/server/plans?category=DEDICATED` returns `spec` but NOT metal displayName — the normal pages keep original names so Metal branding never leaks into the Essential channel.
- Admin: `/admin` → Margins tab → METAL block has TWO margin inputs (VPS + dedicated) and both name tables (`GET/POST /api/admin/metal-vps`, `/api/admin/metal-dedicated`).
- The standard "VPS & Dedicated Servers" top menu is renamed **"Essential"** — Metal = premium/high-margin channel, Essential = cheaper channel. Both sell the same upstream catalog; margins differ.
- `AdvanceRangePage.tsx` groups regional plan variants (`24adv02-v3-syd` etc.) into ONE row per model+revision (key = first two planCode segments), OVH-style spec table, 6 rows + "Show more servers".

## use-cases hub page (added 2026-10-13)

- `/dedicated-servers/use-cases/` (`DedicatedUseCasesPage.tsx`) — OVH-style hub: carousel of range+use-case cards with real min prices, feature-card grid, all linking to `/dedicated-servers/prices?use_cases=<key>`.
- `DedicatedRangeList.tsx` reads `?use_cases=` (+`?usecase=`) query param to pre-select use-case chips.
- ⚠️ Next 16 export quirk: a parent `page.tsx` beside child dirs (use-cases/) emits `.next/server/app/.../index.html` but does NOT copy it to `dist2/`. After build, manually: `cp .next/server/app/dedicated-servers/use-cases/index.html dist2/dedicated-servers/use-cases/index.html` before rsync to dist/.

## Live VPS datacenter stock (added 2026-10-18)

- OVH catalog `vps_datacenter` values = **allowed** codes, NOT stock. Real per-DC stock comes from the **no-auth public endpoint** `GET {endpoint}/vps/order/rule/datacenter?planCode=X&ovhSubsidiary=IN` (returns `status`/`linuxStatus`/`windowsStatus`/`daysBeforeDelivery` per DC). No cart needed — `noAuthentication: true`.
- `GET /api/server/plans/configuration` (`plan_configuration` in compat.py) merges this: the `vps_datacenter` config entry gets `availability` ({DC: {status, linuxStatus, windowsStatus}}), `availableValues` (Linux in-stock) + `availableWindowsValues`. `_vps_dc_availability` caches 10 min (60s on failure). **Stock is per-OS-family** — a DC can be Windows-only (VPS-2 Europe was exactly that: linuxStatus OOS); the aggregate `status` field is misleading, never filter on it alone.
- `configure/page.tsx` shows DCs for the selected image's OS family (`/windows/i` on the image → windowsStatus, else linuxStatus); same-city dupes collapse (BHS+YNM → one Beauharnois card); all OOS → "temporarily out of stock" notice instead of selectable cards.
- ⚠️ Catalog values say e.g. SYD is a valid input but it can be out-of-stock — without this filter, orders fail AFTER payment. Keep this filtering in place.

## Two storefront channels — Essential vs Metal (added 2026-10-13)

- **Essential** = the standard storefront (`/vps`, `/dedicated-servers` etc., `GET /api/server/plans`). Display names come from `admin_configs.essential_vps_names` / `essential_ded_names` (admin-overridable); auto-fallbacks are `Essential VPS-N` (`default_essential_vps_name`) and `Essential <Range> <n> (<year>)` (`default_dedicated_display_name(prefix="Essential")`). Its margin IS the category margin in `margin_settings` — currently VPS 10%, DEDICATED 12% (kept low on purpose).
- **Metal** = the premium menu (`/metal/*`, `/api/metal/*/plans`, `brand=metal` orders). `metal_vps_margin`/`metal_ded_margin` = 45%; names `metal_vps_names`/`metal_ded_names` → `Metal VPS-N`, `Metal <Range> <n> (<year>)`.
- The two channels must NEVER show matching names — Metal pages keep the dark `ghc-metal-*` theme, Essential pages stay light/OVH-blue.
- Admin: `/admin` → Margins tab → blue "ESSENTIAL" block (VPS/dedicated margins + per-plan name tables) and orange "METAL" block. Admin APIs: `/api/admin/essential-vps`, `/api/admin/essential-dedicated`, `/api/admin/metal-vps`, `/api/admin/metal-dedicated`.

## Free orders mode (added 2026-10-14)

- `admin_configs.free_orders_mode` (`true`/`false`) toggles a promo mode where customers activate services at ₹0 with no payment step.
- Admin UI: `/admin` → Margins tab → "FREE ORDERS MODE" toggle (confirm dialog when enabling). APIs: `GET/POST /api/admin/free-orders` (admin), `GET /api/billing/free-orders` (public).
- When enabled, `create_customer_order` sets `customer_amount`/`tax_amount` to 0 and tags `configuration_payload._free_order`. The configure page reads the public flag → shows "FREE" pricing + "Activate now — FREE" button that uses the wallet path (₹0 deduction → PAYMENT_RECEIVED → auto-provision). `payments_checkout` short-circuits ₹0 orders (auto-paid + provision, redirects to /dashboard); `/cart/checkout` forces ₹0 carts through the wallet fulfillment path; `/orders/{id}/provision` accepts `_free_order` as paid evidence.
- Upstream (OVH) costs are still real — the order keeps the true `ovh_base_amount` for admin visibility.

## Pre-booking (stock waitlist) (added 2026-10-18)

- Configure page: when `providerConfig.preorder.enabled` is on, out-of-stock DC cards become selectable amber "⏳ Pre-book" cards instead of disabled. Selecting one sets `datacenter` to the OOS code → `preorderSelected` → summary shows a "Priority booking fee" line (percent of plan price, or flat ₹ — flat shows `~₹` when page currency ≠ INR; the server always recomputes the real amount) → button reads "Pre-book now →" → order payload carries `configuration._preorder=true`.
- Backend charges plan + fee now, queues the order as WAITING_STOCK, and auto-provisions FIFO when OVH restocks that DC for the selected OS family; auto-refunds to wallet after `refundDays`.
- Dashboard order badge: WAITING_STOCK renders as violet "PRE-BOOKED".
- Admin: `/admin` → Margins tab → amber "PRE-BOOKING" block — enable toggle, fee type (percent/flat ₹), fee value, refund days, plus the live FIFO queue with manual refund buttons (`/api/admin/preorders`, `/api/admin/preorder-settings`, `/api/admin/preorders/{id}/refund`).

## Real add-on pricing (added 2026-10-18)

- "Choose your options" on `/configure` is driven by `providerConfig.options` (`/api/server/plans/configuration?...&brand&currency`) — real OVH addon prices with channel margin, per plan (backup/snapshot codes differ per VPS model). Never hardcode ₹/$ values there.
- Selected choices go in `configuration._options` as exact OVH addon plan codes; backend re-prices and validates server-side (never trust client amounts).
- cPanel/Plesk app images auto-attach their license add-on (dropdown in the image card; "License billed below" in the sidebar) — the image cannot be ordered without it.
