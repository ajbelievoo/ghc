const crypto = require("crypto");
const prisma = require("../prisma");
const { sendTeamInvitationEmail } = require("../services/emailService");

const PERMISSIONS = [
  "VIEW_SERVERS",
  "MANAGE_SERVERS",
  "VIEW_BILLING",
  "MANAGE_DOMAINS",
  "VIEW_INVOICES",
];

const getMyTeam = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get team members who have access to my account
    const myTeam = await prisma.teamMember.findMany({
      where: { ownerId: userId },
      include: { member: { select: { id: true, name: true, email: true } } },
    });

    // Get accounts I have access to
    const sharedWithMe = await prisma.teamMember.findMany({
      where: { memberId: userId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    // Get pending invitations I sent
    const sentInvites = await prisma.teamInvitation.findMany({
      where: { inviterId: userId, status: "PENDING" },
    });

    // Get pending invitations I received
    const receivedInvites = await prisma.teamInvitation.findMany({
      where: { inviteeEmail: req.user.email, status: "PENDING" },
      include: { inviter: { select: { id: true, name: true, email: true } } },
    });

    res.json({ myTeam, sharedWithMe, sentInvites, receivedInvites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const inviteMember = async (req, res) => {
  try {
    const { inviteeEmail, permissions } = req.body;
    const inviterId = req.user.id;
    const normalizedEmail = inviteeEmail.toLowerCase().trim();

    if (!normalizedEmail) return res.status(400).json({ error: "Email required" });
    if (normalizedEmail === req.user.email) return res.status(400).json({ error: "Cannot invite yourself" });

    // Validate permissions
    const validPerms = (permissions || []).filter(p => PERMISSIONS.includes(p));
    if (validPerms.length === 0) validPerms.push("VIEW_SERVERS");

    // Check if already a team member
    const existingMember = await prisma.teamMember.findFirst({
      where: { ownerId: inviterId, member: { email: normalizedEmail } },
    });
    if (existingMember) return res.status(400).json({ error: "User already has access to your account" });

    // Check for pending invitation
    const existingInvite = await prisma.teamInvitation.findFirst({
      where: { inviterId, inviteeEmail: normalizedEmail, status: "PENDING" },
    });
    if (existingInvite) return res.status(400).json({ error: "Invitation already pending" });

    // Find invitee user if exists
    const invitee = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await prisma.teamInvitation.create({
      data: {
        inviterId,
        inviteeEmail: normalizedEmail,
        inviteeId: invitee?.id || null,
        permissions: validPerms,
        token,
        expiresAt,
      }
    });

    // Send invitation email
    try {
      await sendTeamInvitationEmail(normalizedEmail, token, req.user.name, validPerms);
    } catch (emailErr) {
      console.error("[Team] Failed to send invitation email:", emailErr.message);
    }

    res.json({ message: "Invitation sent successfully.", invitation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        token,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: { inviter: true },
    });

    if (!invitation) return res.status(400).json({ error: "Invalid or expired invitation" });
    if (invitation.inviteeEmail !== req.user.email) {
      return res.status(403).json({ error: "This invitation is for a different email address" });
    }

    // Create team member entry
    await prisma.teamMember.create({
      data: {
        ownerId: invitation.inviterId,
        memberId: userId,
        permissions: invitation.permissions,
      }
    });

    // Update invitation
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", inviteeId: userId }
    });

    await prisma.systemLog.create({
      data: {
        type: "SECURITY",
        message: `Team access granted: ${req.user.email} -> ${invitation.inviter.email}`,
        details: { ownerId: invitation.inviterId, memberId: userId }
      }
    });

    res.json({ message: "Invitation accepted. You now have access to the team account." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rejectInvitation = async (req, res) => {
  try {
    const { token } = req.body;

    const invitation = await prisma.teamInvitation.findFirst({
      where: { token, status: "PENDING" }
    });

    if (!invitation) return res.status(400).json({ error: "Invitation not found" });
    if (invitation.inviteeEmail !== req.user.email) {
      return res.status(403).json({ error: "This invitation is for a different email address" });
    }

    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: "REJECTED" }
    });

    res.json({ message: "Invitation rejected." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const revokeAccess = async (req, res) => {
  try {
    const { memberId } = req.body;
    const ownerId = req.user.id;

    const teamMember = await prisma.teamMember.findFirst({
      where: { ownerId, memberId }
    });

    if (!teamMember) return res.status(404).json({ error: "Team member not found" });

    await prisma.teamMember.delete({ where: { id: teamMember.id } });

    await prisma.systemLog.create({
      data: {
        type: "SECURITY",
        message: `Team access revoked by ${ownerId} for member ${memberId}`,
        details: { ownerId, memberId }
      }
    });

    res.json({ message: "Access revoked successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePermissions = async (req, res) => {
  try {
    const { memberId, permissions } = req.body;
    const ownerId = req.user.id;

    const validPerms = (permissions || []).filter(p => PERMISSIONS.includes(p));
    if (validPerms.length === 0) return res.status(400).json({ error: "At least one permission required" });

    const teamMember = await prisma.teamMember.findFirst({
      where: { ownerId, memberId }
    });

    if (!teamMember) return res.status(404).json({ error: "Team member not found" });

    await prisma.teamMember.update({
      where: { id: teamMember.id },
      data: { permissions: validPerms }
    });

    res.json({ message: "Permissions updated successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMyTeam,
  inviteMember,
  acceptInvitation,
  rejectInvitation,
  revokeAccess,
  updatePermissions,
};
