const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate, requireAdmin } = require("../middlewares/auth");

router.use(authenticate, requireAdmin);

router.get("/stats", adminController.getDashboardStats);
router.get("/settings", adminController.getSettings);
router.post("/settings", adminController.updateSetting);
router.post("/gateways", adminController.updateGateway);
router.get("/logs", adminController.getSystemLogs);
router.post("/servers/:serverId/override", adminController.manualServerOverride);

// Users
router.get("/users", adminController.getUsers);
router.post("/users/:userId", adminController.updateUser);

// Credentials & Gateways
router.get("/credentials", adminController.getCredentials);
router.post("/credentials", adminController.updateCredentials);

// Brand
router.get("/brand", adminController.getBrandSettings);
router.post("/brand", adminController.updateBrandSettings);

// OVH Plan Sync
router.post("/sync-ovh-plans", adminController.syncOvhPlans);

// Margin Settings
router.get("/margins", adminController.getMarginSettings);
router.post("/margins", adminController.updateMarginSetting);

// Plan Catalog
router.get("/plans", adminController.getPlanCatalog);
router.post("/plans/:planCode/override", adminController.updatePlanOverride);

// Subscriptions (Lifecycle)
router.get("/subscriptions", adminController.getSubscriptions);
router.post("/subscriptions/:id/lifecycle", adminController.subscriptionLifecycle);

// Domain TLD Pricing
router.get("/domain-tlds", adminController.getDomainTldPricing);
router.post("/domain-tlds", adminController.updateDomainTldPricing);

// Orders
router.get("/orders", adminController.getOrders);

module.exports = router;
