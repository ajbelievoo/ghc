const prisma = require("../prisma");
const ovhService = require("../services/ovhService");

const TAX_RATE = 0.18;

const createOrder = async (req, res) => {
  try {
    const { planCode, durationLabel, gateway, category, osTemplate } = req.body;

    const { finalPrice, currency } = await ovhService.getPricing(planCode, durationLabel);
    const taxAmount = parseFloat((finalPrice * TAX_RATE).toFixed(2));
    const totalAmount = parseFloat((finalPrice + taxAmount).toFixed(2));

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        amount: totalAmount,
        currency,
        gateway,
        planCode,
        durationLabel: durationLabel || '1_month',
        category: category || 'VPS',
      }
    });

    await prisma.systemLog.create({
      data: {
        type: "INFO",
        message: `Order created: ${planCode} for user ${req.user.id}`,
        details: { orderId: order.id, planCode, amount: totalAmount, gateway, category },
      }
    });

    res.json({ order, subtotal: finalPrice, taxAmount, totalAmount, taxRate: TAX_RATE });
  } catch (error) {
    await prisma.systemLog.create({
      data: { type: "ERROR", message: `Order creation failed: ${error.message}` },
    });
    res.status(500).json({ error: error.message });
  }
};

const getInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { order: true }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getWallet = async (req, res) => {
  try {
    let wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id }, include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: req.user.id, balance: 0, currency: 'CAD' }, include: { transactions: { take: 0 } } });
    }
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const depositWallet = async (req, res) => {
  // DEPRECATED: Wallet deposits must go through /api/payments/checkout and webhook validation
  res.status(400).json({ error: "Direct wallet deposits are disabled. Use the checkout flow." });
};

const payWithWallet = async (req, res) => {
  try {
    const { planCode, durationLabel, category, osTemplate } = req.body;
    const { finalPrice, currency } = await ovhService.getPricing(planCode, durationLabel);
    const taxAmount = parseFloat((finalPrice * TAX_RATE).toFixed(2));
    const totalAmount = parseFloat((finalPrice + taxAmount).toFixed(2));

    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet || wallet.balance < totalAmount) {
      return res.status(400).json({ error: "Insufficient wallet balance", required: totalAmount, available: wallet?.balance || 0 });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { userId: req.user.id },
      data: { balance: { decrement: totalAmount } }
    });

    await prisma.walletTransaction.create({
      data: { walletId: wallet.id, type: 'PAYMENT', amount: -totalAmount, description: `Payment for ${planCode} (inc. GST)`, metadata: { planCode, taxAmount, subtotal: finalPrice } }
    });

    const order = await prisma.order.create({
      data: { userId: req.user.id, amount: totalAmount, currency, gateway: 'WALLET', planCode, durationLabel: durationLabel || '1_month', category: category || 'VPS' }
    });

    await prisma.invoice.create({
      data: { orderId: order.id, userId: req.user.id, amount: totalAmount, dueDate: new Date(), status: "PAID" }
    });

    await ovhService.provisionSubscription({ ...order, osTemplate });

    await prisma.systemLog.create({
      data: {
        type: "INFO",
        message: `Wallet payment fulfilled: ${planCode} for user ${req.user.id}`,
        details: { orderId: order.id, planCode, amount: totalAmount, taxAmount },
      }
    });

    res.json({ order, wallet: updatedWallet, subtotal: finalPrice, taxAmount, totalAmount, message: "Paid with wallet and provisioned" });
  } catch (error) {
    await prisma.systemLog.create({
      data: { type: "ERROR", message: `Wallet payment failed: ${error.message}` },
    });
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createOrder, getInvoices, getWallet, depositWallet, payWithWallet };
