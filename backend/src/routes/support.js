const express = require("express");
const router = express.Router();
const supportController = require("../controllers/supportController");
const { authenticate } = require("../middlewares/auth");

// Public ticket creation (no auth required)
router.post("/ticket", supportController.createTicket);

// Protected routes
router.use(authenticate);
router.get("/tickets", supportController.getTickets);
router.get("/tickets/:id", supportController.getTicket);
router.post("/tickets/:id/status", supportController.updateTicketStatus);
router.post("/tickets/:id/reply", supportController.addReply);

module.exports = router;
