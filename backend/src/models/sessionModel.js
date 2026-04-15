const { pool } = require("../config/db");

// Mở phiên bàn mới
const create = async (waiterID, table_number) => {
  const [result] = await pool.execute(
    "INSERT INTO `TableSession` (`waiterID`, `table_number`) VALUES (?, ?)",
    [waiterID, table_number]
  );
  return result;
};

// Kiểm tra bàn đã có phiên active chưa
const findActiveByTable = async (table_number) => {
  const [rows] = await pool.execute(
    "SELECT * FROM `TableSession` WHERE `table_number` = ? AND `status` = 'Active'",
    [table_number]
  );
  return rows[0];
};

// Lấy thông tin phiên
const findById = async (sessionID) => {
  const [rows] = await pool.execute(
    "SELECT * FROM `TableSession` WHERE `sessionID` = ?",
    [sessionID]
  );
  return rows[0];
};

// Đóng phiên (thanh toán)
const closeSession = async (sessionID, total_bill) => {
  const [result] = await pool.execute(
    "UPDATE `TableSession` SET `status` = 'Completed', `end_time` = NOW(), `total_bill` = ? WHERE `sessionID` = ?",
    [total_bill, sessionID]
  );
  return result;
};

// Get all active sessions
const findAllActive = async () => {
  const [rows] = await pool.execute(
    "SELECT * FROM `TableSession` WHERE `status` = 'Active' ORDER BY `table_number`"
  );
  return rows;
};

module.exports = {
  create,
  findActiveByTable,
  findAllActive,
  findById,
  closeSession,
};
