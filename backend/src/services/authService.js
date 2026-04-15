const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const login = async (username, password) => {
  const user = await userModel.findByUsername(username);
  if (!user) {
    throw { status: 401, message: "Invalid username or password" };
  }

  if (!user.is_active) {
    throw { status: 403, message: "Account has been deactivated" };
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw { status: 401, message: "Invalid username or password" };
  }

  const token = jwt.sign(
    { userID: user.userID, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
  );

  return {
    token,
    user: {
      userID: user.userID,
      username: user.username,
      role: user.role,
    },
  };
};

module.exports = { login };
