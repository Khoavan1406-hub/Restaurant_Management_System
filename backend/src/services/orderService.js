const orderModel = require("../models/orderModel");
const sessionModel = require("../models/sessionModel");
const dishModel = require("../models/dishModel");
const { pool } = require("../config/db");

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

const getOrdersByWaiter = async (waiterID) => {
  return await orderModel.findOrdersByWaiter(waiterID);
};

const updateOrderStatusByWaiter = async (waiterID, orderID, status) => {
  const allowedStatuses = ["Completed", "Cancelled"];
  if (!allowedStatuses.includes(status)) {
    throw { status: 400, message: "Invalid status for waiter action" };
  }

  const currentStatus = status === "Completed" ? "Ready" : "Not Started";
  const result = await orderModel.updateOrderStatusForWaiter(orderID, waiterID, status, currentStatus);
  if (result.affectedRows === 0) {
    throw { status: 404, message: `Order not found, not ${currentStatus.toLowerCase()}, or not assigned to this waiter` };
  }

  return { orderID, status };
};

const updatePendingOrderItems = async (waiterID, orderID, items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw { status: 400, message: "items array is required" };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderRows] = await conn.execute(
      "SELECT `orderID`, `status` FROM `Order` WHERE `orderID` = ? AND `waiterID` = ?",
      [orderID, waiterID]
    );
    const order = orderRows[0];
    if (!order) {
      throw { status: 404, message: "Order not found or not assigned to this waiter" };
    }
    if (order.status !== "Not Started") {
      throw { status: 400, message: "Only pending orders can be edited" };
    }

    const [currentItems] = await conn.execute(
      "SELECT `itemID`, `dishID`, `quantity`, `special_note` FROM `OrderItem` WHERE `orderID` = ?",
      [orderID]
    );

    const currentById = new Map(currentItems.map((item) => [item.itemID, item]));
    const dishDeltas = new Map();

    for (const item of items) {
      const itemID = Number(item.itemID);
      const newQty = Number(item.quantity);
      const note = item.special_note || null;

      if (!Number.isInteger(itemID) || itemID <= 0) {
        throw { status: 400, message: "Each item must include a valid itemID" };
      }
      if (!Number.isInteger(newQty) || newQty < 0) {
        throw { status: 400, message: "Each item must include a quantity >= 0" };
      }

      const current = currentById.get(itemID);
      if (!current) {
        throw { status: 400, message: `Item ID=${itemID} does not belong to this order` };
      }

      const delta = newQty - current.quantity;
      if (delta !== 0) {
        const existingDelta = dishDeltas.get(current.dishID) || 0;
        dishDeltas.set(current.dishID, existingDelta + delta);
      }

      if (newQty === 0) {
        await conn.execute(
          "DELETE FROM `OrderItem` WHERE `itemID` = ? AND `orderID` = ?",
          [itemID, orderID]
        );
      } else {
        await conn.execute(
          "UPDATE `OrderItem` SET `quantity` = ?, `special_note` = ? WHERE `itemID` = ? AND `orderID` = ?",
          [newQty, note, itemID, orderID]
        );
      }
    }

    for (const [dishID, delta] of dishDeltas.entries()) {
      if (delta === 0) continue;

      const [dishRows] = await conn.execute(
        "SELECT `current_portion`, `daily_portion` FROM `Dish` WHERE `dishID` = ?",
        [dishID]
      );
      const dish = dishRows[0];
      if (!dish) {
        throw { status: 404, message: `Dish ID=${dishID} not found` };
      }

      let newPortion = dish.current_portion - delta;
      if (newPortion < 0) {
        throw { status: 400, message: "Not enough portions available to increase this order" };
      }
      if (newPortion > dish.daily_portion) {
        newPortion = dish.daily_portion;
      }

      await conn.execute(
        "UPDATE `Dish` SET `current_portion` = ?, `is_available` = ? WHERE `dishID` = ?",
        [newPortion, newPortion > 0, dishID]
      );
    }

    const [remainingRows] = await conn.execute(
      "SELECT COUNT(*) AS `count` FROM `OrderItem` WHERE `orderID` = ?",
      [orderID]
    );
    if (remainingRows[0]?.count === 0) {
      await conn.execute(
        "UPDATE `Order` SET `status` = 'Cancelled' WHERE `orderID` = ?",
        [orderID]
      );
    }

    await conn.commit();
    return { orderID };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const closeSession = async (sessionID) => {
  const orders = await orderModel.findOrdersBySession(sessionID);
  for (const item of orders) {
    if (item.status !== "Completed" && item.status !== "Cancelled") {
      throw { status: 400, message: "Cannot checkout: all orders must be completed or cancelled" };
    }
  }

  let totalBill = 0;
  for (const item of orders) {
    if (item.status !== "Cancelled") {
      totalBill += item.dish_price * item.quantity;
    }
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
  getOrdersByWaiter,
  updateOrderStatusByWaiter,
  updatePendingOrderItems,
  closeSession,
  getActiveSessions,
};
