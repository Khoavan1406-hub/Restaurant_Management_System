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
    `SELECT o.orderID, o.sessionID, o.timestamp, o.status, o.chefID,
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

// Lay tat ca don hang cua waiter (tat ca trang thai) trong cac session dang active
const findOrdersByWaiter = async (waiterID) => {
  const [rows] = await pool.execute(
    `SELECT o.orderID, o.sessionID, o.timestamp, o.status,
            ts.table_number,
            oi.itemID, oi.quantity, oi.special_note,
            d.name AS dish_name
     FROM \`Order\` o
     JOIN \`TableSession\` ts ON o.sessionID = ts.sessionID
     JOIN \`OrderItem\` oi ON o.orderID = oi.orderID
     JOIN \`Dish\` d ON oi.dishID = d.dishID
     WHERE o.waiterID = ? AND ts.status = 'Active'
     ORDER BY o.timestamp DESC, o.orderID DESC, oi.itemID ASC`,
    [waiterID]
  );
  return rows;
};

// Waiter cập nhật trạng thái đơn theo điều kiện trạng thái hiện tại
const updateOrderStatusForWaiter = async (orderID, waiterID, status, currentStatus) => {
  if (status !== "Cancelled") {
    const [result] = await pool.execute(
      "UPDATE `Order` SET `status` = ? WHERE `orderID` = ? AND `waiterID` = ? AND `status` = ?",
      [status, orderID, waiterID, currentStatus]
    );
    return result;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      "UPDATE `Order` SET `status` = ? WHERE `orderID` = ? AND `waiterID` = ? AND `status` = ?",
      [status, orderID, waiterID, currentStatus]
    );

    if (result.affectedRows > 0) {
      await conn.execute(
        "UPDATE `Dish` d JOIN (SELECT `dishID`, SUM(`quantity`) AS `qty` FROM `OrderItem` WHERE `orderID` = ? GROUP BY `dishID`) oi ON d.dishID = oi.dishID SET d.current_portion = LEAST(d.current_portion + oi.qty, d.daily_portion), d.is_available = CASE WHEN LEAST(d.current_portion + oi.qty, d.daily_portion) > 0 THEN TRUE ELSE FALSE END",
        [orderID]
      );
    }

    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = {
  createOrder,
  addOrderItem,
  findOrdersBySession,
  updateOrderStatus,
  findPendingOrders,
  findOrdersByWaiter,
  updateOrderStatusForWaiter,
};
