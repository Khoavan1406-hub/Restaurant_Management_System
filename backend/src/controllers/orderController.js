const orderService = require("../services/orderService");
const auditLogModel = require("../models/auditLogModel");

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

// PATCH /api/orders/sessions/:id/close
const closeSession = async (req, res, next) => {
  try {
    const sessionID = parseInt(req.params.id);
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

module.exports = { openSession, createOrder, getBySession, getPending, closeSession, getActiveSessions };
