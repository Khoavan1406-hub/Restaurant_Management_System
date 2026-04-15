// Middleware xử lý lỗi tập trung — đặt ở cuối cùng trong server.js
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.message);

  // Lỗi MySQL duplicate entry (username/id_number trùng)
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "Dữ liệu đã tồn tại (trùng lặp)" });
  }

  // Lỗi chung
  res.status(err.status || 500).json({
    message: err.message || "Lỗi máy chủ nội bộ",
  });
};

module.exports = errorHandler;
