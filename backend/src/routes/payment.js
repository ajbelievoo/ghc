const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticate } = require("../middlewares/auth");

router.post("/checkout", authenticate, paymentController.createCheckoutSession);
router.get("/session/:sessionId", authenticate, paymentController.getPaymentSession);
router.get("/razorpay-checkout", paymentController.getRazorpayCheckoutPage);

module.exports = router;
