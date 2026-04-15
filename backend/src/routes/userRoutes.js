const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

// Tất cả routes yêu cầu: đăng nhập + role Admin
router.use(verifyToken, authorizeRoles("Admin"));

router.get("/", userController.getAll);          // GET    /api/users
router.post("/", userController.create);         // POST   /api/users
router.delete("/:id", userController.remove);    // DELETE /api/users/:id

module.exports = router;
