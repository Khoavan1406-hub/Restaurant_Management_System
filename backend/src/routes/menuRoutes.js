const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// View menu — all roles (after login)
router.get("/", verifyToken, menuController.getAll);

// Create/Update/Delete — Chef or Admin only
router.post("/", verifyToken, authorizeRoles("Chef", "Admin"), upload.single("image"), menuController.create);
router.post("/bulk", verifyToken, authorizeRoles("Chef", "Admin"), menuController.bulkCreate);
router.put("/:id", verifyToken, authorizeRoles("Chef", "Admin"), upload.single("image"), menuController.update);
router.delete("/:id", verifyToken, authorizeRoles("Chef", "Admin"), menuController.remove);

module.exports = router;
