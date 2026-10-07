const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");
const { authenticate } = require("../middlewares/auth");

router.use(authenticate);

router.post("/order", billingController.createOrder);
router.get("/invoices", billingController.getInvoices);
router.get("/wallet", billingController.getWallet);
router.post("/wallet/deposit", billingController.depositWallet);
router.post("/wallet/pay", billingController.payWithWallet);

module.exports = router;
