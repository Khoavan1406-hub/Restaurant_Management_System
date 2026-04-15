const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// Kiểm tra user đã đăng nhập chưa (verify JWT token)
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token, vui lòng đăng nhập" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.userID);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Tài khoản không hợp lệ hoặc đã bị vô hiệu hóa" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token đã hết hạn, vui lòng đăng nhập lại" });
    }
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};

// Kiểm tra quyền theo role (RBAC)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' không có quyền truy cập tài nguyên này`,
      });
    }
    next();
  };
};

module.exports = { verifyToken, authorizeRoles };
