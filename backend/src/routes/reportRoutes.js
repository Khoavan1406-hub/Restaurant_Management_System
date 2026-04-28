const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

router.get(
  "/employees",
  verifyToken,
  authorizeRoles("Admin"),
  reportController.getEmployeePerformance
);

module.exports = router;