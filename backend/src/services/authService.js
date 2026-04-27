const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const login = async (username, password) => {
  const user = await userModel.findByUsername(username);
  if (!user) {
    throw { status: 401, message: "Invalid username or password" };
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw { status: 401, message: "Invalid username or password" };
  }

  await userModel.activate(user.userID);

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

const logout = async (userID) => {
  await userModel.deactivate(userID);
  return { message: "Logout successful" };
};

module.exports = { login, logout };
