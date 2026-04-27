const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

// POST /api/auth/login
router.post("/login", authController.login);
router.post("/logout", verifyToken, authController.logout);

module.exports = router;
