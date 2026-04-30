const orderService = require("../services/orderService");
const auditLogModel = require("../models/auditLogModel");
const sessionModel = require("../models/sessionModel");

// POST /api/orders/sessions
const openSession = async (req, res, next) => {
  try {
    const { table_number } = req.body;
    if (!table_number) {
      return res.status(400).json({ message: "table_number is required" });
    }

    const result = await orderService.openSession(req.user.userID, table_number);
    await auditLogModel.create(req.user.userID, "OPEN_SESSION", `Opened table ${table_number}`);

    res.status(201).json({ message: "Session opened", sessionID: result.insertId });
  } catch (error) {
    next(error);
  }
};

// POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { sessionID, items } = req.body;

    if (!sessionID || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "sessionID and items array required" });
    }

    const result = await orderService.createOrder(req.user.userID, sessionID, items);
    await auditLogModel.create(req.user.userID, "CREATE_ORDER", `Order #${result.orderID} (${result.itemCount} items)`);

    const io = req.app.get("io");
    if (io) {
      io.to("kitchen").emit("new-order", { orderID: result.orderID, sessionID });
    }

    res.status(201).json({ message: "Order placed successfully", ...result });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/session/:sessionID
const getBySession = async (req, res, next) => {
  try {
    const sessionID = parseInt(req.params.sessionID);
    const session = await sessionModel.findById(sessionID);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.waiterID !== req.user.userID) {
      return res.status(403).json({ message: "Access denied: this session belongs to another waiter" });
    }

    const orders = await orderService.getOrdersBySession(sessionID);
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/pending
const getPending = async (req, res, next) => {
  try {
    const orders = await orderService.getPendingOrders();
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/waiter/ready
const getWaiterReadyOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getReadyOrdersByWaiter(req.user.userID);
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/:id/waiter-status
const updateWaiterOrderStatus = async (req, res, next) => {
  try {
    const orderID = parseInt(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(orderID) || orderID <= 0) {
      return res.status(400).json({ message: "Valid order ID is required" });
    }

    if (!["Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Status must be Completed or Cancelled" });
    }

    const result = await orderService.updateReadyOrderStatusByWaiter(req.user.userID, orderID, status);
    await auditLogModel.create(req.user.userID, "WAITER_UPDATE_ORDER_STATUS", `Order #${orderID} -> ${status}`);

    const io = req.app.get("io");
    if (io) {
      io.emit("order-status-update", { orderID, status });
    }

    res.json({ message: `Order #${orderID} updated`, ...result });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/sessions/:id/close
const closeSession = async (req, res, next) => {
  try {
    const sessionID = parseInt(req.params.id);
    const session = await sessionModel.findById(sessionID);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.waiterID !== req.user.userID) {
      return res.status(403).json({ message: "Access denied: this session belongs to another waiter" });
    }

    const result = await orderService.closeSession(sessionID);
    await auditLogModel.create(req.user.userID, "CLOSE_SESSION", `Closed session #${sessionID}, bill: ${result.totalBill}`);

    res.json({ message: "Checkout complete", ...result });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/sessions/active
const getActiveSessions = async (req, res, next) => {
  try {
    const sessions = await orderService.getActiveSessions();
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  openSession,
  createOrder,
  getBySession,
  getPending,
  getWaiterReadyOrders,
  updateWaiterOrderStatus,
  closeSession,
  getActiveSessions,
};
