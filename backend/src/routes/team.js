const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth");
const teamController = require("../controllers/teamController");

router.use(authenticate);

router.get("/", teamController.getMyTeam);
router.post("/invite", teamController.inviteMember);
router.post("/accept", teamController.acceptInvitation);
router.post("/reject", teamController.rejectInvitation);
router.post("/revoke", teamController.revokeAccess);
router.post("/permissions", teamController.updatePermissions);

module.exports = router;
