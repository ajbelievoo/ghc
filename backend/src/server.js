require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const serverRoutes = require("./routes/server");
const billingRoutes = require("./routes/billing");
const paymentRoutes = require("./routes/payment");
const webhookRoutes = require("./routes/webhooks");
const teamRoutes = require("./routes/team");
const supportRoutes = require("./routes/support");

const cronJobs = require("./cron/jobs");

const app = express();
const PORT = process.env.PORT || 5000;

// Webhooks need raw body for verification, handle it in webhookRoutes
app.use("/api/webhooks", webhookRoutes);

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/server", serverRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/support", supportRoutes);

app.get("/", (req, res) => {
  res.send("GHC Backend API Running");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Initialize Cron Jobs
cronJobs.init();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
