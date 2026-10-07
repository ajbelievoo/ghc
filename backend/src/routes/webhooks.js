const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

// Webhooks need the RAW body for signature verification (Stripe, Razorpay, Cashfree).
// express.raw gives us req.body as a Buffer which each gateway verifier can use.
router.post("/:gateway", express.raw({ type: "*/*", limit: "1mb" }), webhookController.handlePaymentWebhook);

module.exports = router;
