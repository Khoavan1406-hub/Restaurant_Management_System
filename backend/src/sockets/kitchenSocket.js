const orderModel = require("../models/orderModel");
const auditLogModel = require("../models/auditLogModel");

const setupKitchenSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Chef join room "kitchen" khi mở Kitchen Display
    socket.on("join-room", (room) => {
      socket.join(room);
      console.log(`👨‍🍳 Socket ${socket.id} joined room: ${room}`);
    });

    // Chef cập nhật trạng thái đơn hàng
    socket.on("order-status-update", async (data) => {
      try {
        const { orderID, status, chefID } = data;

        // Cập nhật DB
        await orderModel.updateOrderStatus(orderID, status, chefID);

        // Ghi audit log
        await auditLogModel.create(chefID, "UPDATE_ORDER_STATUS", `Order #${orderID} → ${status}`);

        // Broadcast cho tất cả client
        io.emit("order-status-update", { orderID, status });

        console.log(`📋 Order #${orderID} → ${status}`);
      } catch (error) {
        console.error("Socket error:", error.message);
        socket.emit("error", { message: "Failed to update order status" });
      }
    });

    // Client ngắt kết nối
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupKitchenSocket;
