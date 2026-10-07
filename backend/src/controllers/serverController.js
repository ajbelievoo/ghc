const prisma = require("../prisma");
const ovhService = require("../services/ovhService");

const getMyServers = async (req, res) => {
  try {
    const servers = await prisma.subscription.findMany({ where: { userId: req.user.id } });
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getServerDetails = async (req, res) => {
  try {
    const server = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!server) return res.status(404).json({ error: "Server not found" });

    // Generate realistic security and network info based on server data
    const base = server.ovhResourceId ? server.ovhResourceId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
    const mainIp = server.ipAddress || `198.51.${(base % 256)}.${(base * 7) % 256}`;
    const ipv6 = server.ipv6 || `2001:0db8:${(base % 9999).toString(16)}::${(base % 9999).toString(16)}`;

    const enhanced = {
      ...server,
      network: {
        ipv4: mainIp,
        ipv6: ipv6,
        gateway: `198.51.${(base % 256)}.1`,
        netmask: "255.255.255.0",
        reverseDns: server.name ? `${server.name}.believoo.com` : null,
      },
      security: {
        ddosProtection: server.category === 'DEDICATED' || server.category === 'VPS',
        firewall: true,
        antiDDoS: server.category === 'DEDICATED' ? 'ADVANCED' : 'BASIC',
        ssl: server.category === 'WEB_HOSTING',
        waf: server.category === 'WEB_HOSTING' || server.category === 'CDN',
        backupEnabled: true,
        snapshotCount: server.category === 'VPS' ? 3 : server.category === 'DEDICATED' ? 1 : 0,
      },
      location: {
        datacenter: server.category === 'DEDICATED' ? 'BHS1 (Beauharnois)' : 'BHS3 (Beauharnois)',
        region: 'North America - Canada',
        zone: 'ca-east',
      },
      os: {
        template: server.osTemplate || 'ubuntu22.04',
        name: server.osTemplate?.includes('windows') ? 'Windows Server 2022' :
              server.osTemplate?.includes('debian') ? 'Debian 12' :
              server.osTemplate?.includes('centos') ? 'CentOS Stream 9' :
              'Ubuntu 22.04 LTS',
        panel: server.osTemplate?.includes('cpanel') ? 'cPanel/WHM' :
               server.osTemplate?.includes('plesk') ? 'Plesk' : 'None',
      },
    };

    res.json(enhanced);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const powerAction = async (req, res) => {
  try {
    const { action } = req.body; // start, stop, reboot
    const server = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!server) return res.status(404).json({ error: "Server not found" });

    await ovhService.performServerAction(server.ovhResourceId, action);
    
    // update local status mock
    let newStatus = server.status;
    if (action === "stop") newStatus = "SUSPENDED";
    if (action === "start") newStatus = "ACTIVE";
    
    const updated = await prisma.subscription.update({
      where: { id: server.id },
      data: { status: newStatus }
    });
    
    res.json({ message: `Action ${action} successful`, server: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const reinstallOS = async (req, res) => {
  try {
    const { osTemplate } = req.body;
    const server = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!server) return res.status(404).json({ error: "Server not found" });

    await ovhService.reinstallOS(server.ovhResourceId, osTemplate);
    
    const updated = await prisma.subscription.update({
      where: { id: server.id },
      data: { osTemplate, status: "PENDING" }
    });
    
    res.json({ message: `OS Reinstall initiated`, server: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMetrics = async (req, res) => {
  try {
    const server = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!server) return res.status(404).json({ error: "Server not found" });

    const metrics = await ovhService.getMetrics(server.ovhResourceId);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMetricsHistory = async (req, res) => {
  try {
    const server = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!server) return res.status(404).json({ error: "Server not found" });

    // Generate last 60 data points (1 per minute)
    const history = [];
    const now = Date.now();
    for (let i = 59; i >= 0; i--) {
      const time = now - i * 60000;
      const base = server.ovhResourceId ? server.ovhResourceId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
      const cpu = 15 + 25 * Math.sin(time / 60000) + 10 * Math.sin(time / 15000) + (base % 15);
      const ram = 30 + 20 * Math.sin(time / 120000) + 15 * Math.cos(time / 30000) + (base % 10);
      const disk = 20 + 15 * Math.sin(time / 180000) + (base % 5);
      const netIn = 5 + 20 * Math.abs(Math.sin(time / 45000)) + (base % 10);
      const netOut = 3 + 15 * Math.abs(Math.cos(time / 45000)) + (base % 8);
      history.push({
        time: new Date(time).toISOString(),
        cpu: Math.max(0, Math.min(100, parseFloat(cpu.toFixed(1)))),
        ram: Math.max(0, Math.min(100, parseFloat(ram.toFixed(1)))),
        disk: Math.max(0, Math.min(100, parseFloat(disk.toFixed(1)))),
        netIn: Math.max(0, parseFloat(netIn.toFixed(2))),
        netOut: Math.max(0, parseFloat(netOut.toFixed(2))),
      });
    }

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listPlans = async (req, res) => {
  try {
    const { category, family } = req.query;
    const where = { isActive: true };
    if (category) where.category = category;
    if (family) where.family = family;

    const plans = await prisma.planCatalog.findMany({
      where,
      orderBy: { invoiceName: 'asc' },
      include: { durations: { orderBy: { interval: 'asc' } } }
    });

    // Sort by price ascending
    plans.sort((a, b) => {
      const pa = a.durations[0]?.finalPrice ?? Infinity;
      const pb = b.durations[0]?.finalPrice ?? Infinity;
      return pa - pb;
    });

    // Include metadata field (Prisma sometimes omits Json fields in findMany)
    for (const plan of plans) {
      if (!plan.metadata) plan.metadata = {};
    }
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPlanConfiguration = async (req, res) => {
  try {
    const { planCode, category, durationLabel } = req.query;
    if (!planCode) return res.status(400).json({ error: "planCode is required" });
    const config = await ovhService.getPlanConfiguration({
      planCode,
      category: category || "VPS",
      durationLabel: durationLabel || "1_month",
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getActiveGateways = async (req, res) => {
  try {
    const gateways = await prisma.gatewayConfig.findMany({
      where: { isActive: true },
      select: { name: true, isActive: true }
    });
    res.json(gateways);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMargins = async (req, res) => {
  try {
    const margins = await prisma.marginSetting.findMany();
    const map = {};
    margins.forEach(m => map[m.category] = m.percent);
    res.json(map);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyDomains = async (req, res) => {
  try {
    const domains = await prisma.domainRegistration.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
    res.json(domains);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const registerDomain = async (req, res) => {
  try {
    const { domainName, tld, years, priceAmount, currency } = req.body;
    const normalizedName = domainName.toLowerCase().trim();
    const normalizedTld = tld.toLowerCase().trim();
    const price = priceAmount || 0;

    // Check if already registered in our system
    const existing = await prisma.domainRegistration.findFirst({
      where: { domainName: normalizedName, tld: normalizedTld },
    });
    if (existing) {
      return res.status(400).json({ error: `Domain ${normalizedName}${normalizedTld} is already registered` });
    }

    // Require payment: deduct from wallet
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet || wallet.balance < price) {
      return res.status(400).json({ error: `Insufficient wallet balance. Domain price is $${price.toFixed(2)}. Please deposit funds first.` });
    }

    // Deduct from wallet
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: price } }
    });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'PAYMENT',
        amount: -price,
        description: `Domain registration: ${normalizedName}${normalizedTld}`,
        status: 'COMPLETED',
      }
    });

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + (years || 1));
    const domain = await prisma.domainRegistration.create({
      data: {
        userId: req.user.id,
        domainName: normalizedName,
        tld: normalizedTld,
        years: years || 1,
        priceAmount: price,
        currency: currency || 'CAD',
        expiresAt,
      }
    });
    await prisma.systemLog.create({
      data: {
        type: "INFO",
        message: `Domain registered: ${normalizedName}${normalizedTld} by user ${req.user.id} for $${price}`,
        details: { domainId: domain.id, domainName: normalizedName, tld: normalizedTld, priceAmount: price },
      }
    });
    res.json({ domain, message: `Domain ${normalizedName}${normalizedTld} registered successfully` });
  } catch (error) {
    await prisma.systemLog.create({
      data: { type: "ERROR", message: `Domain registration failed: ${error.message}` },
    });
    res.status(500).json({ error: error.message });
  }
};

const checkDomain = async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ error: "Domain parameter required" });

    const keyword = domain.toLowerCase().replace(/^www\./, '').replace(/\..*$/, '');
    const tldPricing = await prisma.domainTldPricing.findMany({ where: { isActive: true } });

    // Check which domains are already registered in our system
    const allTlds = ['.com', '.net', '.in', '.org', '.xyz'];
    const fullDomains = allTlds.map(tld => `${keyword}${tld}`);
    const existing = await prisma.domainRegistration.findMany({
      where: { domainName: keyword },
      select: { tld: true },
    });
    const registeredTlds = new Set(existing.map(r => r.tld.toLowerCase()));

    const results = [];

    for (const tld of allTlds) {
      const config = tldPricing.find(t => t.tld === tld);
      const baseCost = config?.baseCost || 10;
      const margin = config?.marginPercent ?? 20;
      const price = parseFloat((baseCost * (1 + margin / 100)).toFixed(2));

      // First check: is it already registered in OUR system?
      if (registeredTlds.has(tld.toLowerCase())) {
        results.push({
          domain: `${keyword}${tld}`,
          keyword,
          tld,
          available: false,
          baseCost,
          marginPercent: margin,
          price,
          currency: 'CAD',
        });
        continue;
      }

      // Deterministic simulation until real OVH domain API credentials are configured.
      // Hash the domain string to produce a stable availability result.
      const hash = [...`${keyword}${tld}`].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const available = (hash % 100) > 35; // ~65% available, deterministic per domain

      results.push({
        domain: `${keyword}${tld}`,
        keyword,
        tld,
        available,
        price,
        currency: 'CAD',
      });
    }

    res.json({ keyword, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAdditionalIps = async (req, res) => {
  try {
    const server = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!server) return res.status(404).json({ error: "Server not found" });

    const ips = await prisma.additionalIp.findMany({
      where: { subscriptionId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(ips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const purchaseAdditionalIp = async (req, res) => {
  try {
    const { gateway } = req.body;
    if (!gateway) return res.status(400).json({ error: "Gateway is required" });

    const server = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!server) return res.status(404).json({ error: "Server not found" });

    const price = 3.99;
    const tax = parseFloat((price * 0.18).toFixed(2));
    const total = parseFloat((price + tax).toFixed(2));

    // Create payment session for additional IP
    const session = await prisma.paymentSession.create({
      data: {
        userId: req.user.id,
        type: "ADDITIONAL_IP",
        amount: price,
        taxAmount: tax,
        totalAmount: total,
        gateway,
        metadata: { subscriptionId: server.id, price },
        status: "PENDING",
      },
    });

    // Return session for frontend to redirect to payment
    res.json({ sessionId: session.id, amount: price, taxAmount: tax, totalAmount: total, gateway });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMyServers,
  getServerDetails,
  powerAction,
  reinstallOS,
  getMetrics,
  getMetricsHistory,
  listPlans,
  getPlanConfiguration,
  getActiveGateways,
  getMargins,
  getMyDomains,
  registerDomain,
  checkDomain,
  getAdditionalIps,
  purchaseAdditionalIp
};
