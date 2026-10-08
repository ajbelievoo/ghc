<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Deploy & theming notes

- `next build` exports statically to `dist2/` (`output: 'export'`). The FastAPI backend (`believoo-ghc.service`, `FRONTEND_DIST=frontend/dist`) serves `dist/`, so after building run: `rsync -a --delete --exclude='.well-known' dist2/ dist/` (`.well-known/acme-challenge` in dist/ is root-owned — keep it, needed for cert renewals).
- Theming is class-based: the inline script in `src/app/layout.tsx` adds `light`/`dark` to `<html>`. `globals.css` carries a long list of `html.dark .some-class { ... !important }` overrides that remap the light-first Tailwind classes — extend that list rather than refactoring components when a class looks wrong in dark mode.
- Light-mode dashboard sidebar: `.ghc-dash-sidebar` hook class + `html.light` scoped overrides in globals.css. `.ghc-logo-chip` is always dark (`#0b1020`) so the logo mark keeps contrast in both themes.
- Logo: `useGhcSettings()` → `logo_url` from `believoo.com/api/ghc-settings` (settings `ghc_logo`, `ghc_favicon`, served via `believoo.com/storage/...` → R2 `believoo/` prefix on `cdn.hitune.in`). Local copies in `public/images/`: `ghc-mark.png` (cropped mark), `ghc-icon.png` (square favicon), `ghc-logo.png` (full banner for auth pages).

## ⚠️ CRITICAL — Production OVH account is read-only

Upstream services on the OVH account **ajaykumarsinghup24@gmail.com** run the whole
company stack. Do not trigger reinstall/terminate/suspend/IP/rDNS/netboot/firewall or
any other mutating OVH call, and do not place test orders that spend account balance —
get explicit user approval first. See python-backend/AGENTS.md for details.
