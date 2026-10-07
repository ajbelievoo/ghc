const prisma = require("../prisma");

const createTicket = async (req, res) => {
  try {
    const { name, email, category, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "Name, email, subject and message are required" });
    }
    const userId = req.user?.id || null;
    const ticket = await prisma.supportTicket.create({
      data: { userId, name, email: email.toLowerCase().trim(), category: category || "General", subject, message }
    });
    await prisma.systemLog.create({
      data: { type: "INFO", message: `Support ticket created: ${subject}`, details: { ticketId: ticket.id, email } }
    });
    res.status(201).json({ ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTickets = async (req, res) => {
  try {
    const { status, userId, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: { replies: { orderBy: { createdAt: "asc" } } }
    });
    const total = await prisma.supportTicket.count({ where });
    res.json({ tickets, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { replies: { orderBy: { createdAt: "asc" } } }
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status }
    });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, sender } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });
    const reply = await prisma.supportReply.create({
      data: { ticketId: id, sender: sender || "ADMIN", message }
    });
    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  updateTicketStatus,
  addReply,
};
