const { pool } = require("../config/db");

// Ghi log thao tác hệ thống
const create = async (userID, action, detail = null) => {
  const [result] = await pool.execute(
    "INSERT INTO `AuditLog` (`userID`, `action`, `detail`) VALUES (?, ?, ?)",
    [userID, action, detail]
  );
  return result;
};

// Lấy danh sách log (Admin xem)
const findAll = async () => {
  const [rows] = await pool.execute(
    `SELECT al.*, u.username
     FROM \`AuditLog\` al
     LEFT JOIN \`User\` u ON al.userID = u.userID
     ORDER BY al.timestamp DESC
     LIMIT 100`
  );
  return rows;
};

module.exports = { create, findAll };
