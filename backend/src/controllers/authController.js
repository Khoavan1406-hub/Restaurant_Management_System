const authService = require("../services/authService");
const auditLogModel = require("../models/auditLogModel");

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const result = await authService.login(username, password);
    await auditLogModel.create(result.user.userID, "LOGIN", `User ${username} logged in`);

    res.json({
      message: "Login successful",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.userID);
    await auditLogModel.create(req.user.userID, "LOGOUT", `User ${req.user.username} logged out`);

    res.json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, logout };
