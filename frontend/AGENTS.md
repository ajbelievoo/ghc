<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Deploy & theming notes

- `next build` exports statically to `dist2/` (`output: 'export'`). The FastAPI backend (`believoo-ghc.service`, `FRONTEND_DIST=frontend/dist`) serves `dist/`, so after building run: `rsync -a --delete --exclude='.well-known' dist2/ dist/` (`.well-known/acme-challenge` in dist/ is root-owned — keep it, needed for cert renewals).
- Theming is class-based: the inline script in `src/app/layout.tsx` adds `light`/`dark` to `<html>`. `globals.css` carries a long list of `html.dark .some-class { ... !important }` overrides that remap the light-first Tailwind classes — extend that list rather than refactoring components when a class looks wrong in dark mode.
- Light-mode dashboard sidebar: `.ghc-dash-sidebar` hook class + `html.light` scoped overrides in globals.css. `.ghc-logo-chip` is always dark (`#0b1020`) so the logo mark keeps contrast in both themes.
- Logo: `useGhcSettings()` → `logo_url` from `believoo.com/api/ghc-settings` (settings `ghc_logo`, `ghc_favicon`, served via `believoo.com/storage/...` → R2 `believoo/` prefix on `cdn.hitune.in`). Local copies in `public/images/`: `ghc-mark.png` (cropped mark), `ghc-icon.png` (square favicon), `ghc-logo.png` (full banner for auth pages).

## Metal channel (added 2026-10-12)

- The "Metal" top menu (`megaMenu` in `src/components/Navbar.tsx`, `highlight: true`) sells the SAME upstream VPS catalog under a separate margin + custom display names — so standard VPS margins stay untouched and existing VPS customers keep their original billing.
- `/metal/vps` (`src/app/metal/vps/`) — OVH-style VPS page; plans come from `GET /api/metal/vps/plans` (never `/api/server/plans` for this channel). Only the `vps-2027` range is listed (older families hidden by product decision). `?s=n8n|plesk|cpanel|wordpress` swaps the hero/breadcrumb copy via `METAL_FAMILIES` in `MetalVpsClient.tsx` — same plan set, different app positioning.
- Configure flow carries `brand=metal` in the URL → `configuration._brand = "metal"` → backend `create_customer_order` prices it with the Metal margin and stores the custom name as `display_name`.
- Metal margin % + plan names: admin panel `/admin` → Margins tab → orange "METAL" block (`GET/POST /api/admin/metal-vps`, stored in `admin_configs` keys `metal_vps_margin` / `metal_vps_names`).
- NOTE: build-time `fetch()` responses get cached in `.next/cache` across `next build` runs — stale plan data can persist. If pages show old prices after a backend change, `rm -rf .next/cache` before building. Never use `cache: "no-store"` in page-level fetches — it breaks `output: 'export'` prerendering (plans list renders empty).

## ⚠️ CRITICAL — Production OVH account is read-only

Upstream services on the OVH account **ajaykumarsinghup24@gmail.com** run the whole
company stack. Do not trigger reinstall/terminate/suspend/IP/rDNS/netboot/firewall or
any other mutating OVH call, and do not place test orders that spend account balance —
get explicit user approval first. See python-backend/AGENTS.md for details.
