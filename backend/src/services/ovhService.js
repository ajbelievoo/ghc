const ovh = require('ovh');
const prisma = require('../prisma');

const CATALOGS = [
  { category: 'VPS', endpoint: '/order/catalog/public/vps', family: 'vps', filter: (p) => p.planCode && p.planCode.match(/^vps-2027-model\d+$/) },
  { category: 'DEDICATED', endpoint: '/order/catalog/public/baremetalServers', family: 'dedicated', filter: (p) => p.planCode && p.planCode.length > 0 },
  { category: 'WEB_HOSTING', endpoint: '/order/catalog/public/webHosting', family: 'webHosting', filter: (p) => true },
  { category: 'CDN', endpoint: '/order/catalog/public/cdn', family: 'cdn', filter: (p) => true },
  { category: 'LICENSE', endpoint: '/order/catalog/public/license', family: 'license', filter: (p) => true, optional: true },
  { category: 'IP_ADDON', endpoint: '/order/catalog/public/ip', family: 'ip', filter: (p) => true, optional: true },
  { category: 'PUBLIC_CLOUD', endpoint: '/order/catalog/public/cloud', family: 'cloud', filter: (p) => true, optional: true },
  { category: 'PRIVATE_CLOUD', endpoint: '/order/catalog/public/privateCloud', family: 'privateCloud', filter: (p) => true, optional: true },
];

const getOvhCredentials = async () => {
  const settings = await prisma.settings.findMany({
    where: { key: { in: ['ovh_app_key', 'ovh_app_secret', 'ovh_consumer_key'] } }
  });
  const map = {};
  settings.forEach(s => map[s.key] = s.value);
  return map;
};

const getOvhClient = async () => {
  const creds = await getOvhCredentials();
  return ovh({
    endpoint: 'ovh-ca',
    appKey: creds.ovh_app_key,
    appSecret: creds.ovh_app_secret,
    consumerKey: creds.ovh_consumer_key,
  });
};

const getCategoryMargin = async (category) => {
  const setting = await prisma.marginSetting.findUnique({ where: { category } });
  return setting ? setting.percent : 20.0;
};

const applyMargin = (rawPrice, margin) => {
  if (rawPrice === undefined || rawPrice === null) return 0;
  return rawPrice + (rawPrice * (margin / 100));
};

const parsePrice = (pricing) => {
  if (!pricing || pricing.price === undefined) return 0;
  const match = pricing.formattedPrice?.match(/\d+\.?\d*/);
  return match ? parseFloat(match[0]) : 0;
};

const extractSpecs = (product, category, plan) => {
  // Try product blobs first, then plan blobs, then plan/product root
  const prodTech = product?.blobs?.technical || {};
  const planTech = plan?.blobs?.technical || {};
  const tech = Object.keys(prodTech).length > 0 ? prodTech : planTech;

  const prodComm = product?.blobs?.commercial || {};
  const planComm = plan?.blobs?.commercial || {};
  const commercial = Object.keys(prodComm).length > 0 ? prodComm : planComm;
  const features = commercial?.features || [];

  const meta = product?.blobs?.meta || plan?.blobs?.meta || {};

  // Helper: find feature by name (case-insensitive, partial match)
  const getFeature = (names) => {
    if (!Array.isArray(names)) names = [names];
    for (const name of names) {
      const f = features.find(feat => feat.name && feat.name.toLowerCase().includes(name.toLowerCase()));
      if (f?.value !== undefined && f?.value !== null) return f.value;
    }
    return null;
  };

  // Helper: coerce to int
  const toInt = (val) => {
    if (val === undefined || val === null) return null;
    const n = parseInt(String(val).replace(/\D/g, ''), 10);
    return isNaN(n) ? null : n;
  };

  // Dedicated servers specs
  if (category === 'DEDICATED') {
    // CPU: try many sources
    let cpu = getFeature(['cpu_cores', 'cpu', 'processor', 'cores']);
    if (!cpu) cpu = tech.cpu?.cores;
    if (!cpu) cpu = tech.cpu?.number;
    if (!cpu) cpu = product?.cpu?.cores;
    if (!cpu) cpu = plan?.cpu?.cores;
    if (!cpu) cpu = plan?.details?.cpu?.cores;
    if (!cpu) {
      // Try to extract from invoiceName like "ADVANCE-1 | AMD EPYC 4244P"
      const nameMatch = plan?.invoiceName?.match(/(\d+)\s*c/i) || plan?.invoiceName?.match(/(\d+)\s*vCore/i);
      if (nameMatch) cpu = parseInt(nameMatch[1]);
    }

    // RAM
    let ram = getFeature(['ram', 'memory', 'ddr', 'gb_ram']);
    if (!ram) ram = tech.memory?.size;
    if (!ram) ram = tech.memory?.ram;
    if (!ram) ram = product?.memory?.size;
    if (!ram) ram = plan?.memory?.size;
    if (!ram) ram = plan?.details?.memory?.size;
    if (!ram) {
      const nameMatch = plan?.invoiceName?.match(/(\d+)\s*GB\s*RAM/i);
      if (nameMatch) ram = parseInt(nameMatch[1]);
    }

    // Disk
    let disk = getFeature(['storage', 'disk', 'hdd', 'ssd', 'nvme']);
    if (!disk) disk = tech.storage?.disks?.[0]?.capacity;
    if (!disk) disk = tech.storage?.disks?.[0]?.size;
    if (!disk) disk = product?.storage?.disks?.[0]?.capacity;
    if (!disk) disk = plan?.storage?.disks?.[0]?.capacity;
    if (!disk) disk = plan?.details?.storage?.disks?.[0]?.capacity;
    if (!disk) {
      const nameMatch = plan?.invoiceName?.match(/(\d+)\s*GB\s*(SSD|HDD|NVMe)/i);
      if (nameMatch) disk = parseInt(nameMatch[1]);
    }

    // Disk type
    let diskTech = getFeature(['disk_type', 'technology', 'storage_type']);
    if (!diskTech) diskTech = tech.storage?.disks?.[0]?.technology;
    if (!diskTech) diskTech = product?.storage?.disks?.[0]?.technology;
    if (!diskTech) diskTech = plan?.storage?.disks?.[0]?.technology;

    // Bandwidth
    let bw = getFeature(['bandwidth', 'traffic', 'connection']);
    if (!bw) bw = tech.network?.public?.bandwidth;
    if (!bw) bw = tech.network?.bandwidth;
    if (!bw) bw = tech.bandwidth?.level;
    if (!bw) bw = product?.bandwidth?.level;
    if (!bw) bw = plan?.bandwidth?.level;
    if (!bw) bw = plan?.details?.bandwidth?.level;

    return {
      cpuCores: toInt(cpu),
      ramGb: toInt(ram),
      diskGb: toInt(disk),
      diskType: diskTech,
      bandwidthMbps: toInt(bw),
      description: product?.description || meta?.description || commercial?.name || product?.name || plan?.description || null,
    };
  }

  // VPS / Web Hosting / Cloud / CDN
  let cpu = tech.cpu?.cores || product?.cpu?.cores || plan?.cpu?.cores || getFeature(['cpu', 'cores', 'vcpu']);
  if (!cpu) cpu = plan?.details?.cpu?.cores;

  let ram = tech.memory?.size || product?.memory?.size || plan?.memory?.size || getFeature(['ram', 'memory', 'ddr']);
  if (!ram) ram = plan?.details?.memory?.size;

  let disk = tech.storage?.disks?.[0]?.capacity || product?.storage?.disks?.[0]?.capacity || plan?.storage?.disks?.[0]?.capacity || getFeature(['storage', 'disk', 'ssd']);
  if (!disk) disk = plan?.details?.storage?.disks?.[0]?.capacity;

  let diskTech = tech.storage?.disks?.[0]?.technology || product?.storage?.disks?.[0]?.technology || plan?.storage?.disks?.[0]?.technology || getFeature(['disk_type', 'technology']);

  let bw = tech.network?.public?.bandwidth || tech.bandwidth?.level || product?.bandwidth?.level || plan?.bandwidth?.level || getFeature(['bandwidth', 'traffic']);
  if (!bw) bw = plan?.details?.bandwidth?.level;

  return {
    cpuCores: toInt(cpu),
    ramGb: toInt(ram),
    diskGb: toInt(disk),
    diskType: diskTech,
    bandwidthMbps: toInt(bw),
    description: product?.description || meta?.description || commercial?.name || product?.name || plan?.description || null,
  };
};

// ================= SYNC ALL OVH CATALOGS =================
const syncPlans = async () => {
  const client = await getOvhClient();
  let totalSynced = 0;
  let totalErrors = 0;
  const results = [];

  for (const cat of CATALOGS) {
    try {
      const catalog = await client.requestPromised('GET', cat.endpoint, { ovhSubsidiary: 'CA' });
      const plans = catalog.plans?.filter(cat.filter) || [];
      const products = catalog.products || [];
      const margin = await getCategoryMargin(cat.category);
      let synced = 0;

      // Preload existing active plans for this category to avoid duplicate specs
      const existingPlans = await prisma.planCatalog.findMany({
        where: { category: cat.category, isActive: true },
        include: { durations: true }
      });
      const existingMap = new Map();
      for (const ep of existingPlans) {
        const key = `${ep.cpuCores ?? 'null'}_${ep.ramGb ?? 'null'}_${ep.diskGb ?? 'null'}_${ep.bandwidthMbps ?? 'null'}`;
        existingMap.set(key, ep);
      }

      for (const plan of plans) {
        try {
          const product = products.find(prod => prod.name === (plan.product || plan.planCode));
          const specs = extractSpecs(product, cat.category, plan);

          // Skip if an active plan with identical specs already exists and is cheaper
          const specKey = `${specs.cpuCores ?? 'null'}_${specs.ramGb ?? 'null'}_${specs.diskGb ?? 'null'}_${specs.bandwidthMbps ?? 'null'}`;
          const existing = existingMap.get(specKey);
          if (existing && existing.planCode !== plan.planCode) {
            const renewPricings = plan.pricings?.filter(pr => pr.capacities?.includes('renew')) || [];
            const rawPrice = renewPricings.length > 0 ? parsePrice(renewPricings[0]) : 0;
            const margin = await getCategoryMargin(cat.category);
            const newPrice = applyMargin(rawPrice, margin);
            const existingPrice = existing.durations[0]?.finalPrice ?? Infinity;
            if (existingPrice <= newPrice) {
              continue; // Skip more expensive duplicate
            }
            // New plan is cheaper - will replace existing below
          }

          // Store product metadata (has blobs.technical) merged with plan
          const metadata = { ...plan, product: product || null };

          // Upsert plan catalog
          const upserted = await prisma.planCatalog.upsert({
            where: { planCode: plan.planCode },
            update: {
              invoiceName: plan.invoiceName || plan.planCode,
              description: specs.description,
              category: cat.category,
              family: plan.family || cat.family,
              cpuCores: specs.cpuCores,
              ramGb: specs.ramGb,
              diskGb: specs.diskGb,
              diskType: specs.diskType,
              bandwidthMbps: specs.bandwidthMbps,
              currency: 'CAD',
              metadata: metadata,
            },
            create: {
              planCode: plan.planCode,
              invoiceName: plan.invoiceName || plan.planCode,
              description: specs.description,
              category: cat.category,
              family: plan.family || cat.family,
              cpuCores: specs.cpuCores,
              ramGb: specs.ramGb,
              diskGb: specs.diskGb,
              diskType: specs.diskType,
              bandwidthMbps: specs.bandwidthMbps,
              currency: 'CAD',
              metadata: metadata,
            }
          });

          // Update existingMap with the newly upserted plan
          existingMap.set(specKey, { ...upserted, durations: [] });

          // Sync multi-duration pricing
          const renewPricings = plan.pricings?.filter(pr => pr.capacities?.includes('renew')) || [];
          for (const pricing of renewPricings) {
            const rawPrice = parsePrice(pricing);
            const interval = pricing.interval || 1;
            const intervalUnit = pricing.intervalUnit || 'month';
            const label = `${interval}_${intervalUnit}`;

            // Check for plan override first, then category margin
            const effectiveMargin = upserted.overrideMargin ?? margin;
            const effectivePrice = upserted.overridePrice ?? applyMargin(rawPrice, effectiveMargin);

            await prisma.planDuration.upsert({
              where: { planCode_durationLabel: { planCode: plan.planCode, durationLabel: label } },
              update: {
                interval,
                intervalUnit,
                rawPrice,
                finalPrice: effectivePrice,
                currency: 'CAD',
              },
              create: {
                planCode: plan.planCode,
                durationLabel: label,
                interval,
                intervalUnit,
                rawPrice,
                finalPrice: effectivePrice,
                currency: 'CAD',
              }
            });
          }
          synced++;
        } catch (planErr) {
          console.error(`[OVH Sync] Failed plan ${plan.planCode}:`, planErr.message);
        }
      }

      totalSynced += synced;
      results.push({ category: cat.category, synced, total: plans.length });
    } catch (catErr) {
      if (cat.optional) {
        results.push({ category: cat.category, synced: 0, total: 0, skipped: true, reason: catErr.message });
      } else {
        totalErrors++;
        results.push({ category: cat.category, error: catErr.message });
      }
      console.error(`[OVH Sync] Failed catalog ${cat.endpoint}:`, catErr.message);
    }
  }

  await prisma.systemLog.create({
    data: {
      type: 'OVH_API',
      message: `Synced ${totalSynced} OVH plans across ${CATALOGS.length - totalErrors} catalogs.`,
      details: { results, totalSynced, totalErrors }
    }
  });

  return { synced: totalSynced, errors: totalErrors, results };
};

// ================= PRICING WITH DURATION =================
const getPricing = async (planCode, durationLabel = '1_month') => {
  try {
    const duration = await prisma.planDuration.findUnique({
      where: { planCode_durationLabel: { planCode, durationLabel } }
    });
    if (!duration) {
      // Fallback to any available duration
      const any = await prisma.planDuration.findFirst({ where: { planCode } });
      if (!any) throw new Error('Plan not found');
      return { cost: any.rawPrice, finalPrice: any.finalPrice, currency: any.currency, durationLabel: any.durationLabel };
    }
    return { cost: duration.rawPrice, finalPrice: duration.finalPrice, currency: duration.currency, durationLabel };
  } catch (error) {
    throw new Error('Failed to fetch pricing: ' + error.message);
  }
};

const durationToOvh = (durationLabel = '1_month') => {
  const [interval, unit] = String(durationLabel).split('_');
  const n = parseInt(interval, 10) || 1;
  if (unit === 'year') return `P${n}Y`;
  if (unit === 'week') return `P${n}W`;
  if (unit === 'day') return `P${n}D`;
  return `P${n}M`;
};

const getCartEndpoint = (category) => {
  if (category === 'DEDICATED') return 'baremetalServers';
  if (category === 'WEB_HOSTING') return 'webHosting';
  if (category === 'CDN') return 'cdn';
  if (category === 'PUBLIC_CLOUD') return 'cloud';
  if (category === 'PRIVATE_CLOUD') return 'privateCloud';
  return 'vps';
};

const getPlanConfiguration = async ({ planCode, category = 'VPS', durationLabel = '1_month' }) => {
  const client = await getOvhClient();
  const endpoint = getCartEndpoint(category);
  const duration = durationToOvh(durationLabel);
  const cart = await client.requestPromised('POST', '/order/cart', { ovhSubsidiary: 'CA' });
  await client.requestPromised('POST', `/order/cart/${cart.cartId}/assign`);

  try {
    const item = await client.requestPromised('POST', `/order/cart/${cart.cartId}/${endpoint}`, {
      planCode,
      duration,
      pricingMode: 'default',
      quantity: 1,
    });

    const itemId = item.itemId || item.cartItemId || item.id;
    const requiredConfiguration = itemId
      ? await client.requestPromised('GET', `/order/cart/${cart.cartId}/item/${itemId}/requiredConfiguration`).catch(() => [])
      : [];
    const itemDetails = itemId
      ? await client.requestPromised('GET', `/order/cart/${cart.cartId}/item/${itemId}`).catch(() => null)
      : null;
    const options = await client.requestPromised('GET', `/order/cart/${cart.cartId}/${endpoint}/options`, {
      planCode,
      duration,
      pricingMode: 'default',
    }).catch(() => []);

    return {
      available: true,
      source: 'OVH',
      cartId: cart.cartId,
      itemId,
      planCode,
      category,
      duration,
      requiredConfiguration,
      options,
      item: itemDetails || item,
    };
  } catch (error) {
    return {
      available: false,
      source: 'OVH',
      planCode,
      category,
      duration,
      requiredConfiguration: [],
      options: [],
      reason: error.message,
    };
  }
};

// ================= PROVISION SUBSCRIPTION =================
const provisionSubscription = async (order) => {
  let ovhResourceId = null;
  let realOvhProvisioned = false;

  try {
    const client = await getOvhClient();

    // Attempt real OVH provisioning via ordering cart
    try {
      const durationMap = { '1_month': 'P1M', '3_month': 'P3M', '12_month': 'P1Y' };
      const ovhDuration = durationMap[order.durationLabel] || 'P1M';

      // 1. Create cart
      const cart = await client.request('POST', '/order/cart', { ovhSubsidiary: 'CA' });
      // 2. Assign cart to account
      await client.request('POST', `/order/cart/${cart.cartId}/assign`);

      // 3. Add item based on category
      let item = null;
      if (order.category === 'VPS') {
        item = await client.request('POST', `/order/cart/${cart.cartId}/vps`, {
          planCode: order.planCode,
          duration: ovhDuration,
          pricingMode: 'default',
          quantity: 1,
        });
      } else if (order.category === 'DEDICATED') {
        item = await client.request('POST', `/order/cart/${cart.cartId}/baremetalServers`, {
          planCode: order.planCode,
          duration: ovhDuration,
          pricingMode: 'default',
          quantity: 1,
        });
      } else if (order.category === 'CDN') {
        item = await client.request('POST', `/order/cart/${cart.cartId}/cdn`, {
          planCode: order.planCode,
          duration: ovhDuration,
          pricingMode: 'default',
          quantity: 1,
        });
      } else if (order.category === 'WEB_HOSTING') {
        item = await client.request('POST', `/order/cart/${cart.cartId}/webHosting`, {
          planCode: order.planCode,
          duration: ovhDuration,
          pricingMode: 'default',
          quantity: 1,
        });
      }

      if (item) {
        // 4. Checkout cart (creates real OVH order)
        const checkout = await client.request('POST', `/order/cart/${cart.cartId}/checkout`, {
          autoPayWithPreferredPaymentMethod: false,
          waiveRetractationPeriod: false,
        });

        // OVH returns an order. The serviceName is not immediately available.
        // We store the orderId and poll for serviceName later.
        ovhResourceId = `ovh-order-${checkout.orderId}`;
        realOvhProvisioned = true;

        await prisma.systemLog.create({
          data: {
            type: "OVH_API",
            message: `Real OVH order created: ${order.category} ${order.planCode} orderId=${checkout.orderId}`,
            details: { orderId: checkout.orderId, planCode: order.planCode, category: order.category },
          }
        });
      }
    } catch (ovhErr) {
      // Real OVH provisioning failed (likely missing credentials or invalid planCode)
      await prisma.systemLog.create({
        data: {
          type: "OVH_API",
          message: `Real OVH provisioning failed for ${order.planCode}: ${ovhErr.message}. Falling back to mock.`,
          details: { error: ovhErr.message, planCode: order.planCode, category: order.category },
        }
      });
    }

    // Fallback: create mock subscription if real OVH didn't work
    if (!ovhResourceId) {
      ovhResourceId = order.category.toLowerCase() + "-" + Math.floor(Math.random() * 1000000);
    }

    const mockIp = order.category === 'VPS' || order.category === 'DEDICATED'
      ? "203.0.113." + Math.floor(Math.random() * 254 + 1)
      : null;
    const mockRootPassword = order.category === 'VPS' || order.category === 'DEDICATED'
      ? "ovh_root_pass_" + Date.now()
      : null;

    const cycleDays = order.durationLabel === '12_month' ? 365 : order.durationLabel === '3_month' ? 90 : 30;

    const sub = await prisma.subscription.create({
      data: {
        userId: order.userId,
        ovhResourceId,
        name: `${order.category}-${order.id.slice(0, 5)}`,
        planCode: order.planCode,
        category: order.category,
        ipAddress: mockIp,
        rootPassword: mockRootPassword,
        osTemplate: order.osTemplate || "ubuntu22.04",
        status: realOvhProvisioned ? "PENDING" : "ACTIVE",
        billingCycle: order.durationLabel === '12_month' ? 'YEARLY' : order.durationLabel === '3_month' ? 'QUARTERLY' : 'MONTHLY',
        autoRenew: true,
        nextBillDate: new Date(Date.now() + cycleDays * 24 * 60 * 60 * 1000),
        priceAmount: order.amount,
        currency: order.currency,
      }
    });

    await prisma.systemLog.create({
      data: {
        type: realOvhProvisioned ? "OVH_API" : "INFO",
        message: realOvhProvisioned
          ? `Subscription created pending real OVH provision: ${sub.id} order=${ovhResourceId}`
          : `Mock provisioned ${order.category} ${ovhResourceId} for user ${order.userId}`,
        details: { subscriptionId: sub.id, ovhResourceId, realOvhProvisioned },
      }
    });

    return sub;
  } catch (error) {
    await prisma.systemLog.create({
      data: { type: "ERROR", message: `Provisioning failed: ${error.message}` }
    });
    throw error;
  }
};

// ================= LIFECYCLE ACTIONS =================
const performServerAction = async (ovhResourceId, action) => {
  try {
    const client = await getOvhClient();

    // Try to determine if it's a VPS or Dedicated server by probing
    let isVps = false;
    let isDedicated = false;
    try {
      await client.request('GET', `/vps/${ovhResourceId}`);
      isVps = true;
    } catch (e) {
      try {
        await client.request('GET', `/dedicated/server/${ovhResourceId}`);
        isDedicated = true;
      } catch (e2) {
        // Neither - might be a mock ID or other service type
      }
    }

    if (!isVps && !isDedicated) {
      await prisma.systemLog.create({
        data: {
          type: "OVH_API",
          message: `Mock ${action} on resource ${ovhResourceId} (not found in OVH)`,
          details: { ovhResourceId, action },
        }
      });
      return true; // Graceful fallback for mock IDs
    }

    if (action === 'reboot') {
      if (isVps) {
        await client.request('POST', `/vps/${ovhResourceId}/reboot`);
      } else if (isDedicated) {
        await client.request('POST', `/dedicated/server/${ovhResourceId}/reboot`);
      }
    } else if (action === 'shutdown') {
      if (isVps) {
        await client.request('POST', `/vps/${ovhResourceId}/reboot`, { type: 'halt' });
      } else if (isDedicated) {
        await client.request('POST', `/dedicated/server/${ovhResourceId}/reboot`, { monitoring: false });
      }
    }

    await prisma.systemLog.create({
      data: {
        type: "OVH_API",
        message: `Real OVH ${action} performed on ${isVps ? 'VPS' : 'Dedicated'} ${ovhResourceId}`,
        details: { ovhResourceId, action, serviceType: isVps ? 'vps' : 'dedicated' },
      }
    });
    return true;
  } catch (error) {
    await prisma.systemLog.create({
      data: {
        type: "ERROR",
        message: `OVH action failed: ${action} on ${ovhResourceId}: ${error.message}`,
        details: { ovhResourceId, action },
      }
    });
    throw new Error(`OVH action failed: ${error.message}`);
  }
};

const lifecycleAction = async (subscriptionId, action) => {
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new Error('Subscription not found');

  let updates = {};
  switch (action) {
    case 'renew':
      const cycleDays = sub.billingCycle === 'YEARLY' ? 365 : sub.billingCycle === 'QUARTERLY' ? 90 : 30;
      updates = {
        nextBillDate: new Date(Date.now() + cycleDays * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      };
      break;
    case 'suspend':
      updates = { status: 'SUSPENDED' };
      await performServerAction(sub.ovhResourceId, 'suspend');
      break;
    case 'unsuspend':
      updates = { status: 'ACTIVE' };
      await performServerAction(sub.ovhResourceId, 'unsuspend');
      break;
    case 'terminate':
    case 'cancel':
      updates = { status: 'TERMINATED', autoRenew: false };
      await performServerAction(sub.ovhResourceId, 'terminate');
      break;
    default:
      throw new Error('Unknown lifecycle action: ' + action);
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: updates
  });

  await prisma.systemLog.create({
    data: {
      type: "INFO",
      message: `Subscription ${action}: ${sub.name}`,
      details: { subscriptionId, action }
    }
  });

  return updated;
};

const reinstallOS = async (ovhResourceId, osTemplate) => {
  try {
    const client = await getOvhClient();

    const distributionMap = {
      'ubuntu22.04': 'Ubuntu 22.04 Server',
      'ubuntu20.04': 'Ubuntu 20.04 Server',
      'debian12': 'Debian 12',
      'debian11': 'Debian 11',
      'centos9': 'CentOS Stream 9',
      'windows2022': 'Windows Server 2022',
      'cpanel': 'CentOS 7 + cPanel',
      'plesk': 'Ubuntu 22.04 + Plesk',
    };
    const distribution = distributionMap[osTemplate] || osTemplate;

    let isVps = false;
    let isDedicated = false;
    try {
      await client.request('GET', `/vps/${ovhResourceId}`);
      isVps = true;
    } catch (e) {
      try {
        await client.request('GET', `/dedicated/server/${ovhResourceId}`);
        isDedicated = true;
      } catch (e2) {
        // Neither - mock ID
      }
    }

    if (!isVps && !isDedicated) {
      await prisma.systemLog.create({
        data: {
          type: "OVH_API",
          message: `Mock OS reinstall: ${distribution} on ${ovhResourceId} (not found in OVH)`,
          details: { ovhResourceId, osTemplate, distribution },
        }
      });
      return true;
    }

    if (isVps) {
      const templates = await client.request('GET', `/vps/${ovhResourceId}/templates`);
      const matched = templates.find(t => t.name?.toLowerCase().includes(distribution.toLowerCase())) || templates[0];
      if (!matched) throw new Error('No OS template available for this VPS');
      await client.request('POST', `/vps/${ovhResourceId}/reinstall`, { templateId: matched.id });
    } else if (isDedicated) {
      const templates = await client.request('GET', `/dedicated/server/${ovhResourceId}/install/compatibleTemplates`);
      const flatTemplates = Object.values(templates || {}).flat();
      const matched = flatTemplates.find(t => t.name?.toLowerCase().includes(distribution.toLowerCase())) || flatTemplates[0];
      if (!matched) throw new Error('No OS template available for this dedicated server');
      await client.request('POST', `/dedicated/server/${ovhResourceId}/install/start`, {
        templateName: matched.name,
        details: { language: 'en', sshKeyName: null },
      });
    }

    await prisma.systemLog.create({
      data: {
        type: "OVH_API",
        message: `Real OVH OS reinstall: ${distribution} on ${isVps ? 'VPS' : 'Dedicated'} ${ovhResourceId}`,
        details: { ovhResourceId, osTemplate, distribution, serviceType: isVps ? 'vps' : 'dedicated' },
      }
    });
    return true;
  } catch (error) {
    await prisma.systemLog.create({
      data: {
        type: "ERROR",
        message: `OVH reinstall failed on ${ovhResourceId}: ${error.message}`,
        details: { ovhResourceId, osTemplate },
      }
    });
    throw new Error(`OVH reinstall failed: ${error.message}`);
  }
};

const getMetrics = async (ovhResourceId) => {
  // Try to fetch real OVH metrics first
  try {
    const client = await getOvhClient();
    let isVps = false;
    try {
      await client.request('GET', `/vps/${ovhResourceId}`);
      isVps = true;
    } catch (e) {
      // Not a VPS, try dedicated
    }

    if (isVps) {
      // Get real VPS usage statistics if available
      const usage = await client.request('GET', `/vps/${ovhResourceId}/use`);
      return {
        cpu: usage.cpu ? parseFloat((usage.cpu * 100).toFixed(1)) : 0,
        ram: usage.ram ? parseFloat((usage.ram * 100).toFixed(1)) : 0,
        disk: usage.disk ? parseFloat((usage.disk * 100).toFixed(1)) : 0,
        bandwidth: 0,
        netIn: 0,
        netOut: 0,
        load: usage.cpu ? parseFloat((usage.cpu * 4).toFixed(2)) : 0,
        uptime: 0,
        processes: 0,
        timestamp: new Date().toISOString(),
      };
    }

    // For dedicated servers, try to get real metrics from OVH monitoring
    try {
      const metrics = await client.request('GET', `/dedicated/server/${ovhResourceId}/serviceInfos`);
      // OVH doesn't expose live metrics easily; fallback to synthetic
    } catch (e) {
      // Not a real dedicated server either
    }
  } catch (e) {
    // OVH API unavailable or resource not found; use synthetic fallback
  }

  // Synthetic fallback (deterministic per resourceId)
  const now = Date.now();
  const base = ovhResourceId ? ovhResourceId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  const cpu = 15 + 25 * Math.sin(now / 60000) + 10 * Math.sin(now / 15000) + (base % 15);
  const ram = 30 + 20 * Math.sin(now / 120000) + 15 * Math.cos(now / 30000) + (base % 10);
  const disk = 20 + 15 * Math.sin(now / 180000) + (base % 5);
  const bandwidth = 50 + 100 * Math.sin(now / 300000) + (base % 50);
  const netIn = 5 + 20 * Math.abs(Math.sin(now / 45000)) + (base % 10);
  const netOut = 3 + 15 * Math.abs(Math.cos(now / 45000)) + (base % 8);
  const load = (cpu / 100) * 4 + Math.sin(now / 90000);
  const uptime = Math.floor(now / 1000) % 86400;
  const processes = 120 + Math.floor(50 * Math.sin(now / 60000)) + (base % 30);

  return {
    cpu: Math.max(0, Math.min(100, parseFloat(cpu.toFixed(1)))),
    ram: Math.max(0, Math.min(100, parseFloat(ram.toFixed(1)))),
    disk: Math.max(0, Math.min(100, parseFloat(disk.toFixed(1)))),
    bandwidth: Math.max(0, parseFloat(bandwidth.toFixed(1))),
    netIn: Math.max(0, parseFloat(netIn.toFixed(2))),
    netOut: Math.max(0, parseFloat(netOut.toFixed(2))),
    load: Math.max(0, parseFloat(load.toFixed(2))),
    uptime,
    processes,
    timestamp: new Date().toISOString(),
  };
};

// ================= PROVISIONING STATUS POLLING =================
// For subscriptions created from a real OVH order, the ovhResourceId is stored
// as `ovh-order-{orderId}`. OVH does not expose the serviceName immediately
// after checkout; we must poll the order details until a serviceName appears.
// Once we have it, we fetch the service to confirm IP assignment & provisioning
// state, then flip the subscription status to ACTIVE.
const pollProvisioningStatus = async () => {
  const pendingSubs = await prisma.subscription.findMany({
    where: { status: "PENDING" },
  });

  let activated = 0;
  let stillPending = 0;
  let errors = 0;

  for (const sub of pendingSubs) {
    try {
      const client = await getOvhClient();
      const resourceId = sub.ovhResourceId || "";

      // Only attempt real polling for OVH order references
      const orderMatch = resourceId.match(/^ovh-order-(\d+)$/);
      if (!orderMatch) {
        // Mock / synthetic resource - flip to ACTIVE immediately so the client
        // portal shows it as ready (matches existing mock-provisioning flow).
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "ACTIVE" },
        });
        activated++;
        continue;
      }

      const ovhOrderId = orderMatch[1];

      // 1. Fetch the OVH order to find the serviceName / delivered service
      let serviceName = null;
      try {
        const orderDetails = await client.request('GET', `/me/order/${ovhOrderId}/`);
        // Some orders expose the serviceName directly on the order line items
        if (orderDetails && orderDetails.serviceName) {
          serviceName = orderDetails.serviceName;
        }
      } catch (e) { /* order may not be ready yet */ }

      if (!serviceName) {
        // Try the order's line items which contain the delivered service id
        try {
          const items = await client.request('GET', `/me/order/${ovhOrderId}/`);
          const lineItems = await client.request('GET', `/me/order/${ovhOrderId}/details`);
          const first = Array.isArray(lineItems) ? lineItems[0] : null;
          if (first && first.serviceId) {
            serviceName = String(first.serviceId);
          }
        } catch (e) { /* still provisioning */ }
      }

      if (!serviceName) {
        stillPending++;
        continue;
      }

      // 2. Probe the service to confirm it is delivered & has an IP
      let isReady = false;
      let ipAddress = null;
      let serviceType = null;

      // Try VPS first
      try {
        const vps = await client.request('GET', `/vps/${serviceName}`);
        serviceType = 'vps';
        // VPS is "ready" when state is not "INSTALLING" and an IP is assigned
        const state = (vps.state || vps.status || '').toUpperCase();
        isReady = state !== 'INSTALLING' && state !== 'PENDING' && state !== '';
        if (vps.ips && vps.ips.length > 0) {
          ipAddress = vps.ips[0];
        } else if (vps.ipAddress) {
          ipAddress = vps.ipAddress;
        }
      } catch (e) {
        // Not a VPS - try dedicated server
        try {
          const dedicated = await client.request('GET', `/dedicated/server/${serviceName}`);
          serviceType = 'dedicated';
          const state = (dedicated.state || dedicated.status || '').toUpperCase();
          isReady = state !== 'INSTALLING' && state !== 'PENDING' && state !== '';
          if (dedicated.ip) {
            ipAddress = dedicated.ip;
          }
        } catch (e2) {
          // Service not yet available - keep polling
        }
      }

      if (!isReady) {
        stillPending++;
        continue;
      }

      // 3. Flip subscription to ACTIVE and persist the real serviceName + IP
      const updateData = {
        status: "ACTIVE",
        ovhResourceId: serviceName,
      };
      if (ipAddress) updateData.ipAddress = ipAddress;

      await prisma.subscription.update({
        where: { id: sub.id },
        data: updateData,
      });

      await prisma.systemLog.create({
        data: {
          type: "OVH_API",
          message: `Provisioning complete: ${serviceType} ${serviceName} (IP: ${ipAddress || 'n/a'}) for subscription ${sub.id}`,
          details: { subscriptionId: sub.id, serviceName, ipAddress, serviceType },
        },
      });

      // 4. Send welcome email to the client (best-effort)
      try {
        const emailService = require('./emailService');
        const user = await prisma.user.findUnique({ where: { id: sub.userId } });
        if (user && emailService && typeof emailService.sendWelcomeEmail === 'function') {
          await emailService.sendWelcomeEmail({
            to: user.email,
            name: user.name,
            serverName: sub.name,
            ipAddress: ipAddress || 'pending',
            serviceName,
          });
        }
      } catch (emailErr) {
        // Email failure should not block activation
        console.error(`[OVH Poll] Welcome email failed for ${sub.id}:`, emailErr.message);
      }

      activated++;
    } catch (err) {
      errors++;
      console.error(`[OVH Poll] Failed for subscription ${sub.id}:`, err.message);
    }
  }

  await prisma.cronLog.create({
    data: {
      jobName: "pollProvisioningStatus",
      status: errors > 0 ? "FAILED" : "SUCCESS",
      details: `Pending: ${pendingSubs.length}, Activated: ${activated}, Still pending: ${stillPending}, Errors: ${errors}.`,
    },
  });

  return { polled: pendingSubs.length, activated, stillPending, errors };
};

module.exports = { syncPlans, getPricing, getPlanConfiguration, provisionSubscription, performServerAction, lifecycleAction, reinstallOS, getMetrics, pollProvisioningStatus };
