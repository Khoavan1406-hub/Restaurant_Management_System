# Bước 1: Setup Project Infrastructure

> **Mục tiêu**: Khởi tạo toàn bộ nền tảng dự án Restaurant Management System từ con số 0 — bao gồm cấu trúc thư mục, database, Docker, và cài đặt dependencies.

---

## 1. Tổng quan dự án

| Hạng mục | Chi tiết |
|----------|----------|
| **Tên dự án** | Restaurant Management System |
| **Kiến trúc** | Modular Monolith + Client-Server + MVC |
| **Backend** | Node.js + Express.js |
| **Frontend** | React.js (Vite) |
| **Database** | MySQL 8.0 |
| **Real-time** | Socket.io (WebSocket) |
| **Containerization** | Docker Compose |
| **Auth** | JWT + bcrypt |

### 5 tính năng trọng tâm

| # | Tính năng | Role | Mô tả |
|---|-----------|------|--------|
| 1 | Login / Authentication | All | Đăng nhập + phân quyền RBAC (3 role) |
| 2 | User Management | Admin | Tạo / xóa tài khoản nhân viên |
| 3 | Order Processing | Waiter | Mở bàn → chọn món → tạo đơn hàng |
| 4 | Kitchen Display | Chef | Nhận đơn real-time qua WebSocket |
| 5 | Menu Management | Chef | CRUD thực đơn + quản lý khẩu phần |

---

## 2. Cấu trúc thư mục

```
Restaurant_Management_System/
│
├── docker-compose.yml          # Orchestration: MySQL + Backend API
├── .gitignore                  # Ignore node_modules, .env, build, logs...
├── setup.md                    # Tóm tắt thiết kế hệ thống
├── docs/                       # Tài liệu dự án
│
├── backend/
│   ├── .env                    # Biến môi trường (KHÔNG push lên Git)
│   ├── .env.example            # Template biến môi trường
│   ├── package.json            # Dependencies + scripts
│   └── src/
│       ├── config/             # Cấu hình DB, JWT, env
│       │   └── db.js           # MySQL connection pool (mysql2/promise)
│       ├── controllers/        # Xử lý request/response (C trong MVC)
│       ├── models/             # Tương tác database (M trong MVC)
│       ├── routes/             # Định nghĩa API endpoints
│       ├── services/           # Business logic layer
│       ├── middlewares/        # Auth JWT, RBAC, error handler
│       ├── sockets/            # WebSocket handlers (Socket.io)
│       ├── validators/         # Request validation schemas
│       ├── migrations/         # Database schema SQL files
│       │   └── 001_init_schema.sql
│       └── utils/              # Helper functions
│
└── frontend/
    ├── index.html              # Entry point (Vite)
    ├── vite.config.js          # Vite configuration
    ├── package.json            # Dependencies + scripts
    └── src/
        ├── pages/              # Trang chính (Login, Dashboard...)
        ├── components/         # UI components tái sử dụng
        ├── services/           # API calls (axios)
        ├── hooks/              # Custom React hooks
        ├── context/            # React Context (AuthContext...)
        ├── layouts/            # Layout wrappers
        ├── assets/             # Hình ảnh, fonts
        ├── styles/             # Global CSS
        └── utils/              # Helper functions
```

### Tại sao cấu trúc này?

- **Modular Monolith**: Code tổ chức theo module (auth, order, menu...) nhưng deploy chung 1 service → đơn giản cho team nhỏ.
- **MVC trong backend**: `routes → controllers → services → models` — tách rõ ràng trách nhiệm từng layer.
- **Frontend theo feature**: `pages/` chứa trang, `components/` chứa UI tái sử dụng, `services/` tách riêng logic gọi API.

---

## 3. Docker Compose — MySQL Container

File `docker-compose.yml` tại root project:

```yaml
services:
  db:
    image: mysql:8.0
    container_name: rms_mysql
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: restaurant_db
      MYSQL_USER: rms_user
      MYSQL_PASSWORD: rms_password
    volumes:
      - mysql_data:/var/lib/mysql                        # Persist data
      - ./backend/src/migrations:/docker-entrypoint-initdb.d  # Auto-run SQL
```

### Giải thích cho phỏng vấn

> **Q: Tại sao dùng Docker cho MySQL?**
> - Đảm bảo môi trường nhất quán giữa các thành viên (không cần cài MySQL local).
> - `docker-entrypoint-initdb.d` tự động chạy file `.sql` khi container khởi tạo lần đầu → không cần chạy migration thủ công.
> - Volume `mysql_data` giữ dữ liệu bền vững ngay cả khi container bị xóa.

> **Q: Tại sao dùng connection pool thay vì single connection?**
> - Pool quản lý nhiều connection đồng thời → xử lý được nhiều request cùng lúc.
> - Tránh overhead tạo/đóng connection mỗi request.
> - `connectionLimit: 10` = tối đa 10 connection song song, phù hợp cho quy mô nhà hàng đơn lẻ.

---

## 4. Database Schema — MySQL Migration

File `backend/src/migrations/001_init_schema.sql` khởi tạo **9 bảng**:

### Sơ đồ quan hệ (ERD tóm tắt)

```
┌──────────┐         ┌──────────┐
│   User   │◄───────►│  Admin   │  (1:1, kế thừa role)
│  userID  │◄───────►│  Chef    │
│  role    │◄───────►│  Waiter  │
└────┬─────┘         └──────────┘
     │
     │ FK: waiterID, chefID
     ▼
┌──────────────┐      ┌──────────┐
│ TableSession │◄─────│  Order   │  (1:N — 1 phiên có nhiều đơn)
│  sessionID   │      │ orderID  │
│  waiterID    │      │ status   │
│  status      │      └────┬─────┘
└──────────────┘           │
                           │ FK: orderID
                           ▼
                    ┌────────────┐      ┌──────────┐
                    │ OrderItem  │─────►│   Dish   │  (N:1)
                    │  itemID    │      │  dishID  │
                    │  quantity  │      │  price   │
                    │  dishID    │      │ portion  │
                    └────────────┘      └──────────┘

┌──────────┐
│ AuditLog │  (Ghi log mọi thao tác hệ thống)
│  logID   │
│  userID  │
│  action  │
└──────────┘
```

### Các bảng chi tiết

| Bảng | Cột chính | Mục đích |
|------|-----------|----------|
| `User` | userID, username, passwordHash, role | Tài khoản hệ thống (3 roles) |
| `Admin/Chef/Waiter` | userID (FK) | Bảng kế thừa role từ User |
| `Dish` | dishID, name, price, daily_portion, current_portion, is_available | Thực đơn + quản lý khẩu phần |
| `TableSession` | sessionID, waiterID, table_number, status, total_bill | Phiên bàn ăn |
| `Order` | orderID, sessionID, waiterID, chefID, status | Đơn hàng |
| `OrderItem` | itemID, orderID, dishID, quantity, special_note | Chi tiết từng món trong đơn |
| `AuditLog` | logID, userID, action, timestamp | Nhật ký hệ thống |

### Giải thích cho phỏng vấn

> **Q: Tại sao tách bảng Admin/Chef/Waiter thay vì chỉ dùng cột `role` trong User?**
> - Đây là pattern **Table-per-Type Inheritance** trong database design.
> - Cho phép mở rộng: nếu sau này Chef cần thêm trường `specialization`, ta chỉ thêm vào bảng Chef mà không ảnh hưởng User.
> - FK constraint đảm bảo tính toàn vẹn: chỉ user có role Chef mới xuất hiện trong bảng Chef.

> **Q: Tại sao Order status dùng ENUM?**
> - Giới hạn giá trị hợp lệ ngay tại database level → tránh lỗi dữ liệu bẩn.
> - Luồng trạng thái rõ ràng: `Not Started → Cooking → Ready → Completed`

> **Q: Tại sao dùng `ON DELETE RESTRICT` cho Order → TableSession?**
> - Không cho phép xóa phiên bàn nếu còn đơn hàng → bảo vệ tính toàn vẹn dữ liệu.
> - Ngược lại, OrderItem dùng `ON DELETE CASCADE` → xóa đơn hàng sẽ xóa luôn chi tiết.

---

## 5. Backend Dependencies

```bash
npm install express mysql2 dotenv bcryptjs jsonwebtoken socket.io cors helmet morgan express-validator
npm install --save-dev nodemon
```

| Package | Vai trò | Tại sao cần? |
|---------|---------|--------------|
| `express` | Web framework | Xử lý HTTP routing, middleware pipeline |
| `mysql2` | MySQL driver | Dùng `mysql2/promise` cho async/await, hỗ trợ connection pool |
| `dotenv` | Env loader | Tách config ra khỏi code (12-Factor App) |
| `bcryptjs` | Password hashing | Hash mật khẩu 1 chiều, chống rainbow table attack |
| `jsonwebtoken` | JWT | Stateless authentication, không cần lưu session trên server |
| `socket.io` | WebSocket | Real-time 2 chiều: Chef nhận đơn mới, Waiter biết món ready |
| `cors` | CORS middleware | Cho phép Frontend (port 5173) gọi Backend (port 5000) |
| `helmet` | Security headers | Tự động set HTTP headers bảo mật (X-Frame-Options, CSP...) |
| `morgan` | HTTP logger | Log request để debug (method, URL, status, response time) |
| `express-validator` | Validation | Validate & sanitize input → chống SQL injection, XSS |
| `nodemon` | Dev tool | Auto-restart server khi code thay đổi |

### Giải thích cho phỏng vấn

> **Q: Tại sao chọn `bcryptjs` thay vì `bcrypt`?**
> - `bcryptjs` là pure JavaScript, không cần compile native C++ → dễ cài trên mọi OS.
> - `bcrypt` native nhanh hơn một chút nhưng gây lỗi build trên Windows.

> **Q: JWT vs Session-based auth, khi nào dùng cái nào?**
> - JWT (dự án này): Stateless, server không lưu state → dễ scale, phù hợp SPA (React).
> - Session: Stateful, cần Redis/DB lưu session → dễ revoke nhưng khó scale ngang.

---

## 6. Frontend Dependencies

```bash
npx create-vite@latest ./ --template react
npm install react-router-dom axios socket.io-client react-icons react-hot-toast
```

| Package | Vai trò |
|---------|---------|
| `react` + `vite` | UI framework + bundler (nhanh hơn CRA) |
| `react-router-dom` | Client-side routing (SPA navigation) |
| `axios` | HTTP client (gọi API, tự attach JWT token) |
| `socket.io-client` | WebSocket client (nhận real-time updates) |
| `react-icons` | Thư viện icon (FontAwesome, Material...) |
| `react-hot-toast` | Toast notification (thông báo thành công/lỗi) |

---

## 7. Environment Variables

File `backend/.env`:

```env
DB_HOST=localhost        # Host MySQL (Docker: "db")
DB_PORT=3306             # Port MySQL mặc định
DB_USER=rms_user         # User MySQL (không dùng root)
DB_PASSWORD=rms_password # Password MySQL
DB_NAME=restaurant_db    # Tên database

JWT_SECRET=super_secret  # Secret key ký JWT token
JWT_EXPIRES_IN=24h       # Token hết hạn sau 24 giờ

PORT=5000                # Port backend API server
```

### Giải thích cho phỏng vấn

> **Q: Tại sao không hardcode config trong code?**
> - Nguyên tắc **12-Factor App**: Config thay đổi giữa các môi trường (dev/staging/prod) phải nằm trong env.
> - File `.env` nằm trong `.gitignore` → không push password lên Git.
> - `.env.example` là template cho team biết cần config gì.

---

## 8. Git Ignore

File `.gitignore` ignore những gì?

| Pattern | Lý do |
|---------|-------|
| `node_modules/` | Dependencies nặng, tái tạo bằng `npm install` |
| `.env` | Chứa secrets (password, JWT key) |
| `dist/`, `build/` | Build output, tái tạo bằng `npm run build` |
| `*.log` | Log files không cần version control |
| `.vscode/`, `.idea/` | Config cá nhân của editor |
| `coverage/` | Test coverage reports |

---

## 9. Commands tổng hợp

```bash
# Khởi động MySQL container
docker compose up db -d

# Chạy Backend (dev mode, auto-restart)
cd backend && npm run dev

# Chạy Frontend (Vite dev server)
cd frontend && npm run dev

# Xem logs MySQL container
docker compose logs db

# Dừng tất cả containers
docker compose down
```

---

## 10. Hướng dẫn code: `docker-compose.yml` (từng dòng)

Đây là file orchestration — nó khai báo tất cả services (MySQL, Backend) và cách chúng kết nối với nhau.

```yaml
version: "3.8"
```
- Khai báo phiên bản Docker Compose syntax. `3.8` là bản ổn định, hỗ trợ đầy đủ `healthcheck`, `depends_on.condition`.

```yaml
services:
  db:
    image: mysql:8.0
```
- `services`: Danh sách các container sẽ chạy.
- `db`: Tên service (các service khác sẽ gọi MySQL bằng hostname `db`).
- `image: mysql:8.0`: Dùng Docker image chính thức của MySQL phiên bản 8.0 từ Docker Hub.

```yaml
    container_name: rms_mysql
    restart: unless-stopped
```
- `container_name`: Đặt tên cố định thay vì tên ngẫu nhiên → dễ quản lý khi chạy `docker ps`.
- `restart: unless-stopped`: Container tự restart nếu crash, **trừ khi** ta chủ động `docker stop`.
  - Các option khác: `no` (không restart), `always` (luôn restart kể cả khi stop thủ công), `on-failure` (chỉ restart khi exit code ≠ 0).

```yaml
    ports:
      - "3306:3306"
```
- **Port mapping**: `host:container`. Máy host port 3306 → container port 3306.
- Nhờ vậy, từ máy local ta có thể kết nối MySQL qua `localhost:3306`.
- **Lưu ý**: Nếu máy đã cài MySQL local chiếm port 3306, đổi thành `"3307:3306"` (host dùng 3307, container vẫn 3306).

```yaml
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-restaurant_db}
      MYSQL_USER: ${MYSQL_USER:-rms_user}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-rms_password}
```
- **Biến môi trường** mà MySQL image đọc khi khởi tạo lần đầu tiên:
  - `MYSQL_ROOT_PASSWORD`: Mật khẩu root (bắt buộc).
  - `MYSQL_DATABASE`: Tự động tạo database với tên này.
  - `MYSQL_USER` + `MYSQL_PASSWORD`: Tự động tạo user với quyền FULL trên database trên.
- `${MYSQL_ROOT_PASSWORD:-rootpassword}`: Cú pháp này có nghĩa: **đọc từ file `.env`, nếu không có thì dùng giá trị mặc định** `rootpassword`.
  - Tại sao? Vì mỗi người trong team có thể dùng password khác nhau, password thật nằm trong `.env` (không push Git).

```yaml
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/src/migrations:/docker-entrypoint-initdb.d
```
- **Volume 1** — `mysql_data:/var/lib/mysql`:
  - `mysql_data` là **named volume** do Docker quản lý.
  - `/var/lib/mysql` là nơi MySQL lưu dữ liệu bên trong container.
  - **Tại sao cần?** Container là ephemeral (tạm thời) — nếu xóa container mà không có volume, toàn bộ data mất. Volume giữ data bền vững.

- **Volume 2** — `./backend/src/migrations:/docker-entrypoint-initdb.d`:
  - Mount thư mục `migrations/` của project vào `/docker-entrypoint-initdb.d` trong container.
  - **MySQL image có cơ chế đặc biệt**: Lần đầu khởi tạo, nó tự động chạy tất cả file `.sql`, `.sh`, `.sql.gz` trong thư mục này theo thứ tự alphabet.
  - Nghĩa là file `001_init_schema.sql` sẽ tự chạy → tạo bảng mà không cần thao tác thủ công.
  - **Lưu ý**: Chỉ chạy lần đầu khi volume `mysql_data` trống. Nếu muốn chạy lại: `docker compose down -v` (xóa volume) rồi `docker compose up`.

```yaml
    command: --default-authentication-plugin=mysql_native_password
             --character-set-server=utf8mb4
             --collation-server=utf8mb4_unicode_ci
```
- `--default-authentication-plugin=mysql_native_password`: MySQL 8 mặc định dùng `caching_sha2_password`, nhưng nhiều client (bao gồm `mysql2` Node.js) tương thích tốt hơn với `mysql_native_password`.
- `--character-set-server=utf8mb4`: Hỗ trợ đầy đủ Unicode (bao gồm emoji, tiếng Việt có dấu).
- `--collation-server=utf8mb4_unicode_ci`: Quy tắc so sánh chuỗi — `ci` = case-insensitive (không phân biệt hoa thường khi tìm kiếm).

```yaml
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD:-rootpassword}"]
      interval: 10s
      timeout: 5s
      retries: 5
```
- **Healthcheck**: Docker định kỳ kiểm tra MySQL còn sống không.
  - `mysqladmin ping`: Lệnh kiểm tra nhanh MySQL có phản hồi không.
  - `interval: 10s`: Kiểm tra mỗi 10 giây.
  - `timeout: 5s`: Nếu 5 giây không phản hồi → coi là fail.
  - `retries: 5`: Fail 5 lần liên tiếp → đánh dấu container `unhealthy`.
- **Tại sao cần?** Vì Backend `depends_on: db: condition: service_healthy` — Backend chỉ khởi động khi MySQL thực sự sẵn sàng, không chỉ khi container chạy (container chạy ≠ MySQL sẵn sàng nhận kết nối).

```yaml
  api:
    build: ./backend
    container_name: rms_backend
    depends_on:
      db:
        condition: service_healthy
```
- `build: ./backend`: Docker build Backend image từ `Dockerfile` trong thư mục `backend/`.
- `depends_on` + `condition: service_healthy`: **Đợi MySQL healthy** mới khởi động Backend.
  - Nếu chỉ dùng `depends_on: [db]` không có condition → Backend có thể start trước khi MySQL sẵn sàng → connection refused error.

```yaml
    volumes:
      - ./backend:/app
      - /app/node_modules
```
- `./backend:/app`: **Bind mount** — map code từ máy host vào container. Khi thay đổi code trên máy, container thấy ngay (kết hợp nodemon → auto-restart).
- `/app/node_modules`: **Anonymous volume** — ngăn `node_modules` của host ghi đè `node_modules` của container.
  - Tại sao? Vì `node_modules` trên Windows khác Linux (native binaries), nên container cần giữ bản `node_modules` riêng.

```yaml
volumes:
  mysql_data:
    driver: local
```
- Khai báo named volume `mysql_data` ở top level. `driver: local` lưu trên ổ đĩa máy host.

---

## 11. Hướng dẫn code: `backend/src/config/db.js` (từng dòng)

File này tạo **Connection Pool** để backend kết nối MySQL.

```javascript
const mysql = require("mysql2/promise");
```
- Import `mysql2/promise` thay vì `mysql2` thường.
- **Tại sao `/promise`?** Để sử dụng `async/await` thay vì callback hell:
  ```javascript
  // ❌ Callback hell (mysql2 thường)
  connection.query("SELECT...", (err, results) => {
    connection.query("INSERT...", (err2, results2) => { ... });
  });

  // ✅ Async/await (mysql2/promise)
  const [rows] = await pool.execute("SELECT...");
  const [result] = await pool.execute("INSERT...");
  ```

```javascript
require("dotenv").config();
```
- Load file `.env` vào `process.env`. Sau dòng này, `process.env.DB_HOST` có giá trị `"localhost"`.
- **Phải gọi trước khi đọc `process.env`**, nếu không các biến sẽ là `undefined`.

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || "rms_user",
  password: process.env.DB_PASSWORD || "rms_password",
  database: process.env.DB_NAME || "restaurant_db",
```
- **`createPool`** thay vì `createConnection`:

| | `createConnection` | `createPool` |
|---|---|---|
| Số connection | 1 | Nhiều (default 10) |
| Đồng thời | Chặn nếu query đang chạy | Nhiều query song song |
| Phù hợp | Script chạy 1 lần | Web server nhiều request |

- `process.env.DB_HOST || "localhost"`: Đọc từ `.env`, nếu không có thì fallback về giá trị mặc định.
- `parseInt(process.env.DB_PORT, 10)`: Ép kiểu string → number (env luôn trả về string). Tham số `10` là hệ thập phân.

```javascript
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});
```
- `waitForConnections: true`: Khi hết connection trong pool, request mới sẽ **đợi** thay vì bị reject ngay.
- `connectionLimit: 10`: Tối đa 10 connection đồng thời. Nếu cả 10 đang bận, request thứ 11 sẽ đợi.
  - **Tại sao 10?** Quy tắc chung: `connectionLimit = (core_count * 2) + effective_spindle_count`. Với server nhỏ, 10 là hợp lý.
- `queueLimit: 0`: Không giới hạn hàng đợi (0 = unlimited). Tất cả request đều được xếp hàng.
- `charset: "utf8mb4"`: Đồng bộ charset với MySQL server → tránh lỗi encoding tiếng Việt.

```javascript
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
```
- **Hàm test kết nối** — gọi khi server khởi động để đảm bảo MySQL sẵn sàng.
- `pool.getConnection()`: Lấy 1 connection từ pool. Nếu MySQL chưa sẵn sàng → throw error.
- `connection.release()`: **Trả connection về pool** (không phải đóng). Nếu quên release → connection bị giữ mãi → pool cạn kiệt → app treo.
  - **Đây là lỗi phổ biến nhất**: Quên `.release()` sau khi dùng `getConnection()`.
  - Mẹo: Dùng `pool.execute()` hoặc `pool.query()` trực tiếp — chúng tự động get + release.
- `process.exit(1)`: Thoát app với mã lỗi 1 nếu không kết nối được DB. Tại sao? Vì app không thể hoạt động mà không có database.

```javascript
module.exports = { pool, testConnection };
```
- Export ra 2 thứ:
  - `pool`: Dùng trong models để chạy query — `const { pool } = require("../config/db");`
  - `testConnection`: Gọi 1 lần khi server start.

---

## 12. Hướng dẫn code: `001_init_schema.sql` (Patterns quan trọng)

### Pattern 1: `CREATE TABLE IF NOT EXISTS`

```sql
CREATE TABLE IF NOT EXISTS `User` (
```
- `IF NOT EXISTS`: An toàn — không lỗi nếu bảng đã tồn tại (idempotent).
- Backtick `` `User` ``: Bắt buộc vì `User`, `Order` là **reserved keywords** trong MySQL. Không có backtick → syntax error.

### Pattern 2: Primary Key + Auto Increment

```sql
    `userID` INT AUTO_INCREMENT PRIMARY KEY,
```
- `INT`: Kiểu số nguyên 4 bytes (max ~2.1 tỷ). Đủ cho nhà hàng.
- `AUTO_INCREMENT`: MySQL tự tăng ID mỗi khi INSERT. Không cần truyền giá trị.
- `PRIMARY KEY`: Duy nhất + không null + tự tạo clustered index.
  - **Clustered index**: Dữ liệu vật lý trên ổ đĩa được sắp xếp theo PK → truy vấn theo PK rất nhanh.

### Pattern 3: Constraints (Ràng buộc)

```sql
    `id_number`  VARCHAR(20) NOT NULL UNIQUE,
    `username`   VARCHAR(50) NOT NULL UNIQUE,
```
- `NOT NULL`: Bắt buộc phải có giá trị — bảo vệ ở database level, không phụ thuộc vào code.
- `UNIQUE`: Không cho phép trùng — 2 user không thể cùng username/CMND.
- **Tại sao đặt constraint ở DB level chứ không chỉ validate ở code?**
  - Code có thể bị bypass (gọi API trực tiếp, bug logic).
  - Database là **hàng phòng thủ cuối cùng** (defense in depth).

### Pattern 4: ENUM cho trạng thái

```sql
    `role`   ENUM('Admin', 'Chef', 'Waiter') NOT NULL,
    `status` ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Active',
```
- `ENUM`: Chỉ chấp nhận các giá trị đã liệt kê → data integrity.
- `DEFAULT 'Active'`: Nếu INSERT mà không truyền status → tự động là 'Active'.
- **Nhược điểm ENUM**: Khó thay đổi (thêm/xóa giá trị phải ALTER TABLE). Nếu trạng thái thay đổi thường xuyên → nên dùng bảng lookup riêng.

### Pattern 5: Foreign Key Constraints

```sql
    CONSTRAINT `fk_session_waiter`
        FOREIGN KEY (`waiterID`) REFERENCES `Waiter`(`userID`)
        ON DELETE RESTRICT ON UPDATE CASCADE
```
- `CONSTRAINT fk_session_waiter`: Đặt tên cho FK → dễ debug khi bị lỗi.
- `FOREIGN KEY (waiterID) REFERENCES Waiter(userID)`: Giá trị `waiterID` bắt buộc phải tồn tại trong bảng Waiter.
- **Hành vi khi xóa/sửa bản ghi cha:**

| Action | Ý nghĩa | Khi nào dùng? |
|--------|---------|---------------|
| `RESTRICT` | Cấm xóa/sửa nếu còn bản ghi con tham chiếu | Bảo vệ dữ liệu quan trọng (Order → Session) |
| `CASCADE` | Xóa/sửa luôn bản ghi con theo | Quan hệ "chứa" (OrderItem thuộc Order) |
| `SET NULL` | Đặt FK thành NULL khi cha bị xóa | Tham chiếu tùy chọn (Dish.chefID — dish vẫn tồn tại dù chef bị xóa) |

- **Ví dụ thực tế trong project:**
  - `Order → TableSession`: **RESTRICT** — không thể xóa phiên bàn khi còn đơn hàng chưa xử lý.
  - `OrderItem → Order`: **CASCADE** — xóa đơn hàng → xóa luôn tất cả món trong đơn.
  - `Dish → Chef`: **SET NULL** — xóa tài khoản chef → món ăn vẫn còn, chỉ mất tham chiếu chefID.

### Pattern 6: Timestamps tự động

```sql
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```
- `DEFAULT CURRENT_TIMESTAMP`: Khi INSERT → tự ghi thời gian hiện tại.
- `ON UPDATE CURRENT_TIMESTAMP`: Khi UPDATE bất kỳ cột nào → tự cập nhật thời gian.
- **Tại sao cần?** Audit trail — biết bản ghi được tạo khi nào, sửa lần cuối khi nào. Rất hữu ích khi debug production.

### Pattern 7: CHECK Constraint

```sql
    `price`    DECIMAL(12, 2) NOT NULL CHECK (`price` >= 0),
    `quantity` INT            NOT NULL CHECK (`quantity` > 0),
```
- `DECIMAL(12, 2)`: 12 chữ số tổng, 2 chữ số thập phân. Tối đa 9,999,999,999.99.
  - **Tại sao dùng DECIMAL thay vì FLOAT cho tiền?** FLOAT có lỗi làm tròn: `0.1 + 0.2 = 0.30000000000000004`. DECIMAL tính chính xác.
- `CHECK (price >= 0)`: Giá không được âm. MySQL 8.0.16+ mới hỗ trợ CHECK thực sự (trước đó bị ignore).

### Pattern 8: Indexes cho hiệu suất

```sql
CREATE INDEX idx_user_role      ON `User`(`role`);
CREATE INDEX idx_order_status   ON `Order`(`status`);
CREATE INDEX idx_session_status ON `TableSession`(`status`);
```
- **Index giúp gì?** Không có index → MySQL phải quét toàn bộ bảng (Full Table Scan). Có index → nhảy trực tiếp đến vị trí cần tìm.
- **Tại sao index các cột này?**
  - `role`: Lọc user theo role rất thường xuyên (hiển thị danh sách waiter, chef).
  - `status`: Truy vấn "lấy tất cả order đang Cooking" chạy liên tục từ Kitchen Display.
  - `waiterID`, `sessionID`: JOIN giữa các bảng → cần index trên cột FK.
- **Trade-off**: Index tăng tốc SELECT nhưng làm chậm INSERT/UPDATE (phải cập nhật cả index). Chỉ index những cột thường query.

### Pattern 9: ENGINE và CHARSET

```sql
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
- `ENGINE=InnoDB`: Storage engine mặc định của MySQL 8. Hỗ trợ:
  - **Transaction**: ACID compliance (Atomicity, Consistency, Isolation, Durability).
  - **Row-level locking**: Không lock cả bảng khi UPDATE → nhiều user đồng thời không block nhau.
  - **Foreign Keys**: MyISAM không hỗ trợ FK.
- `utf8mb4`: "True UTF-8" — hỗ trợ 4-byte characters (emoji 🍕, tiếng Việt đầy đủ).
  - `utf8` trong MySQL chỉ 3-byte = không hỗ trợ emoji. Luôn dùng `utf8mb4`.
- `utf8mb4_unicode_ci`: `ci` = Case Insensitive. Tìm kiếm "Phở" sẽ match "phở", "PHỞ".

---

## 13. Hướng dẫn code: `backend/package.json` (Scripts)

```json
{
  "main": "src/server.js",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

- `"main": "src/server.js"`: Entry point của ứng dụng. Khi chạy `node .` hoặc được require bởi module khác, file này chạy đầu tiên.
- `"dev"`: Dùng `nodemon` — tự detect thay đổi file → restart server. Lý tưởng cho development.
- `"start"`: Dùng `node` thuần — dùng cho production (không cần auto-restart, có PM2 hoặc Docker thay).

**Chạy bằng cách:**
```bash
npm run dev    # Development (auto-restart)
npm start      # Production (cũng giống npm run start)
```

> **Lưu ý**: `npm start` không cần `run` vì `start` là script đặc biệt của npm. Các script khác phải dùng `npm run <tên>`.

---

## 14. Luồng dữ liệu tổng quan (Request Flow)

Khi một request từ Frontend đến Backend, nó đi qua các layer theo thứ tự:

```
Browser (React)
    │
    │  HTTP Request / WebSocket
    ▼
┌─────────────────────────────────────────────────┐
│  Express Server (server.js)                     │
│                                                 │
│  ① Middlewares (tuần tự, từ trên xuống)         │
│     ├── helmet()      → Set security headers    │
│     ├── cors()        → Cho phép cross-origin   │
│     ├── morgan()      → Log request             │
│     ├── express.json()→ Parse JSON body         │
│     └── authMiddleware→ Verify JWT token        │
│                                                 │
│  ② Routes                                       │
│     POST /api/auth/login → authController       │
│     GET  /api/orders     → orderController      │
│                                                 │
│  ③ Controllers (nhận req, gọi service, trả res) │
│     orderController.create(req, res)            │
│                                                 │
│  ④ Services (business logic)                    │
│     orderService.createOrder(data)              │
│     → Kiểm tra portion, tính giá, validate     │
│                                                 │
│  ⑤ Models (tương tác database)                  │
│     orderModel.insert(orderData)                │
│     → pool.execute("INSERT INTO...")            │
│                                                 │
│  ⑥ Database (MySQL)                             │
│     → Lưu dữ liệu, trả kết quả                │
└─────────────────────────────────────────────────┘
    │
    │  JSON Response
    ▼
Browser (React) → Cập nhật UI
```

### Tại sao tách thành nhiều layer?

| Nguyên tắc | Giải thích |
|-------------|------------|
| **Separation of Concerns** | Mỗi layer chỉ làm 1 việc → dễ hiểu, dễ sửa |
| **Testability** | Test service mà không cần HTTP server, test model mà không cần business logic |
| **Reusability** | Service có thể gọi từ cả REST API lẫn WebSocket handler |
| **Maintainability** | Thay đổi database (MySQL → PostgreSQL) chỉ sửa Model, không ảnh hưởng Controller/Service |

---

## 15. Checklist hoàn thành Bước 1

- [x] Tạo cấu trúc thư mục Backend (MVC: config, controllers, models, routes, services, middlewares, sockets, utils, migrations, validators)
- [x] Tạo cấu trúc thư mục Frontend (React: pages, components, services, hooks, context, layouts, assets, styles, utils)
- [x] Viết `docker-compose.yml` (MySQL 8.0 + Backend API)
- [x] Viết `001_init_schema.sql` (9 bảng + FK + indexes)
- [x] Cấu hình `db.js` (MySQL connection pool)
- [x] Cài đặt Backend dependencies (express, mysql2, jwt, socket.io...)
- [x] Khởi tạo Frontend React + Vite + cài dependencies
- [x] Setup `.env` / `.env.example` / `.gitignore`

---

> **Bước tiếp theo**: Implement Backend server.js → Auth (Login/JWT) → User Management (Admin CRUD) → Order Processing → Kitchen Display (WebSocket)
