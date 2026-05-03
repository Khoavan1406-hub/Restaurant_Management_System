const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const { testConnection } = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");
const setupKitchenSocket = require("./sockets/kitchenSocket");

const app = express();
const server = http.createServer(app);
const ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:5174"];
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS },
});

const PORT = process.env.PORT || 5000;

app.set("io", io);

// ===== Middlewares =====
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(morgan("dev"));
app.use(express.json());

// ===== Static files (dish images) =====
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ===== Health Check =====
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ===== Routes =====
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/menu", require("./routes/menuRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));

// ===== Error Handler (phải đặt cuối cùng) =====
app.use(errorHandler);

// ===== WebSocket =====
setupKitchenSocket(io);

// ===== Start Server =====
const startServer = async () => {
  await testConnection();
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket ready`);
  });
};

startServer();
