-- Tạo tài khoản Admin mặc định
-- Username: admin | Password: admin123
INSERT INTO `User` (`id_number`, `username`, `passwordHash`, `phone_number`, `contact_email`, `role`, `is_active`)
VALUES ('1', 'admin', '$2b$10$Io/73d20VaI7i7O0I4D7buGhF1tweUrGq4aq68JH9WHu09pqknc9S', '0000000000', 'admin@restaurant.com', 'Admin', TRUE);

-- Thêm vào bảng Admin
INSERT INTO `Admin` (`userID`) VALUES (LAST_INSERT_ID());
