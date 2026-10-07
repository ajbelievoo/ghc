# BelieVoo GHC - Python Backend

Main FastAPI backend for the BelieVoo OVH Cloud reseller platform.

## Features

- **Full OVH Cloud API integration**: VPS, Dedicated Servers, Web Hosting, Licenses, IP Addons, CDN, Public/Private Cloud, Domains
- **Automatic catalog sync** with live OVH public catalog
- **Category-level commission % / margin** system
- **Prepaid wallet checkout**: OVH orders are paid from `fidelityAccount` (OVH prepaid account)
- **Wallet-based internal payments** for users
- **Real service provisioning & polling**: extracts real `serviceName`, IP, datacenter
- **Lifecycle & power controls**: reboot, shutdown, start, terminate, suspend, unsuspend
- **Admin command hub**: stats, catalog sync, margin settings, OVH API logs
- **Payment gateway webhooks**: Stripe, Razorpay, Cashfree (PayPal/PayU stubs ready)

## Quick Start

```bash
cd /www/wwwroot/ghc/python-backend

# 1. Create .env from example
cp .env.example .env
# Edit .env and fill in OVH credentials + secret key

# 2. Seed default data (admin, margins, OVH configs from env)
python3 seed.py

# 3. Run server
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## OVH API Credentials

Get your keys from:
- `ovh-ca`: https://ca.api.ovh.com/createApp/
- `ovh-eu`: https://eu.api.ovh.com/createApp/
- `ovh-us`: https://api.us.ovhcloud.com/createApp/

After creating the app, generate a consumer key with required permissions (GET/POST/PUT/DELETE on `/order/*`, `/me/*`, `/vps/*`, `/dedicated/*`, `/hosting/*`, `/domain/*`, `/service/*`).

## API Flow

1. `POST /api/auth/login` → get token
2. `GET /api/catalog/plans` → browse plans
3. `POST /api/orders/create` → create customer order
4. `POST /api/orders/{id}/pay-wallet` → pay from internal wallet
5. `POST /api/orders/{id}/provision` → OVH cart, checkout, pay, poll service, create subscription
6. `GET /api/subscriptions` → manage user services

## Important Notes

- **OVH API does not have a top-up wallet API**. You must fund your OVH `fidelityAccount` / prepaid account from the OVH billing panel manually. The backend then uses that balance to auto-pay orders via API.
- User's wallet is internal to BelieVoo. When user pays you, you manually/periodically add funds to OVH and provision on their behalf.
- All services are provisioned under **your OVH account** and exposed to users through the white-label panel.

## Admin Endpoints

- `GET /api/admin/stats`
- `POST /api/admin/sync-catalog`
- `GET /api/admin/orders`
- `GET /api/admin/orders/{id}/logs`
- `PUT /api/admin/ovh-credentials`
- `PUT /api/admin/configs/{key}`
- `PUT /api/catalog/margins/{category}`

## Health Check

`GET /health`
