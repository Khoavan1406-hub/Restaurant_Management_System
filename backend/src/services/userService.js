const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");

const getAllUsers = async () => {
  return await userModel.findAll();
};

const createUser = async ({ id_number, username, password, phone_number, contact_email, role }) => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await userModel.create({
    id_number, username, passwordHash, phone_number, contact_email, role,
  });

  await userModel.insertRoleTable(result.insertId, role);

  return { userID: result.insertId, username, role };
};

const deleteUser = async (userID) => {
  const user = await userModel.findById(userID);
  if (!user) {
    throw { status: 404, message: "User not found" };
  }
  await userModel.deleteById(userID);
  return { message: "Account deleted successfully" };
};

module.exports = { getAllUsers, createUser, deleteUser };
