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

// Xóa user theo ID — xóa các bản ghi phụ thuộc trước (tránh FK RESTRICT)
const deleteById = async (userID) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Xóa OrderItem thuộc các Order mà user này là waiter HOẶC chef
    await conn.execute(
      `DELETE oi FROM \`OrderItem\` oi
       INNER JOIN \`Order\` o ON oi.orderID = o.orderID
       WHERE o.waiterID = ? OR o.chefID = ?`,
      [userID, userID]
    );

    // 2. Xóa Order mà user này là waiter hoặc chef
    await conn.execute(
      "DELETE FROM `Order` WHERE `waiterID` = ? OR `chefID` = ?",
      [userID, userID]
    );

    // 3. Xóa TableSession mà user này là waiter
    await conn.execute(
      "DELETE FROM `TableSession` WHERE `waiterID` = ?",
      [userID]
    );

    // 4. Set NULL cho Dish nếu user này là chef
    await conn.execute(
      "UPDATE `Dish` SET `chefID` = NULL WHERE `chefID` = ?",
      [userID]
    );

    // 5. Xóa User (CASCADE sẽ tự xóa bảng Admin/Chef/Waiter)
    const [result] = await conn.execute(
      "DELETE FROM `User` WHERE `userID` = ?",
      [userID]
    );

    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  findByUsername,
  findById,
  findAll,
  create,
  insertRoleTable,
  deleteById,
};
