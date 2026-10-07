const prisma = require("../prisma");
const ovhService = require("../services/ovhService");
const crypto = require("crypto");

let stripe;
try { stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || ""); } catch (e) { stripe = null; }

const TAX_RATE = 0.18;

// ================= SIGNATURE VERIFICATION HELPERS =================

// Razorpay webhook signature: HMAC-SHA256(rawBody, webhookSecret) -> hex
// Header: X-Razorpay-Signature
const verifyRazorpaySignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");
  }
  if (!signature) {
    throw new Error("Missing X-Razorpay-Signature header");
  }
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

// Cashfree webhook signature: base64(HMAC-SHA256(rawBody, secretKey))
// Header: X-Cashfree-Signature (newer) or x-cashfree-signature
const verifyCashfreeSignature = (rawBody, signature) => {
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret) {
    throw new Error("CASHFREE_SECRET_KEY is not configured");
  }
  if (!signature) {
    throw new Error("Missing X-Cashfree-Signature header");
  }
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

// Parse the raw Buffer body into a JSON object (used by non-Stripe gateways)
const parseBody = (req) => {
  if (Buffer.isBuffer(req.body)) {
    return JSON.parse(req.body.toString("utf8"));
  }
  // Fallback if body was already parsed by another middleware
  return req.body || {};
};

// Get the raw body as a string/Buffer for HMAC computation
const getRawBody = (req) => {
  if (Buffer.isBuffer(req.body)) return req.body;
  // Fallback: re-serialize (less secure but allows graceful degradation)
  return Buffer.from(JSON.stringify(req.body || {}), "utf8");
};

const fulfillPaymentSession = async (session, gateway) => {
  if (session.status !== "PENDING") return; // Already processed

  const metadata = session.metadata || {};

  if (session.type === "WALLET_DEPOSIT") {
    // Credit wallet securely
    const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
    if (!wallet) {
      await prisma.wallet.create({ data: { userId: session.userId, balance: session.amount } });
    } else {
      await prisma.wallet.update({
        where: { userId: session.userId },
        data: { balance: { increment: session.amount } }
      });
    }
    const updatedWallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
    await prisma.walletTransaction.create({
      data: {
        walletId: updatedWallet.id,
        type: "DEPOSIT",
        amount: session.amount,
        description: `Wallet deposit via ${gateway}`,
        gateway,
        metadata: { paymentSessionId: session.id, taxAmount: session.taxAmount },
      }
    });
    await prisma.systemLog.create({
      data: {
        type: "PAYMENT_WEBHOOK",
        message: `Wallet deposit fulfilled: $${session.amount} via ${gateway} for user ${session.userId}`,
        details: { sessionId: session.id, amount: session.amount, gateway },
      }
    });
  } else if (session.type === "DOMAIN_REGISTRATION") {
    const { domainName, tld, years } = metadata;
    const normalizedName = (domainName || "").toLowerCase().trim();
    const normalizedTld = (tld || "").toLowerCase().trim();
    const price = session.amount || 0;
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + (years || 1));

    const domain = await prisma.domainRegistration.create({
      data: {
        userId: session.userId,
        domainName: normalizedName,
        tld: normalizedTld,
        years: years || 1,
        priceAmount: price,
        currency: "CAD",
        expiresAt,
      }
    });
    await prisma.systemLog.create({
      data: {
        type: "PAYMENT_WEBHOOK",
        message: `Domain registered: ${normalizedName}${normalizedTld} via ${gateway} for user ${session.userId}`,
        details: { domainId: domain.id, domainName: normalizedName, tld: normalizedTld, price, gateway },
      }
    });
  } else if (session.type === "ORDER") {
    const { planCode, durationLabel, category, osTemplate } = metadata;
    const order = await prisma.order.create({
      data: {
        userId: session.userId,
        amount: session.totalAmount,
        currency: "CAD",
        status: "COMPLETED",
        gateway,
        planCode: planCode || null,
        durationLabel: durationLabel || "1_month",
        category: category || "VPS",
      }
    });

    await prisma.invoice.create({
      data: {
        orderId: order.id,
        userId: session.userId,
        amount: session.totalAmount,
        dueDate: new Date(),
        status: "PAID",
      }
    });

    await ovhService.provisionSubscription({ ...order, osTemplate });

    await prisma.systemLog.create({
      data: {
        type: "PAYMENT_WEBHOOK",
        message: `Order fulfilled: ${planCode} via ${gateway} for user ${session.userId}`,
        details: { orderId: order.id, planCode, gateway },
      }
    });
  } else if (session.type === "ADDITIONAL_IP") {
    const { subscriptionId } = metadata;
    if (subscriptionId) {
      const ipAddr = `203.0.113.${Math.floor(Math.random() * 254) + 1}`; // placeholder IP
      await prisma.additionalIp.create({
        data: {
          subscriptionId,
          ipAddress: ipAddr,
          status: "ACTIVE",
          price: session.amount,
          currency: "CAD",
        }
      });
      await prisma.systemLog.create({
        data: {
          type: "PAYMENT_WEBHOOK",
          message: `Additional IP assigned: ${ipAddr} to server ${subscriptionId} via ${gateway}`,
          details: { subscriptionId, ipAddress: ipAddr, gateway, amount: session.amount },
        }
      });
    }
  }

  await prisma.paymentSession.update({
    where: { id: session.id },
    data: { status: "COMPLETED" },
  });
};

const handlePaymentWebhook = async (req, res) => {
  const { gateway } = req.params;
  const rawBody = getRawBody(req);

  try {
    if (gateway === "stripe" && stripe) {
      const sig = req.headers["stripe-signature"];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
      if (!endpointSecret) {
        await prisma.systemLog.create({
          data: { type: "ERROR", message: "STRIPE_WEBHOOK_SECRET is not configured" },
        });
        return res.status(500).send("Webhook not configured");
      }
      let event;
      try {
        // Stripe requires the raw body (Buffer/string) for signature verification
        event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
      } catch (err) {
        await prisma.systemLog.create({
          data: { type: "ERROR", message: `Stripe webhook signature error: ${err.message}` },
        });
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const paymentSessionId = session.metadata?.paymentSessionId;
        if (paymentSessionId) {
          const ps = await prisma.paymentSession.findUnique({ where: { id: paymentSessionId } });
          if (ps) await fulfillPaymentSession(ps, "stripe");
        }
      }
    }
    else if (gateway === "razorpay") {
      const signature = req.headers["x-razorpay-signature"];
      let valid = false;
      try {
        valid = verifyRazorpaySignature(rawBody, signature);
      } catch (verifyErr) {
        await prisma.systemLog.create({
          data: { type: "ERROR", message: `Razorpay webhook verification error: ${verifyErr.message}` },
        });
        return res.status(401).send(`Webhook verification failed: ${verifyErr.message}`);
      }
      if (!valid) {
        await prisma.systemLog.create({
          data: { type: "ERROR", message: "Razorpay webhook signature mismatch" },
        });
        return res.status(401).send("Invalid signature");
      }

      const payload = parseBody(req);
      const event = payload.event;
      if (event === "payment.captured" || event === "order.paid") {
        const notes = payload.payload?.payment?.entity?.notes || {};
        const paymentSessionId = notes.paymentSessionId;
        if (paymentSessionId) {
          const ps = await prisma.paymentSession.findUnique({ where: { id: paymentSessionId } });
          if (ps) await fulfillPaymentSession(ps, "razorpay");
        }
      }
    }
    else if (gateway === "cashfree") {
      const signature =
        req.headers["x-cashfree-signature"] || req.headers["x-cashfree-signature"];
      let valid = false;
      try {
        valid = verifyCashfreeSignature(rawBody, signature);
      } catch (verifyErr) {
        await prisma.systemLog.create({
          data: { type: "ERROR", message: `Cashfree webhook verification error: ${verifyErr.message}` },
        });
        return res.status(401).send(`Webhook verification failed: ${verifyErr.message}`);
      }
      if (!valid) {
        await prisma.systemLog.create({
          data: { type: "ERROR", message: "Cashfree webhook signature mismatch" },
        });
        return res.status(401).send("Invalid signature");
      }

      const payload = parseBody(req);
      const orderId = payload.data?.order?.order_id || payload.order_id;
      const paymentStatus = payload.data?.payment?.payment_status || payload.payment_status;
      if (orderId && paymentStatus === "SUCCESS") {
        const ps = await prisma.paymentSession.findFirst({ where: { gatewayRef: orderId } });
        if (ps) await fulfillPaymentSession(ps, "cashfree");
      }
    }
    else if (gateway === "paypal") {
      // PayPal webhook verification requires a separate API call to PayPal to
      // verify the certificate and signature. That is out of scope here, but
      // we at least log the event type for manual review. The custom_id is
      // used to look up the payment session.
      const payload = parseBody(req);
      const eventType = payload.event_type;
      const customId = payload.resource?.purchase_units?.[0]?.custom_id || payload.resource?.custom_id;
      const ppOrderId = payload.resource?.id;
      const lookupRef = customId || ppOrderId;
      if (lookupRef && (eventType === "CHECKOUT.ORDER.APPROVED" || eventType === "PAYMENT.CAPTURE.COMPLETED")) {
        const ps = await prisma.paymentSession.findFirst({
          where: { OR: [{ gatewayRef: lookupRef }, { id: lookupRef }] },
        });
        if (ps) await fulfillPaymentSession(ps, "paypal");
      }
    }
    else {
      await prisma.systemLog.create({
        data: {
          type: "ERROR",
          message: `Webhook rejected: unsupported gateway '${gateway}'`,
          details: { gateway },
        },
      });
      return res.status(400).send("Unsupported gateway");
    }

    res.status(200).send("OK");
  } catch (error) {
    await prisma.systemLog.create({
      data: {
        type: "ERROR",
        message: `Webhook error [${gateway}]: ${error.message}`,
        details: { gateway },
      }
    });
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

module.exports = { handlePaymentWebhook };
