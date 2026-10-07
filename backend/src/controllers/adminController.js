const prisma = require("../prisma");
const ovhService = require("../services/ovhService");

const getDashboardStats = async (req, res) => {
  try {
    const totalServers = await prisma.subscription.count();
    const activeServers = await prisma.subscription.count({ where: { status: "ACTIVE" } });
    const totalUsers = await prisma.user.count({ where: { role: "CLIENT" } });
    const totalAdmins = await prisma.user.count({ where: { role: "ADMIN" } });
    const totalOrders = await prisma.order.count();
    const totalRevenue = await prisma.order.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" }
    });
    const pendingOrders = await prisma.order.count({ where: { status: "PENDING" } });
    const totalInvoices = await prisma.invoice.count();
    const unpaidInvoices = await prisma.invoice.count({ where: { status: "UNPAID" } });
    const overdueInvoices = await prisma.invoice.count({ where: { status: "OVERDUE" } });
    const recentLogs = await prisma.systemLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });

    res.json({
      totalServers,
      activeServers,
      totalUsers,
      totalAdmins,
      totalOrders,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingOrders,
      totalInvoices,
      unpaidInvoices,
      overdueInvoices,
      recentLogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSettings = async (req, res) => {
  try {
    const settings = await prisma.settings.findMany();
    const gateways = await prisma.gatewayConfig.findMany();
    res.json({ settings, gateways });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateGateway = async (req, res) => {
  try {
    const { name, isActive, config } = req.body;
    const gateway = await prisma.gatewayConfig.upsert({
      where: { name },
      update: { isActive, ...(config && { config }) },
      create: { name, isActive, config: config || {} }
    });
    res.json(gateway);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSystemLogs = async (req, res) => {
  try {
    const { type, limit = 100 } = req.query;
    const where = type ? { type } : {};
    const logs = await prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: parseInt(limit)
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const manualServerOverride = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { action } = req.body;

    const server = await prisma.subscription.findUnique({ where: { id: serverId } });
    if (!server) return res.status(404).json({ error: "Server not found" });

    let newStatus = server.status;
    if (action === "suspend") newStatus = "SUSPENDED";
    else if (action === "unsuspend") newStatus = "ACTIVE";
    else if (action === "terminate") newStatus = "TERMINATED";

    const updated = await prisma.subscription.update({
      where: { id: serverId },
      data: { status: newStatus }
    });

    await prisma.systemLog.create({
      data: {
        type: "INFO",
        message: `Admin manually ${action}ed server ${server.name}`,
        details: { serverId, action }
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= USERS =================
const getUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }
    if (role) where.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isSuspended: true,
          isEmailVerified: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { subscriptions: true, orders: true } }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, isSuspended } = req.body;

    const data = {};
    if (role !== undefined) data.role = role;
    if (isSuspended !== undefined) data.isSuspended = isSuspended;

    const updated = await prisma.user.update({
      where: { id: userId },
      data
    });

    await prisma.systemLog.create({
      data: {
        type: "INFO",
        message: `Admin updated user ${updated.email}`,
        details: { userId, role, isSuspended }
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= CREDENTIALS =================
const getCredentials = async (req, res) => {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: [
            "ovh_app_key",
            "ovh_app_secret",
            "ovh_consumer_key",
            "google_client_id",
            "google_client_secret",
            "smtp_host",
            "smtp_port",
            "smtp_user",
            "smtp_pass"
          ]
        }
      }
    });
    const gateways = await prisma.gatewayConfig.findMany();
    const credentials = {};
    settings.forEach(s => { credentials[s.key] = s.value; });
    res.json({ credentials, gateways });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCredentials = async (req, res) => {
  try {
    const { ovh, google, smtp, gateways } = req.body;

    if (ovh) {
      for (const [key, value] of Object.entries(ovh)) {
        await prisma.settings.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
      }
    }
    if (google) {
      for (const [key, value] of Object.entries(google)) {
        await prisma.settings.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
      }
    }
    if (smtp) {
      for (const [key, value] of Object.entries(smtp)) {
        await prisma.settings.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
      }
    }
    if (gateways) {
      for (const gw of gateways) {
        await prisma.gatewayConfig.upsert({
          where: { name: gw.name },
          update: { config: gw.config || {}, isActive: gw.isActive },
          create: { name: gw.name, config: gw.config || {}, isActive: gw.isActive || false }
        });
      }
    }

    await prisma.systemLog.create({
      data: {
        type: "INFO",
        message: "Admin updated system credentials",
        details: { updatedFields: Object.keys(req.body) }
      }
    });

    res.json({ message: "Credentials updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= BRAND =================
const getBrandSettings = async (req, res) => {
  try {
    let brand = await prisma.brandSettings.findFirst();
    if (!brand) {
      brand = await prisma.brandSettings.create({
        data: { siteName: "BelieVoo", primaryColor: "#00f0ff", accentColor: "#b500ff" }
      });
    }
    res.json(brand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateBrandSettings = async (req, res) => {
  try {
    const { siteName, logoUrl, faviconUrl, primaryColor, accentColor } = req.body;
    const existing = await prisma.brandSettings.findFirst();

    let updated;
    if (existing) {
      updated = await prisma.brandSettings.update({
        where: { id: existing.id },
        data: { siteName, logoUrl, faviconUrl, primaryColor, accentColor }
      });
    } else {
      updated = await prisma.brandSettings.create({
        data: { siteName, logoUrl, faviconUrl, primaryColor, accentColor }
      });
    }

    await prisma.systemLog.create({
      data: {
        type: "INFO",
        message: "Admin updated brand settings",
        details: { siteName }
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const syncOvhPlans = async (req, res) => {
  try {
    const result = await ovhService.syncPlans();
    res.json({ success: true, message: `Synced ${result.synced} plans successfully.`, ...result });
  } catch (error) {
    console.error("OVH Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getMarginSettings = async (req, res) => {
  try {
    const all = await prisma.marginSetting.findMany();
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMarginSetting = async (req, res) => {
  try {
    const { category, percent } = req.body;
    const updated = await prisma.marginSetting.upsert({
      where: { category },
      update: { percent: parseFloat(percent) },
      create: { category, percent: parseFloat(percent) }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPlanCatalog = async (req, res) => {
  try {
    const { category, search } = req.query;
    const where = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { planCode: { contains: search, mode: 'insensitive' } },
        { invoiceName: { contains: search, mode: 'insensitive' } }
      ];
    }
    const plans = await prisma.planCatalog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { durations: { orderBy: { interval: 'asc' } } }
    });

    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePlanOverride = async (req, res) => {
  try {
    const { planCode } = req.params;
    const { overridePrice, overrideMargin } = req.body;
    const updated = await prisma.planCatalog.update({
      where: { planCode },
      data: {
        overridePrice: overridePrice !== undefined && overridePrice !== '' ? parseFloat(overridePrice) : null,
        overrideMargin: overrideMargin !== undefined && overrideMargin !== '' ? parseFloat(overrideMargin) : null,
      }
    });

    // Recalculate all durations for this plan
    const durations = await prisma.planDuration.findMany({ where: { planCode } });
    const margin = overrideMargin !== undefined && overrideMargin !== '' ? parseFloat(overrideMargin) : null;
    const fixedPrice = overridePrice !== undefined && overridePrice !== '' ? parseFloat(overridePrice) : null;

    for (const dur of durations) {
      const finalPrice = fixedPrice !== null ? fixedPrice : (margin !== null ? dur.rawPrice + (dur.rawPrice * (margin / 100)) : dur.rawPrice);
      await prisma.planDuration.update({
        where: { id: dur.id },
        data: { finalPrice }
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSubscriptions = async (req, res) => {
  try {
    const { status, category, userId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (userId) where.userId = userId;

    const subs = await prisma.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.json(subs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const subscriptionLifecycle = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const result = await ovhService.lifecycleAction(id, action);
    res.json({ success: true, subscription: result, action });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDomainTldPricing = async (req, res) => {
  try {
    const all = await prisma.domainTldPricing.findMany({ orderBy: { tld: 'asc' } });
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateDomainTldPricing = async (req, res) => {
  try {
    const { tld, baseCost, marginPercent, isActive } = req.body;
    const updated = await prisma.domainTldPricing.upsert({
      where: { tld },
      update: {
        baseCost: baseCost !== undefined ? parseFloat(baseCost) : undefined,
        marginPercent: marginPercent !== undefined ? parseFloat(marginPercent) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      create: {
        tld,
        baseCost: parseFloat(baseCost) || 10,
        marginPercent: parseFloat(marginPercent) || 20,
        isActive: isActive !== undefined ? isActive : true,
      }
    });
    await prisma.systemLog.create({
      data: { type: "INFO", message: `Admin updated TLD pricing: ${tld}`, details: { tld, baseCost, marginPercent, isActive } },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const { status = "ALL", page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status !== "ALL") where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          user: { select: { id: true, name: true, email: true } },
          invoice: { select: { id: true, status: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getSettings,
  updateSetting,
  updateGateway,
  getSystemLogs,
  manualServerOverride,
  getUsers,
  updateUser,
  getCredentials,
  updateCredentials,
  getBrandSettings,
  updateBrandSettings,
  syncOvhPlans,
  getMarginSettings,
  updateMarginSetting,
  getPlanCatalog,
  updatePlanOverride,
  getSubscriptions,
  subscriptionLifecycle,
  getDomainTldPricing,
  updateDomainTldPricing,
  getOrders,
};
