const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middlewares/auth");

router.get("/me", authenticate, authController.me);
router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/login", authController.login);
router.post("/login/2fa", authController.verify2FALogin);
router.post("/google", authController.googleLogin);

// 2FA routes
router.post("/2fa/setup", authenticate, authController.setup2FA);
router.post("/2fa/confirm", authenticate, authController.confirm2FA);
router.post("/2fa/disable", authenticate, authController.disable2FA);

router.post("/change-password", authenticate, authController.changePassword);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.get("/config", async (req, res) => {
  try {
    const googleClientId = await authController.getSetting("google_client_id", process.env.GOOGLE_CLIENT_ID || "");
    res.json({ googleClientId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
