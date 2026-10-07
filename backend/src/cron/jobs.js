const cron = require("node-cron");
const prisma = require("../prisma");
const ovhService = require("../services/ovhService");
// const PDFDocument = require('pdfkit'); // Used for actual PDF generation
// const nodemailer = require('nodemailer'); // Used for sending emails

const generateAndEmailInvoice = async (server) => {
  // Mock logic to generate PDF and send email
  console.log(`Generating PDF invoice for server ${server.id} and emailing user ${server.userId}`);
};

const checkSubscriptionLifecycle = async () => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    // 1. Generate Invoice 3 days before next bill date
    const upcomingBills = await prisma.subscription.findMany({
      where: {
        nextBillDate: { lte: threeDaysFromNow, gte: now },
        status: "ACTIVE",
        autoRenew: true
      }
    });

    for (let sub of upcomingBills) {
      await generateAndEmailInvoice(sub);
    }

    // 2. Suspend if overdue by 12 hours past nextBillDate
    const overdueSubs = await prisma.subscription.findMany({
      where: {
        nextBillDate: { lte: twelveHoursAgo },
        status: "ACTIVE"
      }
    });

    for (let sub of overdueSubs) {
      try {
        await ovhService.performServerAction(sub.ovhResourceId, "suspend");
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "SUSPENDED" }
        });
      } catch (err) {
        console.error(`Failed to suspend subscription ${sub.id}:`, err);
      }
    }

    // 3. Auto-renew subscriptions where autoRenew=true and nextBillDate is today
    const renewingSubs = await prisma.subscription.findMany({
      where: {
        nextBillDate: { lte: now, gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        status: "ACTIVE",
        autoRenew: true
      }
    });

    for (let sub of renewingSubs) {
      try {
        const cycleDays = sub.billingCycle === "MONTHLY" ? 30 : sub.billingCycle === "QUARTERLY" ? 90 : 365;
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { nextBillDate: new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000) }
        });
      } catch (err) {
        console.error(`Failed to renew subscription ${sub.id}:`, err);
      }
    }

    await prisma.cronLog.create({
      data: {
        jobName: "checkSubscriptionLifecycle",
        status: "SUCCESS",
        details: `Upcoming: ${upcomingBills.length}, Overdue: ${overdueSubs.length}, Renewed: ${renewingSubs.length}.`
      }
    });
  } catch (error) {
    await prisma.cronLog.create({
      data: {
        jobName: "checkSubscriptionLifecycle",
        status: "FAILED",
        details: error.message
      }
    });
    console.error("Cron Error:", error);
  }
};

const syncOvhPlans = async () => {
  try {
    const ovhService = require("../services/ovhService");
    const result = await ovhService.syncPlans();
    await prisma.cronLog.create({
      data: {
        jobName: "syncOvhPlans",
        status: "SUCCESS",
        details: `Synced ${result.synced} OVH VPS plans.`
      }
    });
    console.log("[CRON] OVH plans synced:", result.synced);
  } catch (error) {
    await prisma.cronLog.create({
      data: {
        jobName: "syncOvhPlans",
        status: "FAILED",
        details: error.message
      }
    });
    console.error("[CRON] OVH sync failed:", error.message);
  }
};

const pollProvisioning = async () => {
  try {
    const ovhService = require("../services/ovhService");
    const result = await ovhService.pollProvisioningStatus();
    console.log(`[CRON] Provisioning poll: activated ${result.activated}/${result.polled}`);
  } catch (error) {
    console.error("[CRON] Provisioning poll failed:", error.message);
  }
};

const init = () => {
  // Run daily at midnight
  cron.schedule("0 0 * * *", checkSubscriptionLifecycle);
  // Sync OVH plans every 6 hours
  cron.schedule("0 */6 * * *", syncOvhPlans);
  // Poll pending OVH provisioning every 5 minutes and flip PENDING -> ACTIVE
  // when IP assignment / delivery is complete (per ovh_doc.md spec)
  cron.schedule("*/5 * * * *", pollProvisioning);
  // Run once immediately on startup
  syncOvhPlans();
  pollProvisioning();
  console.log("Cron jobs initialized.");
};

module.exports = { init };
