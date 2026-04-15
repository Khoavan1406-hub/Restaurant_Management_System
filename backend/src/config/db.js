const mysql = require("mysql2/promise");
require("dotenv").config();

// Connection pool cho hiệu suất tốt hơn single connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || "rms_user",
  password: process.env.DB_PASSWORD || "rms_password",
  database: process.env.DB_NAME || "restaurant_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

// Test kết nối khi khởi động
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL connected successfully");
    connection.release();
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
