const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding database defaults...");

  // Default global settings
  const defaults = [
    { key: "google_login_enabled", value: "true" },
    { key: "email_alerts_enabled", value: "true" },
    { key: "profit_margin_percent", value: "20" },
  ];

  for (const setting of defaults) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // Default payment gateways (all inactive until configured)
  const gateways = [
    { name: "razorpay", isActive: false, config: {} },
    { name: "cashfree", isActive: false, config: {} },
    { name: "paypal", isActive: false, config: {} },
    { name: "payu", isActive: false, config: {} },
    { name: "stripe", isActive: false, config: {} },
  ];

  for (const gw of gateways) {
    await prisma.gatewayConfig.upsert({
      where: { name: gw.name },
      update: {},
      create: gw,
    });
  }

  // Default margin settings for all categories
  const categories = ["VPS", "DEDICATED", "WEB_HOSTING", "IP_ADDON", "LICENSE"];
  for (const cat of categories) {
    await prisma.marginSetting.upsert({
      where: { category: cat },
      update: {},
      create: { category: cat, percent: 20.0 }
    });
  }
  console.log("Created default margin settings");

  // Default brand settings
  const brandExists = await prisma.brandSettings.findFirst();
  if (!brandExists) {
    await prisma.brandSettings.create({
      data: { siteName: "BelieVoo", primaryColor: "#00f0ff", accentColor: "#b500ff" }
    });
    console.log("Created default brand settings");
  }

  // Create default admin user if none exists
  const adminExists = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminExists) {
    const hash = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        name: "System Admin",
        email: "admin@believoo.com",
        passwordHash: hash,
        role: "ADMIN",
        isEmailVerified: true,
      },
    });
    console.log("Created default admin: admin@believoo.com / admin123");
  }

  console.log("Seed complete.");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
