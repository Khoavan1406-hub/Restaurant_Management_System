const orderModel = require("../models/orderModel");
const sessionModel = require("../models/sessionModel");
const dishModel = require("../models/dishModel");

const openSession = async (waiterID, table_number) => {
  const existing = await sessionModel.findActiveByTable(table_number);
  if (existing) {
    throw { status: 400, message: `Table ${table_number} already has an active session` };
  }
  return await sessionModel.create(waiterID, table_number);
};

const createOrder = async (waiterID, sessionID, items) => {
  const session = await sessionModel.findById(sessionID);
  if (!session || session.status !== "Active") {
    throw { status: 400, message: "Invalid or closed session" };
  }

  for (const item of items) {
    const dish = await dishModel.findById(item.dishID);
    if (!dish) {
      throw { status: 404, message: `Dish ID=${item.dishID} not found` };
    }
    if (!dish.is_available) {
      throw { status: 400, message: `"${dish.name}" is sold out` };
    }
    if (dish.current_portion < item.quantity) {
      throw { status: 400, message: `"${dish.name}" only has ${dish.current_portion} portions left` };
    }
  }

  const orderResult = await orderModel.createOrder({ sessionID, waiterID });
  const orderID = orderResult.insertId;

  for (const item of items) {
    await orderModel.addOrderItem({
      orderID,
      dishID: item.dishID,
      quantity: item.quantity,
      special_note: item.special_note,
    });
    await dishModel.decreasePortion(item.dishID, item.quantity);
  }

  return { orderID, itemCount: items.length };
};

const getOrdersBySession = async (sessionID) => {
  return await orderModel.findOrdersBySession(sessionID);
};

const getPendingOrders = async () => {
  return await orderModel.findPendingOrders();
};

const getReadyOrdersByWaiter = async (waiterID) => {
  return await orderModel.findReadyOrdersByWaiter(waiterID);
};

const updateReadyOrderStatusByWaiter = async (waiterID, orderID, status) => {
  const allowedStatuses = ["Completed", "Cancelled"];
  if (!allowedStatuses.includes(status)) {
    throw { status: 400, message: "Invalid status for waiter action" };
  }

  const result = await orderModel.updateOrderStatusForWaiter(orderID, waiterID, status);
  if (result.affectedRows === 0) {
    throw { status: 404, message: "Order not found, not ready, or not assigned to this waiter" };
  }

  return { orderID, status };
};

const closeSession = async (sessionID) => {
  const orders = await orderModel.findOrdersBySession(sessionID);
  let totalBill = 0;
  for (const item of orders) {
    totalBill += item.dish_price * item.quantity;
  }
  await sessionModel.closeSession(sessionID, totalBill);
  return { sessionID, totalBill };
};

const getActiveSessions = async () => {
  return await sessionModel.findAllActive();
};

module.exports = {
  openSession,
  createOrder,
  getOrdersBySession,
  getPendingOrders,
  getReadyOrdersByWaiter,
  updateReadyOrderStatusByWaiter,
  closeSession,
  getActiveSessions,
};
