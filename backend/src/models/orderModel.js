const { pool } = require("../config/db");

// Tạo đơn hàng mới
const createOrder = async ({ sessionID, waiterID }) => {
  const [result] = await pool.execute(
    "INSERT INTO `Order` (`sessionID`, `waiterID`) VALUES (?, ?)",
    [sessionID, waiterID]
  );
  return result;
};

// Thêm món vào đơn
const addOrderItem = async ({ orderID, dishID, quantity, special_note }) => {
  const [result] = await pool.execute(
    "INSERT INTO `OrderItem` (`orderID`, `dishID`, `quantity`, `special_note`) VALUES (?, ?, ?, ?)",
    [orderID, dishID, quantity, special_note || null]
  );
  return result;
};

// Lấy tất cả đơn trong 1 phiên (tính bill)
const findOrdersBySession = async (sessionID) => {
  const [rows] = await pool.execute(
    `SELECT o.orderID, o.sessionID, o.timestamp, o.status,
            oi.itemID, oi.dishID, oi.quantity, oi.special_note,
            d.name AS dish_name, d.price AS dish_price
     FROM \`Order\` o
     JOIN \`OrderItem\` oi ON o.orderID = oi.orderID
     JOIN \`Dish\` d ON oi.dishID = d.dishID
     WHERE o.sessionID = ?
     ORDER BY o.timestamp`,
    [sessionID]
  );
  return rows;
};

// Chef cập nhật trạng thái đơn hàng
const updateOrderStatus = async (orderID, status, chefID = null) => {
  const [result] = await pool.execute(
    "UPDATE `Order` SET `status` = ?, `chefID` = ? WHERE `orderID` = ?",
    [status, chefID, orderID]
  );
  return result;
};

// Lấy đơn chờ xử lý (Kitchen Display)
const findPendingOrders = async () => {
  const [rows] = await pool.execute(
    `SELECT o.orderID, o.sessionID, o.timestamp, o.status,
            ts.table_number,
            oi.itemID, oi.quantity, oi.special_note,
            d.name AS dish_name
     FROM \`Order\` o
     JOIN \`TableSession\` ts ON o.sessionID = ts.sessionID
     JOIN \`OrderItem\` oi ON o.orderID = oi.orderID
     JOIN \`Dish\` d ON oi.dishID = d.dishID
     WHERE o.status IN ('Not Started', 'Cooking')
     ORDER BY o.timestamp ASC`
  );
  return rows;
};

module.exports = {
  createOrder,
  addOrderItem,
  findOrdersBySession,
  updateOrderStatus,
  findPendingOrders,
};
