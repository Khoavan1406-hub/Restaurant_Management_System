const userService = require("../services/userService");
const auditLogModel = require("../models/auditLogModel");
const { validateCreateUser } = require("../validators/userValidator");

// GET /api/users
const getAll = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// POST /api/users
const create = async (req, res, next) => {
  try {
    const { id_number, username, password, phone_number, contact_email, role } = req.body;

    const validationError = validateCreateUser({
      id_number,
      username,
      password,
      phone_number,
      contact_email,
      role,
    });

    if (validationError) {
      return res.status(validationError.status).json({ message: validationError.message });
    }

    const newUser = await userService.createUser({ id_number, username, password, phone_number, contact_email, role });
    await auditLogModel.create(req.user.userID, "CREATE_USER", `Created account ${username} (${role})`);

    res.status(201).json({ message: "Account created successfully", user: newUser });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id
const remove = async (req, res, next) => {
  try {
    const userID = parseInt(req.params.id);

    if (userID === req.user.userID) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    await userService.deleteUser(userID);
    await auditLogModel.create(req.user.userID, "DELETE_USER", `Deleted account ID=${userID}`);

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, remove };
