# BelieVoo GHC - Enterprise Cloud Hosting Platform

A fully automated, proprietary SaaS cloud hosting and VPS infrastructure platform built for `ghc.believoo.com`. Zero third-party billing software. Everything coded from scratch.

## Architecture

- **Frontend**: Next.js 16 + React + Tailwind CSS v4 (Midnight Onyx / Glassmorphic UI)
- **Backend**: Python + FastAPI + SQLAlchemy (main backend running on ghc.believoo.com)
- **Legacy Backend**: Node.js + Express + Prisma ORM (kept for reference, not active)
- **Database**: SQLite (production), PostgreSQL compatible
- **APIs**: OVH Cloud API, 5 Payment Gateways (Stripe, Razorpay, PayPal, PayU, Cashfree)
- **Automation**: systemd service + OVH API for provisioning

## Project Structure

```
ghc/
├── backend/          # Express API Server
│   ├── src/
│   │   ├── server.js               # Entry point
│   │   ├── prisma.js               # Prisma client
│   │   ├── routes/                 # API Routes
│   │   │   ├── auth.js             # Auth endpoints
│   │   │   ├── admin.js            # Admin endpoints
│   │   │   ├── server.js           # Server control endpoints
│   │   │   ├── billing.js          # Order & invoice endpoints
│   │   │   └── webhooks.js         # Payment webhooks
│   │   ├── controllers/            # Business logic
│   │   ├── middlewares/            # Auth & admin guards
│   │   ├── services/               # OVH API integration
│   │   ├── cron/                   # Automated jobs
│   │   └── utils/                  # Helpers
│   └── prisma/
│       └── schema.prisma           # Database schema
│
├── frontend/       # Next.js App
│   └── src/app/
│       ├── page.tsx                # Landing page
│       ├── login/page.tsx          # Login
│       ├── register/page.tsx       # Register
│       ├── dashboard/page.tsx      # Client control panel
│       └── admin/page.tsx          # Admin command hub
│
└── README.md
```

## Features Implemented

### Step 1: Authentication Engine (Dual-System)
- Email/Password registration with bcrypt hashing
- JWT-based session management
- Google OAuth login (toggleable via admin switch)
- Role-based access (CLIENT / ADMIN)

### Step 2: Multi-Gateway Automated Billing & Cron
- 5 Payment Gateways: Razorpay, Cashfree, PayPal, PayU, Stripe
- Individual admin toggle switches per gateway
- Daily cron job for:
  - Expiry checks
  - PDF invoice generation (3 days before expiry)
  - Auto-suspension via OVH API (12 hours overdue)

### Step 3: OVH API Provisioning & Margin Sync
- Live OVH cost pulling with dynamic markup
- Admin-configurable profit margin (%)
- Instant provisioning on payment webhook
- Secure credential storage and welcome email delivery

### Step 4: White-Labeled Client Portal
- Power controls: Reboot, Stop, Start
- OS Reinstallation (Ubuntu, Debian, Windows Server)
- Live resource metrics (CPU, RAM, Bandwidth)
- Invoice and order management

### Step 5: Ultra-Powerful Admin Command Hub
- Master toggles for Google Login, Email Alerts, Gateways
- Live infrastructure health dashboard
- System Log Tracker (CRITICAL for debugging payment/API failures)
- One-click server overrides (Suspend/Unsuspend/Terminate)

## Quick Start

### 1. Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment
```bash
cd backend
# Edit .env with your PostgreSQL, OVH, and payment gateway credentials
```

### 3. Database Setup
```bash
cd backend
npx prisma db push
# Or: npm run db:migrate
```

### 4. Seed Default Settings
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function seed() {
  await prisma.settings.upsert({ where: { key: 'google_login_enabled' }, update: {}, create: { key: 'google_login_enabled', value: 'true' } });
  await prisma.settings.upsert({ where: { key: 'email_alerts_enabled' }, update: {}, create: { key: 'email_alerts_enabled', value: 'true' } });
  await prisma.settings.upsert({ where: { key: 'profit_margin_percent' }, update: {}, create: { key: 'profit_margin_percent', value: '20' } });
  console.log('Seeded defaults');
}
seed().catch(console.error);
"
```

### 5. Start Backend
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

### 6. Build & Deploy Frontend
```bash
cd frontend
npm run build
# Static output in frontend/dist/
# Copy dist/ contents to your web server root for ghc.believoo.com
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Sign in |
| `/api/auth/google` | POST | Google OAuth |
| `/api/admin/stats` | GET | Dashboard stats |
| `/api/admin/settings` | GET/POST | Global settings |
| `/api/admin/gateways` | POST | Toggle gateways |
| `/api/admin/logs` | GET | System logs |
| `/api/admin/servers/:id/override` | POST | Manual override |
| `/api/server` | GET | List my servers |
| `/api/server/:id/power` | POST | Power action |
| `/api/server/:id/reinstall` | POST | OS reinstall |
| `/api/server/:id/metrics` | GET | Live metrics |
| `/api/billing/order` | POST | Create order |
| `/api/billing/invoices` | GET | List invoices |
| `/api/webhooks/:gateway` | POST | Payment webhooks |

## Design System

- **Theme**: Midnight Onyx
- **Accents**: Neon Cyan (`#00f0ff`), Neon Purple (`#b500ff`)
- **Effects**: Glassmorphism (`backdrop-blur`), Acrylic Blur, Neon Glow borders
- **Typography**: Inter (Google Fonts)

## Security Notes

- JWT tokens stored in localStorage (consider httpOnly cookies for production hardening)
- Passwords hashed with bcrypt (10 rounds)
- Admin routes protected by `requireAdmin` middleware
- Webhook endpoints require signature verification (implement per gateway)
- OVH credentials stored in environment variables

## License

Proprietary - BelieVoo Technologies
