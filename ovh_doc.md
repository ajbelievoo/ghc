Project Name: GHC (GO HOST CLOUD)
 Cloud Billing & Automation Portal

Target Platform: Custom Web Application (SaaS Cloud Panel)

Goal: Build a high-performance, modern web portal to automate hosting plan sales (OVHcloud API Integration) with instant Indian payment gateway support.

🎨 VISUAL THEME & UI SPECIFICATIONS
Theme Concept: Midnight Onyx / Dark Glassmorphism.

UI Elements: Acrylic blur (backdrop-blur-md), dark translucent containers (rgba(15, 23, 42, 0.7)), neon accents (Cyan/Violet #06b6d4, #8b5cf6), subtle border glow (border-slate-800).

Framework: React / Next.js (App Router) + Tailwind CSS + Lucide Icons.

🛠 TECH STACK REQUIREMENT
Frontend: Next.js (TypeScript), Tailwind CSS, Framer Motion (smooth transitions).

Backend: Node.js (Express/Fastify) OR Next.js Server Actions / API Routes.

Database: PostgreSQL / MongoDB (Prisma ORM recommended).

Queue/Background Worker: BullMQ + Redis (For long-running background tasks like OVH API status checks & provisioning updates).

State & Auth: JWT / NextAuth.js.

🗄 DATABASE SCHEMA (PRISMA SCHEMA CONCEPT)
Code snippet
enum Role {
  USER
  ADMIN
}

enum OrderStatus {
  PENDING
  PROCESSING
  ACTIVE
  SUSPENDED
  CANCELLED
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  phone     String?
  role      Role     @default(USER)
  orders    Order[]
  createdAt DateTime @default(now())
}

model Plan {
  id            String   @id @default(uuid())
  name          String
  category      String   // VPS, DEDICATED, CLOUD
  ovhPlanCode   String   // Internal OVH plan code
  priceINR      Float
  cpuSpecs      String
  ramSpecs      String
  storageSpecs  String
  bandwidth     String
  isActive      Boolean  @default(true)
  orders        Order[]
}

model Order {
  id              String      @id @default(uuid())
  userId          String
  planId          String
  status          OrderStatus @default(PENDING)
  paymentId       String?     // Razorpay / Cashfree Payment ID
  ovhOrderCartId  String?     // OVH Cart/Order ID
  ovhServiceId    String?     // OVH Final Dedicated/VPS Service ID
  serverIp        String?
  rootPassword    String?
  user            User        @relation(fields: [userId], references: [id])
  plan            Plan        @relation(fields: [planId], references: [id])
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}
🔌 OVH API INTEGRATION ENGINE
API Credentials (Config)
The backend must authenticate with OVH REST API using:

OVH_ENDPOINT (e.g., ovh-eu or ovh-us)

OVH_APPLICATION_KEY

OVH_APPLICATION_SECRET

OVH_CONSUMER_KEY

Automation Logic Flow
Cart Creation:

Endpoint: POST /order/cart

Assign cart to user context and set ovhPlanCode.

Item Addition & Configuration:

Endpoint: POST /order/cart/{cartId}/dedicated/server (or /vps)

Select hardware specifications, OS image, and datacenter location.

Cart Checkout:

Endpoint: POST /order/cart/{cartId}/checkout

Executes purchase on OVH using pre-funded account balance/card.

Service Status Sync (Cron Job / Redis Queue):

Endpoint: GET /dedicated/server/{serviceName}

Background task checks if IP assignment and provisioning are complete.

Upon completion, update status to ACTIVE in DB and send email/notification to client.

💳 PAYMENT GATEWAY INTEGRATION
Provider: Razorpay / Cashfree (UPI, Cards, Netbanking).

Payment Flow:

Client clicks "Buy Now" -> Backend creates Gateway Order (Razorpay Order ID).

Client completes UPI/Card payment on frontend.

Gateway sends payment.captured Webhook to /api/webhooks/payment.

Webhook handler verifies signature -> Updates DB Order status to PROCESSING -> Triggers OVH API Provisioning Queue.

🖥 PAGES & UI COMPONENTS TO BUILD
1. Landing & Pricing Page (/)
Hero Section with Neon Glow & Glassmorphism card.

Category Tabs: Dedicated Servers, VPS Hosting, Public Cloud.

Dynamic Pricing Cards displaying Specs (CPU, RAM, NVMe, Bandwidth, Price in INR).

2. Client Portal Dashboard (/dashboard)
Overview Card: Active Servers Count, Outstanding Invoices, System Status.

Server List View: Display all active VPS/Servers with IP Address, Status Badge (Active, Provisioning), and Quick Actions.

Server Details Page (/dashboard/server/[id]):

Power Controls: Reboot, Shutdown, Reinstall OS (Triggers OVH API endpoint).

Network Details: Public IP, Bandwidth Usage, Datacenter Region.

Credentials Box: Root Password toggle show/hide.

3. Admin Control Panel (/admin)
Manage Plans (Add/Edit OVH plan mapping & INR pricing).

View all User Orders & Payment Transactions.

Sync OVH Balance & Server Status manually.

📜 INSTRUCTION FOR WINDSURF AI (CASCADE)
"Please build the project based on the specifications above. Start by initializing a Next.js (TypeScript) application with Tailwind CSS, configure Prisma with the provided database schema, create the OVH API client wrapper in lib/ovh.ts, implement the Razorpay/Cashfree webhook handler, and construct the Glassmorphism UI components for the Landing Page and Client Dashboard."