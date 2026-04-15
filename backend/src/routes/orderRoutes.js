const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

// Sessions
router.get("/sessions/active", verifyToken, authorizeRoles("Waiter"), orderController.getActiveSessions);
router.post("/sessions", verifyToken, authorizeRoles("Waiter"), orderController.openSession);
router.patch("/sessions/:id/close", verifyToken, authorizeRoles("Waiter"), orderController.closeSession);

// Orders
router.post("/", verifyToken, authorizeRoles("Waiter"), orderController.createOrder);
router.get("/session/:sessionID", verifyToken, orderController.getBySession);
router.get("/pending", verifyToken, authorizeRoles("Chef", "Admin"), orderController.getPending);

module.exports = router;
