const prisma = require("../prisma");
const ovhService = require("../services/ovhService");
const https = require("https");

let stripe, razorpay;
try { stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || ""); } catch (e) { stripe = null; }
try {
  const Razorpay = require("razorpay");
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (keyId && keySecret) {
    razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  } else {
    razorpay = null;
  }
} catch (e) { razorpay = null; }

const TAX_RATE = 0.18;

// Helper for native HTTPS JSON POST
const httpsPost = (url, headers, body) => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), ...headers },
    };
    const req = https.request(options, (res) => {
      let chunks = "";
      res.on("data", (d) => chunks += d);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
};

const httpsGet = (url, headers) => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: { ...headers },
    };
    const req = https.request(options, (res) => {
      let chunks = "";
      res.on("data", (d) => chunks += d);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    req.on("error", reject);
    req.end();
  });
};

const getErrorMessage = (error) => {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  if (error?.error?.description) return error.error.description;
  if (error?.description) return error.description;
  return JSON.stringify(error);
};

const getGatewayConfig = async (name) => {
  return await prisma.gatewayConfig.findUnique({ where: { name } });
};

const createCheckoutSession = async (req, res) => {
  try {
    const { type, amount, gateway, planCode, durationLabel, category, osTemplate } = req.body;
    if (!type || !amount || amount <= 0 || !gateway) {
      return res.status(400).json({ error: "Invalid request parameters" });
    }

    const gwConfig = await getGatewayConfig(gateway);
    if (!gwConfig || !gwConfig.isActive) {
      return res.status(400).json({ error: "Selected gateway is not active" });
    }

    const config = gwConfig.config || {};
    const taxAmount = parseFloat((amount * TAX_RATE).toFixed(2));
    const totalAmount = parseFloat((amount + taxAmount).toFixed(2));

    // Build metadata
    const metadata = { type };
    if (type === "WALLET_DEPOSIT") {
      metadata.depositAmount = amount;
    } else if (type === "ORDER") {
      metadata.planCode = planCode;
      metadata.durationLabel = durationLabel;
      metadata.category = category;
      metadata.osTemplate = osTemplate;
    } else if (type === "DOMAIN_REGISTRATION") {
      metadata.domainName = req.body.domainName;
      metadata.tld = req.body.tld;
      metadata.years = req.body.years || 1;
    } else if (type === "ADDITIONAL_IP") {
      metadata.subscriptionId = req.body.subscriptionId;
      metadata.price = req.body.price;
    }

    // Create PaymentSession
    const session = await prisma.paymentSession.create({
      data: {
        userId: req.user.id,
        type,
        amount,
        taxAmount,
        totalAmount,
        gateway,
        metadata,
        status: "PENDING",
      },
    });

    let checkoutUrl = null;
    let gatewayRef = null;

    // Stripe Checkout
    if (gateway === "stripe") {
      if (!stripe) {
        await prisma.paymentSession.delete({ where: { id: session.id } });
        return res.status(400).json({ error: "Gateway configuration missing: Stripe credentials are not configured" });
      }
      try {
        const lineItems = [{
          price_data: {
            currency: "cad",
            product_data: { name: type === "WALLET_DEPOSIT" ? "Wallet Deposit" : `Order: ${planCode}` },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        }];

        const stripeSession = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: lineItems,
          mode: "payment",
          success_url: `${process.env.FRONTEND_URL || ""}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL || ""}/dashboard?payment=cancelled`,
          metadata: { paymentSessionId: session.id },
        });

        checkoutUrl = stripeSession.url;
        gatewayRef = stripeSession.id;
      } catch (stripeErr) {
        const stripeMsg = getErrorMessage(stripeErr);
        await prisma.paymentSession.delete({ where: { id: session.id } });
        await prisma.systemLog.create({
          data: { type: "ERROR", message: `Stripe checkout failed: ${stripeMsg}` },
        });
        return res.status(400).json({ error: `Stripe gateway error: ${stripeMsg}` });
      }
    }
    // Razorpay
    else if (gateway === "razorpay") {
      if (!razorpay) {
        await prisma.paymentSession.delete({ where: { id: session.id } });
        return res.status(400).json({ error: "Gateway configuration missing: Razorpay credentials are not configured" });
      }
      try {
        const rpOrder = await razorpay.orders.create({
          amount: Math.round(totalAmount * 100),
          currency: "CAD",
          receipt: session.id,
          notes: { paymentSessionId: session.id, userId: req.user.id },
        });
        gatewayRef = rpOrder.id;
        checkoutUrl = `/api/payments/razorpay-checkout?order_id=${rpOrder.id}&amount=${totalAmount}&session_id=${session.id}`;
      } catch (rzpErr) {
        const rzpMsg = getErrorMessage(rzpErr);
        await prisma.paymentSession.delete({ where: { id: session.id } });
        await prisma.systemLog.create({
          data: { type: "ERROR", message: `Razorpay checkout failed: ${rzpMsg}` },
        });
        return res.status(400).json({ error: `Razorpay gateway error: ${rzpMsg}` });
      }
    }
    // Cashfree
    else if (gateway === "cashfree") {
      const cfConfig = config || {};
      const appId = cfConfig.keyId || process.env.CASHFREE_APP_ID;
      const secret = cfConfig.keySecret || process.env.CASHFREE_SECRET_KEY;
      if (!appId || !secret) {
        await prisma.paymentSession.delete({ where: { id: session.id } });
        return res.status(400).json({ error: "Gateway configuration missing: Cashfree credentials are not configured" });
      }
      try {
        const orderId = `CF_${session.id.slice(-12)}_${Date.now()}`;
        const cfPayload = {
          order_id: orderId,
          order_amount: totalAmount,
          order_currency: "CAD",
          customer_details: {
            customer_id: req.user.id,
            customer_email: req.user.email || "user@example.com",
            customer_phone: req.user.phone || "9999999999",
          },
          order_meta: {
            return_url: `${process.env.FRONTEND_URL || ""}/dashboard?payment=success&session_id=${session.id}`,
            notify_url: `${process.env.FRONTEND_URL || ""}/api/webhooks/cashfree`,
          },
        };
        const cfRes = await httpsPost("https://api.cashfree.com/pg/orders", {
          "x-client-id": appId,
          "x-client-secret": secret,
          "x-api-version": "2023-08-01",
        }, cfPayload);
        if (cfRes.status >= 200 && cfRes.status < 300 && cfRes.body?.payment_session_id) {
          gatewayRef = cfRes.body.cf_order_id || orderId;
          checkoutUrl = `https://api.cashfree.com/pg/orders/pay?session_id=${cfRes.body.payment_session_id}`;
        } else {
          throw new Error(cfRes.body?.message || cfRes.body?.error?.description || `Cashfree API error: HTTP ${cfRes.status}`);
        }
      } catch (cfErr) {
        const cfMsg = getErrorMessage(cfErr);
        await prisma.paymentSession.delete({ where: { id: session.id } });
        await prisma.systemLog.create({ data: { type: "ERROR", message: `Cashfree checkout failed: ${cfMsg}` } });
        return res.status(400).json({ error: `Cashfree gateway error: ${cfMsg}` });
      }
    }
    // PayPal
    else if (gateway === "paypal") {
      const ppClientId = config.keyId || process.env.PAYPAL_CLIENT_ID;
      const ppSecret = process.env.PAYPAL_CLIENT_SECRET;
      if (!ppClientId || !ppSecret) {
        await prisma.paymentSession.delete({ where: { id: session.id } });
        return res.status(400).json({ error: "Gateway configuration missing: PayPal credentials are not configured" });
      }
      try {
        // Get access token
        const auth = Buffer.from(`${ppClientId}:${ppSecret}`).toString("base64");
        const tokenRes = await httpsPost("https://api-m.paypal.com/v1/oauth2/token", {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        }, "grant_type=client_credentials");
        if (tokenRes.status !== 200 || !tokenRes.body?.access_token) {
          throw new Error(tokenRes.body?.error_description || `PayPal auth error: HTTP ${tokenRes.status}`);
        }
        const accessToken = tokenRes.body.access_token;

        // Create order
        const ppPayload = {
          intent: "CAPTURE",
          purchase_units: [{
            amount: { currency_code: "CAD", value: totalAmount.toFixed(2) },
            description: type === "WALLET_DEPOSIT" ? "Wallet Deposit" : `Order: ${planCode}`,
            custom_id: session.id,
          }],
          application_context: {
            return_url: `${process.env.FRONTEND_URL || ""}/dashboard?payment=success&session_id=${session.id}`,
            cancel_url: `${process.env.FRONTEND_URL || ""}/dashboard?payment=cancelled`,
          },
        };
        const orderRes = await httpsPost("https://api-m.paypal.com/v2/checkout/orders", {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        }, ppPayload);
        if (orderRes.status !== 201 || !orderRes.body?.id) {
          throw new Error(orderRes.body?.message || `PayPal order error: HTTP ${orderRes.status}`);
        }
        gatewayRef = orderRes.body.id;
        const approveLink = orderRes.body.links?.find((l) => l.rel === "approve");
        checkoutUrl = approveLink ? approveLink.href : null;
        if (!checkoutUrl) throw new Error("PayPal did not return an approval URL");
      } catch (ppErr) {
        const ppMsg = getErrorMessage(ppErr);
        await prisma.paymentSession.delete({ where: { id: session.id } });
        await prisma.systemLog.create({ data: { type: "ERROR", message: `PayPal checkout failed: ${ppMsg}` } });
        return res.status(400).json({ error: `PayPal gateway error: ${ppMsg}` });
      }
    }
    else {
      await prisma.paymentSession.delete({ where: { id: session.id } });
      return res.status(400).json({ error: `Unsupported gateway: ${gateway}` });
    }

    await prisma.paymentSession.update({
      where: { id: session.id },
      data: { checkoutUrl, gatewayRef },
    });

    // Log
    await prisma.systemLog.create({
      data: {
        type: "INFO",
        message: `Payment session created: ${gateway} ${type} $${totalAmount}`,
        details: { sessionId: session.id, gateway, userId: req.user.id, amount, taxAmount, totalAmount },
      },
    });

    res.json({ sessionId: session.id, checkoutUrl, gatewayRef, amount, taxAmount, totalAmount });
  } catch (error) {
    const msg = getErrorMessage(error);
    console.error("[PaymentController] createCheckoutSession error:", msg);
    await prisma.systemLog.create({
      data: { type: "ERROR", message: `Payment session error: ${msg}` },
    });
    res.status(500).json({ error: msg });
  }
};

// For Razorpay checkout page (redirect)
const getRazorpayCheckoutPage = async (req, res) => {
  const { order_id, amount, session_id } = req.query;
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const html = `
<!DOCTYPE html>
<html>
<head><title>Complete Payment</title>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<style>body{background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;}</style>
</head>
<body>
<div style="text-align:center">
  <h2>Complete Payment</h2>
  <p>Amount: $${(parseFloat(amount)).toFixed(2)} CAD</p>
  <button id="rzp-button" style="padding:12px 24px;background:#00f0ff;border:none;border-radius:8px;cursor:pointer;font-weight:bold">Pay Now</button>
</div>
<script>
const options = {
  key: '${keyId}',
  amount: ${Math.round(parseFloat(amount) * 100)},
  currency: 'CAD',
  name: 'BelieVoo',
  description: 'Wallet Deposit',
  order_id: '${order_id}',
  handler: function(response) {
    window.location.href = '/dashboard?payment=success&gateway=razorpay&session_id=${session_id}&razorpay_payment_id=' + response.razorpay_payment_id;
  },
  theme: { color: '#00f0ff' }
};
const rzp = new Razorpay(options);
document.getElementById('rzp-button').onclick = function() { rzp.open(); };
</script>
</body>
</html>`;
  res.send(html);
};

const getPaymentSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await prisma.paymentSession.findFirst({
      where: { id: sessionId, userId: req.user.id },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createCheckoutSession, getRazorpayCheckoutPage, getPaymentSession };
