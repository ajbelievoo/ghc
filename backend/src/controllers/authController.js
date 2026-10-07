const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const prisma = require("../prisma");
const { sendVerificationEmail, sendTeamInvitationEmail } = require("../services/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

const getSetting = async (key, fallback = "") => {
  const s = await prisma.settings.findUnique({ where: { key } });
  return s ? s.value : fallback;
};

const generateToken = (payload, expiresIn = "1d") => jwt.sign(payload, JWT_SECRET, { expiresIn });

const me = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isSuspended: req.user.isSuspended,
        isEmailVerified: req.user.isEmailVerified,
        twoFactorEnabled: req.user.twoFactorEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        isEmailVerified: false,
        emailVerifyToken: verifyToken,
        emailVerifyExpires: verifyExpires,
      }
    });

    // Send verification email
    try {
      await sendVerificationEmail(normalizedEmail, verifyToken, name);
    } catch (emailErr) {
      console.error("[Auth] Failed to send verification email:", emailErr.message);
    }

    await prisma.systemLog.create({
      data: { type: "INFO", message: `New user registered: ${normalizedEmail}`, details: { userId: user.id } }
    });

    res.status(201).json({ message: "Registration successful. Please check your email to verify your account.", user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token required" });

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: { gt: new Date() },
      }
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired verification token" });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      }
    });

    await prisma.systemLog.create({
      data: { type: "INFO", message: `Email verified: ${user.email}`, details: { userId: user.id } }
    });

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return res.status(400).json({ error: "User not found" });
    if (user.isEmailVerified) return res.status(400).json({ error: "Email already verified" });

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: verifyToken, emailVerifyExpires: verifyExpires }
    });

    await sendVerificationEmail(normalizedEmail, verifyToken, user.name);

    res.json({ message: "Verification email resent. Please check your inbox." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.passwordHash) return res.status(400).json({ error: "Invalid credentials" });
    if (user.isSuspended) return res.status(403).json({ error: "Account suspended. Contact administrator." });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // If 2FA is enabled, return a temporary token for 2FA verification
    if (user.twoFactorEnabled) {
      const tempToken = generateToken({ userId: user.id, twoFactorPending: true }, "5m");
      return res.json({ twoFactorRequired: true, tempToken, message: "Please enter your 2FA code" });
    }

    const token = generateToken({ userId: user.id });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verify2FALogin = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) return res.status(400).json({ error: "Token and code required" });

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
    }

    if (!decoded.twoFactorPending) return res.status(400).json({ error: "Invalid session" });

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.twoFactorSecret) return res.status(400).json({ error: "2FA not configured" });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) return res.status(400).json({ error: "Invalid 2FA code" });

    const token = generateToken({ userId: user.id });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const setup2FA = async (req, res) => {
  try {
    const user = req.user;
    if (user.twoFactorEnabled) return res.status(400).json({ error: "2FA is already enabled" });

    const secret = speakeasy.generateSecret({
      name: `BelieVoo (${user.email})`,
      issuer: "BelieVoo Cloud",
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret.base32 }
    });

    const qrUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrUrl,
      message: "Scan this QR code with Google Authenticator or Authy, then verify a code to enable 2FA."
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const confirm2FA = async (req, res) => {
  try {
    const { code } = req.body;
    const user = req.user;

    if (!user.twoFactorSecret) return res.status(400).json({ error: "2FA not set up. Call setup first." });
    if (user.twoFactorEnabled) return res.status(400).json({ error: "2FA already enabled" });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) return res.status(400).json({ error: "Invalid code. Please try again." });

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true }
    });

    await prisma.systemLog.create({
      data: { type: "SECURITY", message: `2FA enabled for user: ${user.email}`, details: { userId: user.id } }
    });

    res.json({ message: "2FA enabled successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const disable2FA = async (req, res) => {
  try {
    const { code } = req.body;
    const user = req.user;

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ error: "2FA is not enabled" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) return res.status(400).json({ error: "Invalid 2FA code" });

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null }
    });

    await prisma.systemLog.create({
      data: { type: "SECURITY", message: `2FA disabled for user: ${user.email}`, details: { userId: user.id } }
    });

    res.json({ message: "2FA disabled successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "Google credential required" });

    // Check if google login is enabled globally
    const setting = await prisma.settings.findUnique({ where: { key: "google_login_enabled" } });
    if (setting && setting.value === "false") {
      return res.status(403).json({ error: "Google login is currently disabled by administrator." });
    }

    const GOOGLE_CLIENT_ID = await getSetting("google_client_id", process.env.GOOGLE_CLIENT_ID || "");
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: "Google OAuth is not configured on this server." });
    }

    const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ error: "Invalid Google credential" });

    const googleId = payload.sub;
    const email = payload.email?.toLowerCase().trim();
    const name = payload.name || payload.email?.split("@")[0] || "Google User";

    if (!email) return res.status(400).json({ error: "Google account has no email" });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { name, email, googleId, isEmailVerified: true }
      });
      await prisma.systemLog.create({
        data: { type: "INFO", message: `New user via Google OAuth: ${email}`, details: { userId: user.id } }
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { email },
        data: { googleId, isEmailVerified: true }
      });
    }

    if (user.isSuspended) return res.status(403).json({ error: "Account suspended. Contact administrator." });

    // If 2FA is enabled, return temp token
    if (user.twoFactorEnabled) {
      const tempToken = generateToken({ userId: user.id, twoFactorPending: true }, "5m");
      return res.json({ twoFactorRequired: true, tempToken, message: "Please enter your 2FA code" });
    }

    const token = generateToken({ userId: user.id });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("[Auth] Google login error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    if (!user.passwordHash) return res.status(400).json({ error: "Social login users cannot change password" });
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
    await prisma.systemLog.create({
      data: { type: "SECURITY", message: `Password changed for user: ${user.email}`, details: { userId: user.id } }
    });
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.passwordHash) return res.json({ message: "If an account exists, a reset link has been sent." });
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: resetToken, emailVerifyExpires: resetExpires }
    });
    // In production, send email here. For now we return the token for testing.
    res.json({ message: "If an account exists, a reset link has been sent.", resetToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token, emailVerifyExpires: { gt: new Date() } }
    });
    if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });
    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, emailVerifyToken: null, emailVerifyExpires: null }
    });
    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  me,
  register,
  verifyEmail,
  resendVerification,
  login,
  verify2FALogin,
  setup2FA,
  confirm2FA,
  disable2FA,
  googleLogin,
  getSetting,
  changePassword,
  forgotPassword,
  resetPassword,
};
