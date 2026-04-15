const { pool } = require("../config/db");

// Tìm user theo username (dùng cho Login)
const findByUsername = async (username) => {
  const [rows] = await pool.execute(
    "SELECT * FROM `User` WHERE `username` = ?",
    [username]
  );
  return rows[0];
};

// Tìm user theo ID (không trả passwordHash)
const findById = async (userID) => {
  const [rows] = await pool.execute(
    "SELECT `userID`, `id_number`, `username`, `phone_number`, `contact_email`, `role`, `is_active`, `created_at` FROM `User` WHERE `userID` = ?",
    [userID]
  );
  return rows[0];
};

// Lấy tất cả users (Admin xem danh sách)
const findAll = async () => {
  const [rows] = await pool.execute(
    "SELECT `userID`, `id_number`, `username`, `phone_number`, `contact_email`, `role`, `is_active`, `created_at` FROM `User` ORDER BY `created_at` DESC"
  );
  return rows;
};

// Tạo user mới
const create = async ({ id_number, username, passwordHash, phone_number, contact_email, role }) => {
  const [result] = await pool.execute(
    "INSERT INTO `User` (`id_number`, `username`, `passwordHash`, `phone_number`, `contact_email`, `role`) VALUES (?, ?, ?, ?, ?, ?)",
    [id_number, username, passwordHash, phone_number, contact_email, role]
  );
  return result;
};

// Thêm vào bảng role tương ứng (Admin/Chef/Waiter)
const insertRoleTable = async (userID, role) => {
  const table = role;
  const [result] = await pool.execute(
    `INSERT INTO \`${table}\` (\`userID\`) VALUES (?)`,
    [userID]
  );
  return result;
};

// Xóa user theo ID (CASCADE tự xóa bảng role)
const deleteById = async (userID) => {
  const [result] = await pool.execute(
    "DELETE FROM `User` WHERE `userID` = ?",
    [userID]
  );
  return result;
};

module.exports = {
  findByUsername,
  findById,
  findAll,
  create,
  insertRoleTable,
  deleteById,
};
