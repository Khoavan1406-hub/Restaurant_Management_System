# Tóm tắt Thiết kế Hệ thống: Restaurant Management System

## 1. Tổng quan dự án (Project Overview)
* [cite_start]Tên dự án: Restaurant Management System[cite: 4, 5].
* [cite_start]Mục tiêu: Số hóa quy trình đặt món, quản lý đồng bộ giữa khu vực phục vụ và nhà bếp cho một nhà hàng đơn lẻ[cite: 28, 64, 65].
* [cite_start]Kiến trúc phần mềm: Mô hình Client-Server kết hợp kiến trúc MVC (Model-View-Controller) dưới dạng Modular Monolith[cite: 1055, 1056].
* [cite_start]Giao tiếp mạng: Giao thức HTTPS cho các thao tác tiêu chuẩn và WebSocket để cập nhật trạng thái thời gian thực (real-time updates)[cite: 713, 1104, 1145].

## 2. Công nghệ triển khai (Tech Stack & Environment)
* [cite_start]Client: Ứng dụng Web chạy trên trình duyệt máy tính bảng (Tablet Android/iOS) cho nhân viên phục vụ và PC/Laptop cho đầu bếp/quản lý[cite: 241, 242, 245, 1121, 1125].
* [cite_start]Application Server: Nginx hoặc Apache trên nền tảng Linux/Windows[cite: 1132, 1133].
* [cite_start]Database: MySQL hoặc PostgreSQL có hỗ trợ cơ chế Row-level locking để xử lý đồng thời[cite: 246, 752, 1137].
* [cite_start]Containerization: Sử dụng Docker Compose để triển khai môi trường phát triển và vận hành[cite: 759].

## 3. Các vai trò người dùng (User Roles)
* [cite_start]Waiter (Nhân viên phục vụ): Mở phiên bàn ăn, xem menu, tạo đơn hàng, sửa đơn hàng, và yêu cầu xuất hóa đơn thanh toán[cite: 139, 140, 141, 145, 146].
* [cite_start]Chef (Đầu bếp): Quản lý thực đơn hàng ngày, giới hạn số lượng khẩu phần món ăn, và cập nhật trạng thái chế biến đơn hàng theo thời gian thực[cite: 169, 171, 172, 173].
* [cite_start]Admin (Quản trị viên): Quản lý tài khoản hệ thống (tạo, sửa, xóa), xem báo cáo thống kê, và cấu hình thông tin nhà hàng[cite: 199, 202, 204].

## 4. Các phân hệ chức năng cốt lõi (Core Modules)
* [cite_start]Access Control & Admin: Đăng nhập với mật khẩu băm (bcrypt/Argon2), quản lý phân quyền chặt chẽ (RBAC), và tự động đăng xuất khi hết phiên (Session timeout)[cite: 108, 730, 731, 732].
* [cite_start]Waiter Order Processing: Quản lý giỏ hàng và phiên bàn ăn (Table Session), cho phép gom chung mọi đơn hàng trong cùng một phiên để xuất thành một hóa đơn duy nhất[cite: 126, 127, 630, 631, 632].
* [cite_start]Menu & Inventory Management: Trừ tự động số lượng khẩu phần ngay khi tạo đơn và khóa món ăn ngay lập tức (lock out-of-stock) khi khẩu phần về mức 0[cite: 116, 117].
* [cite_start]Kitchen Operations: Giao diện bảng điều khiển nhận đơn hàng trực tiếp qua WebSocket và cho phép đầu bếp thay đổi trạng thái (Not Started, Cooking, Ready)[cite: 1355, 1356, 1357, 1358].

## 5. Cấu trúc Cơ sở dữ liệu (Database Entities)
* [cite_start]Cấu trúc bảng User: Gồm `userID` (PK), `id_number`, `username`, `passwordHash`, `phone_number`, `contact_email`, `role`[cite: 1251, 1252].
* [cite_start]Các bảng định danh vai trò: Bảng `Admin`, `Chef`, `Waiter` chứa `userID` là khóa ngoại (FK) tham chiếu từ bảng User[cite: 1254, 1256, 1258].
* [cite_start]Cấu trúc bảng TableSession: Gồm `sessionID` (PK), `waiterID` (FK), `table_number`, `start_time`, `end_time`, `status`, `total_bill`[cite: 1266, 1267].
* [cite_start]Cấu trúc bảng Dish: Gồm `dishID` (PK), `chefID` (FK), `name`, `description`, `category`, `price`, `daily_portion`, `current_portion`, `is_available`[cite: 1268, 1269].
* [cite_start]Cấu trúc bảng Order: Gồm `orderID` (PK), `timestamp`, `status`, `chefID` (FK), `waiterID` (FK), `sessionID` (FK)[cite: 1270, 1271].
* [cite_start]Cấu trúc bảng OrderItem: Gồm `itemID` (PK), `orderID` (FK), `dishID` (FK), `quantity`, `special_note`[cite: 1273, 1274].
* [cite_start]Cấu trúc bảng AuditLog: Gồm `logID` (PK), `action`, `timestamp`, `userID` (FK) để theo dõi các thao tác trong hệ thống[cite: 1259, 1260].

## 6. Yêu cầu Setup Repository (Prompt Context)
* [cite_start]Hãy tạo cấu trúc thư mục code backend dựa trên kiến trúc Modular Monolith và MVC[cite: 1055, 1056].
* [cite_start]Viết file `docker-compose.yml` khởi tạo Application Server và Database (PostgreSQL/MySQL)[cite: 759, 1132, 1137].
* [cite_start]Chuẩn bị sẵn bộ khung kết nối WebSocket để đồng bộ trạng thái đơn hàng giữa Chef và Waiter[cite: 1104, 1145].
* [cite_start]Viết các file migration để khởi tạo các schema cho cơ sở dữ liệu đã liệt kê bên trên [cite: 1211, 1251-1274].