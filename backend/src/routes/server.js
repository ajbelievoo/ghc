const express = require("express");
const router = express.Router();
const serverController = require("../controllers/serverController");
const { authenticate } = require("../middlewares/auth");

// Public routes — no auth required
router.get("/plans", serverController.listPlans);
router.get("/plans/configuration", serverController.getPlanConfiguration);
router.get("/gateways", serverController.getActiveGateways);
router.get("/margins", serverController.getMargins);
router.get("/domains/check", serverController.checkDomain);

router.use(authenticate);

router.get("/", serverController.getMyServers);
router.get("/domains", serverController.getMyDomains);
router.post("/domains", serverController.registerDomain);
router.get("/:id", serverController.getServerDetails);
router.post("/:id/power", serverController.powerAction);
router.post("/:id/reinstall", serverController.reinstallOS);
router.get("/:id/metrics", serverController.getMetrics);
router.get("/:id/metrics/history", serverController.getMetricsHistory);
router.get("/:id/additional-ips", serverController.getAdditionalIps);
router.post("/:id/additional-ips", serverController.purchaseAdditionalIp);

module.exports = router;
