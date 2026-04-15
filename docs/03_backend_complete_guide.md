# Bước 3: Backend Complete Guide — Middlewares, Services, Controllers, Routes, WebSocket

> **Mục tiêu**: Hoàn thiện toàn bộ backend cho 5 tính năng. Guide này hướng dẫn từng file cần viết, theo đúng thứ tự phụ thuộc.

---

## Thứ tự viết code (PHẢI theo đúng thứ tự)

```
① Middlewares (authMiddleware)     — Nền tảng bảo mật
② Seed Admin (migration)          — Tạo tài khoản đầu tiên
③ Feature 1: Login                — Service → Controller → Route
④ Feature 2: User Management      — Service → Controller → Route  
⑤ Feature 3: Menu Management      — Service → Controller → Route
⑥ Feature 4: Order Processing     — Service → Controller → Route
⑦ Feature 5: Kitchen Display      — Socket handler
⑧ Cập nhật server.js              — Gắn tất cả routes + socket
```

---

# PHẦN 1: MIDDLEWARES

---

## File: `src/middlewares/authMiddleware.js`

Middleware là hàm chạy **trước** controller. Nó kiểm tra JWT token và quyền truy cập.

```javascript
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
```

### Hàm 1: `verifyToken` — Kiểm tra user đã đăng nhập chưa

```javascript
const verifyToken = async (req, res, next) => {
  try {
    // 1. Lấy token từ header "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có token, vui lòng đăng nhập" });
    }

    // 2. Tách lấy phần token (bỏ chữ "Bearer ")
    const token = authHeader.split(" ")[1];

    // 3. Verify token bằng JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Kiểm tra user còn tồn tại và active không
    const user = await userModel.findById(decoded.userID);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Tài khoản không hợp lệ hoặc đã bị vô hiệu hóa" });
    }

    // 5. Gắn thông tin user vào request để controller dùng
    req.user = user;
    next(); // Chuyển tiếp sang middleware/controller tiếp theo
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token đã hết hạn, vui lòng đăng nhập lại" });
    }
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};
```

**Giải thích luồng:**
- Client gửi request với header: `Authorization: Bearer eyJhbGci...`
- Middleware tách lấy token → verify bằng secret key → decode ra `{ userID, role }`
- Kiểm tra user còn tồn tại trong DB không (phòng trường hợp user bị xóa sau khi cấp token)
- Gắn `req.user` → controller có thể dùng `req.user.userID`, `req.user.role`
- Gọi `next()` → chuyển sang controller

**Tại sao kiểm tra DB mỗi request?** Vì JWT là stateless — nếu admin xóa tài khoản một nhân viên, token cũ vẫn valid cho đến khi hết hạn. Kiểm tra DB đảm bảo real-time.

### Hàm 2: `authorizeRoles(...roles)` — Kiểm tra quyền (RBAC)

```javascript
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role '${req.user.role}' không có quyền truy cập tài nguyên này` 
      });
    }
    next();
  };
};
```

**Đây là Higher-Order Function** — hàm trả về hàm:
```javascript
// Cách sử dụng trong routes:
router.get("/users", verifyToken, authorizeRoles("Admin"), userController.getAll);
//                    ↑ phải login   ↑ chỉ Admin mới được

router.post("/menu", verifyToken, authorizeRoles("Chef", "Admin"), menuController.create);
//                   ↑ phải login   ↑ Chef HOẶC Admin đều được
```

**401 vs 403:**
- `401 Unauthorized`: Chưa đăng nhập (không có token / token sai)
- `403 Forbidden`: Đã đăng nhập nhưng không đủ quyền

### Export

```javascript
module.exports = { verifyToken, authorizeRoles };
```

---

## File: `src/middlewares/errorHandler.js`

Middleware xử lý lỗi — đặt ở cuối cùng trong `server.js`.

```javascript
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.message);

  // Lỗi validation từ express-validator
  if (err.type === "validation") {
    return res.status(400).json({ message: err.message, errors: err.errors });
  }

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
```

**Tại sao cần error handler tập trung?** Thay vì try-catch trong mỗi controller, ta throw error và để middleware này bắt hết → code controller sạch hơn.

---

# PHẦN 2: SEED DATA

---

## File: `src/migrations/002_seed_admin.sql`

Tạo tài khoản admin mặc định để đăng nhập lần đầu.

**Bước 1**: Tạo hash password bằng Node.js (chạy trong terminal):
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10))"
```

Kết quả sẽ là chuỗi dạng: `$2a$10$xxxxx...`

**Bước 2**: Tạo file SQL, thay hash vào:

```sql
-- Tạo tài khoản Admin mặc định
-- Username: admin | Password: admin123
INSERT INTO `User` (`id_number`, `username`, `passwordHash`, `phone_number`, `contact_email`, `role`)
VALUES ('000000001', 'admin', '<PASTE_HASH_Ở_ĐÂY>', '0000000000', 'admin@restaurant.com', 'Admin');

-- Thêm vào bảng Admin
INSERT INTO `Admin` (`userID`) VALUES (LAST_INSERT_ID());
```

**`LAST_INSERT_ID()`**: Lấy `userID` vừa INSERT ở câu lệnh trước → đảm bảo đúng ID.

**Sau khi tạo file, phải recreate Docker volume:**
```bash
docker compose down -v
docker compose up db -d
```

---

# PHẦN 3: FEATURE 1 — LOGIN / AUTHENTICATION

---

## File: `src/services/authService.js`

Service chứa **business logic** — không biết gì về HTTP request/response.

```javascript
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
```

### Hàm: `login(username, password)`

```javascript
const login = async (username, password) => {
  // 1. Tìm user theo username
  const user = await userModel.findByUsername(username);
  if (!user) {
    throw { status: 401, message: "Sai tên đăng nhập hoặc mật khẩu" };
  }

  // 2. Kiểm tra tài khoản có active không
  if (!user.is_active) {
    throw { status: 403, message: "Tài khoản đã bị vô hiệu hóa" };
  }

  // 3. So sánh password với hash trong DB
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw { status: 401, message: "Sai tên đăng nhập hoặc mật khẩu" };
  }

  // 4. Tạo JWT token
  const token = jwt.sign(
    { userID: user.userID, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
  );

  // 5. Trả về token + thông tin user (KHÔNG trả passwordHash)
  return {
    token,
    user: {
      userID: user.userID,
      username: user.username,
      role: user.role,
    },
  };
};

module.exports = { login };
```

**Giải thích chi tiết:**

**`bcrypt.compare(password, hash)`**: So sánh password plaintext với hash. Bcrypt tự extract salt từ hash → so sánh. Trả về `true/false`.

**Tại sao `throw { status: 401, message: "Sai tên đăng nhập hoặc mật khẩu" }`?**
- Không nói rõ "sai username" hay "sai password" → tránh kẻ tấn công biết username nào tồn tại.
- throw error để controller bắt bằng try-catch.

**`jwt.sign(payload, secret, options)`**:
- `payload`: Dữ liệu gắn vào token — chỉ gắn `userID` + `role` (đủ dùng, không nhạy cảm).
- `secret`: Key bí mật để ký — chỉ server biết.
- `expiresIn: "24h"`: Token tự hết hạn sau 24 giờ.

---

## File: `src/controllers/authController.js`

Controller **nhận request → gọi service → trả response**. Không chứa business logic.

```javascript
const authService = require("../services/authService");
const auditLogModel = require("../models/auditLogModel");

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate input cơ bản
    if (!username || !password) {
      return res.status(400).json({ message: "Vui lòng nhập username và password" });
    }

    // Gọi service xử lý logic
    const result = await authService.login(username, password);

    // Ghi audit log
    await auditLogModel.create(result.user.userID, "LOGIN", `User ${username} đăng nhập thành công`);

    // Trả kết quả
    res.json({
      message: "Đăng nhập thành công",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error); // Chuyển lỗi cho errorHandler middleware
  }
};

module.exports = { login };
```

**Tại sao dùng `next(error)` thay vì `res.status(500).json()` ngay?**
- `next(error)` chuyển lỗi cho `errorHandler` middleware → xử lý tập trung.
- errorHandler sẽ đọc `error.status` và `error.message` mà service đã throw.

---

## File: `src/routes/authRoutes.js`

Route chỉ khai báo **đường dẫn + method + middleware + controller**.

```javascript
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// POST /api/auth/login
router.post("/login", authController.login);

module.exports = router;
```

**Tại sao tách route ra file riêng?**
- `server.js` chỉ cần: `app.use("/api/auth", authRoutes)` → sạch sẽ.
- Mỗi module có file route riêng → dễ phân công team.

---

# PHẦN 4: FEATURE 2 — USER MANAGEMENT (Admin only)

---

## File: `src/services/userService.js`

```javascript
const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
```

### Hàm 1: `getAllUsers()` — Lấy danh sách nhân viên

```javascript
const getAllUsers = async () => {
  return await userModel.findAll();
};
```

### Hàm 2: `createUser(userData)` — Tạo tài khoản nhân viên mới

```javascript
const createUser = async ({ id_number, username, password, phone_number, contact_email, role }) => {
  // 1. Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // 2. Tạo user trong bảng User
  const result = await userModel.create({
    id_number, username, passwordHash, phone_number, contact_email, role,
  });

  // 3. Thêm vào bảng role tương ứng (Admin/Chef/Waiter)
  await userModel.insertRoleTable(result.insertId, role);

  return { userID: result.insertId, username, role };
};
```

**`bcrypt.genSalt(10)`**: Tạo salt ngẫu nhiên, 10 = số vòng hash (salt rounds). Càng nhiều vòng càng an toàn nhưng càng chậm. 10 là chuẩn công nghiệp.

**Tại sao hash ở Service mà không ở Model?**
- Model chỉ query DB, không biết business logic.
- Hash password là business logic → thuộc về Service.

### Hàm 3: `deleteUser(userID)` — Xóa tài khoản

```javascript
const deleteUser = async (userID) => {
  // Kiểm tra user tồn tại
  const user = await userModel.findById(userID);
  if (!user) {
    throw { status: 404, message: "Không tìm thấy user" };
  }

  // Không cho xóa chính mình
  // (adminID sẽ được truyền từ controller qua req.user.userID)
  
  await userModel.deleteById(userID);
  return { message: "Xóa tài khoản thành công" };
};
```

### Export

```javascript
module.exports = { getAllUsers, createUser, deleteUser };
```

---

## File: `src/controllers/userController.js`

```javascript
const userService = require("../services/userService");
const auditLogModel = require("../models/auditLogModel");

// GET /api/users — Lấy danh sách users
const getAll = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// POST /api/users — Tạo user mới
const create = async (req, res, next) => {
  try {
    const { id_number, username, password, phone_number, contact_email, role } = req.body;

    // Validate
    if (!id_number || !username || !password || !role) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc: id_number, username, password, role" });
    }
    if (!["Chef", "Waiter"].includes(role)) {
      return res.status(400).json({ message: "Role phải là Chef hoặc Waiter" });
    }

    const newUser = await userService.createUser({ id_number, username, password, phone_number, contact_email, role });

    // Ghi audit log
    await auditLogModel.create(req.user.userID, "CREATE_USER", `Admin tạo tài khoản ${username} (${role})`);

    res.status(201).json({ message: "Tạo tài khoản thành công", user: newUser });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id — Xóa user
const remove = async (req, res, next) => {
  try {
    const userID = parseInt(req.params.id);

    // Không cho admin tự xóa chính mình
    if (userID === req.user.userID) {
      return res.status(400).json({ message: "Không thể xóa chính tài khoản đang đăng nhập" });
    }

    await userService.deleteUser(userID);
    await auditLogModel.create(req.user.userID, "DELETE_USER", `Admin xóa tài khoản userID=${userID}`);

    res.json({ message: "Xóa tài khoản thành công" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, remove };
```

**`req.params.id`**: Lấy giá trị từ URL — `/api/users/5` → `req.params.id = "5"` (string). Phải `parseInt()`.

**`res.status(201)`**: HTTP 201 Created — dùng khi tạo resource mới thành công.

---

## File: `src/routes/userRoutes.js`

```javascript
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

// Tất cả routes đều yêu cầu: đăng nhập + role Admin
router.use(verifyToken, authorizeRoles("Admin"));

router.get("/", userController.getAll);          // GET    /api/users
router.post("/", userController.create);         // POST   /api/users
router.delete("/:id", userController.remove);    // DELETE /api/users/5

module.exports = router;
```

**`router.use(verifyToken, authorizeRoles("Admin"))`**: Apply middleware cho TẤT CẢ routes trong router này → không cần viết lại ở từng route.

---

# PHẦN 5: FEATURE 3 — MENU MANAGEMENT (Chef)

---

## File: `src/services/menuService.js`

```javascript
const dishModel = require("../models/dishModel");

const getMenu = async (role) => {
  // Chef thấy tất cả (kể cả món hết), Waiter chỉ thấy món available
  if (role === "Chef" || role === "Admin") {
    return await dishModel.findAllForChef();
  }
  return await dishModel.findAll();
};

const createDish = async (chefID, dishData) => {
  return await dishModel.create({ chefID, ...dishData });
};

const updateDish = async (dishID, dishData) => {
  const dish = await dishModel.findById(dishID);
  if (!dish) {
    throw { status: 404, message: "Không tìm thấy món ăn" };
  }
  return await dishModel.update(dishID, dishData);
};

const deleteDish = async (dishID) => {
  const dish = await dishModel.findById(dishID);
  if (!dish) {
    throw { status: 404, message: "Không tìm thấy món ăn" };
  }
  return await dishModel.deleteDish(dishID);
};

module.exports = { getMenu, createDish, updateDish, deleteDish };
```

---

## File: `src/controllers/menuController.js`

```javascript
const menuService = require("../services/menuService");
const auditLogModel = require("../models/auditLogModel");

// GET /api/menu
const getAll = async (req, res, next) => {
  try {
    const dishes = await menuService.getMenu(req.user.role);
    res.json(dishes);
  } catch (error) {
    next(error);
  }
};

// POST /api/menu
const create = async (req, res, next) => {
  try {
    const { name, description, category, price, daily_portion } = req.body;
    if (!name || !category || !price || !daily_portion) {
      return res.status(400).json({ message: "Thiếu thông tin: name, category, price, daily_portion" });
    }

    const result = await menuService.createDish(req.user.userID, { name, description, category, price, daily_portion });
    await auditLogModel.create(req.user.userID, "CREATE_DISH", `Thêm món: ${name}`);

    res.status(201).json({ message: "Thêm món thành công", dishID: result.insertId });
  } catch (error) {
    next(error);
  }
};

// PUT /api/menu/:id
const update = async (req, res, next) => {
  try {
    const dishID = parseInt(req.params.id);
    const { name, description, category, price, daily_portion } = req.body;

    await menuService.updateDish(dishID, { name, description, category, price, daily_portion });
    await auditLogModel.create(req.user.userID, "UPDATE_DISH", `Sửa món dishID=${dishID}`);

    res.json({ message: "Cập nhật món thành công" });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/menu/:id
const remove = async (req, res, next) => {
  try {
    const dishID = parseInt(req.params.id);
    await menuService.deleteDish(dishID);
    await auditLogModel.create(req.user.userID, "DELETE_DISH", `Xóa món dishID=${dishID}`);

    res.json({ message: "Xóa món thành công" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, update, remove };
```

---

## File: `src/routes/menuRoutes.js`

```javascript
const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

// Xem menu — tất cả role đều được (sau khi login)
router.get("/", verifyToken, menuController.getAll);

// Thêm/sửa/xóa — chỉ Chef hoặc Admin
router.post("/", verifyToken, authorizeRoles("Chef", "Admin"), menuController.create);
router.put("/:id", verifyToken, authorizeRoles("Chef", "Admin"), menuController.update);
router.delete("/:id", verifyToken, authorizeRoles("Chef", "Admin"), menuController.remove);

module.exports = router;
```

---

# PHẦN 6: FEATURE 4 — ORDER PROCESSING (Waiter)

---

## File: `src/services/orderService.js`

Đây là service phức tạp nhất vì có business logic nhiều.

```javascript
const orderModel = require("../models/orderModel");
const sessionModel = require("../models/sessionModel");
const dishModel = require("../models/dishModel");

// Mở phiên bàn ăn
const openSession = async (waiterID, table_number) => {
  // Kiểm tra bàn đã có phiên active chưa
  const existing = await sessionModel.findActiveByTable(table_number);
  if (existing) {
    throw { status: 400, message: `Bàn ${table_number} đang có phiên hoạt động` };
  }
  return await sessionModel.create(waiterID, table_number);
};

// Tạo đơn hàng + thêm món
const createOrder = async (waiterID, sessionID, items) => {
  // 1. Kiểm tra session tồn tại và active
  const session = await sessionModel.findById(sessionID);
  if (!session || session.status !== "Active") {
    throw { status: 400, message: "Phiên bàn không hợp lệ hoặc đã đóng" };
  }

  // 2. Kiểm tra từng món có available và đủ khẩu phần không
  for (const item of items) {
    const dish = await dishModel.findById(item.dishID);
    if (!dish) {
      throw { status: 404, message: `Món dishID=${item.dishID} không tồn tại` };
    }
    if (!dish.is_available) {
      throw { status: 400, message: `Món "${dish.name}" đã hết` };
    }
    if (dish.current_portion < item.quantity) {
      throw { status: 400, message: `Món "${dish.name}" chỉ còn ${dish.current_portion} phần` };
    }
  }

  // 3. Tạo order
  const orderResult = await orderModel.createOrder({ sessionID, waiterID });
  const orderID = orderResult.insertId;

  // 4. Thêm từng món vào order + trừ khẩu phần
  for (const item of items) {
    await orderModel.addOrderItem({
      orderID,
      dishID: item.dishID,
      quantity: item.quantity,
      special_note: item.special_note,
    });
    // Trừ khẩu phần — tự động lock món nếu hết
    await dishModel.decreasePortion(item.dishID, item.quantity);
  }

  return { orderID, itemCount: items.length };
};

// Lấy tất cả đơn trong 1 phiên (để tính bill)
const getOrdersBySession = async (sessionID) => {
  return await orderModel.findOrdersBySession(sessionID);
};

// Đóng phiên + tính bill
const closeSession = async (sessionID) => {
  const orders = await orderModel.findOrdersBySession(sessionID);

  // Tính tổng bill
  let totalBill = 0;
  for (const item of orders) {
    totalBill += item.dish_price * item.quantity;
  }

  await sessionModel.closeSession(sessionID, totalBill);
  return { sessionID, totalBill };
};

module.exports = { openSession, createOrder, getOrdersBySession, closeSession };
```

**Business logic quan trọng:**
1. **Không cho mở 2 phiên trên cùng 1 bàn** — tránh conflict.
2. **Validate trước, write sau** — kiểm tra tất cả món trước khi tạo order (nếu 1 món lỗi → không tạo gì cả).
3. **`decreasePortion`** tự động lock món khi hết → Waiter khác sẽ thấy món bị ẩn.

---

## File: `src/controllers/orderController.js`

```javascript
const orderService = require("../services/orderService");
const auditLogModel = require("../models/auditLogModel");

// POST /api/sessions — Mở phiên bàn
const openSession = async (req, res, next) => {
  try {
    const { table_number } = req.body;
    if (!table_number) {
      return res.status(400).json({ message: "Thiếu table_number" });
    }

    const result = await orderService.openSession(req.user.userID, table_number);
    await auditLogModel.create(req.user.userID, "OPEN_SESSION", `Mở bàn ${table_number}`);

    res.status(201).json({ message: "Mở phiên bàn thành công", sessionID: result.insertId });
  } catch (error) {
    next(error);
  }
};

// POST /api/orders — Tạo đơn hàng
const createOrder = async (req, res, next) => {
  try {
    const { sessionID, items } = req.body;
    // items = [{ dishID: 1, quantity: 2, special_note: "Không cay" }, ...]

    if (!sessionID || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cần sessionID và danh sách items" });
    }

    const result = await orderService.createOrder(req.user.userID, sessionID, items);
    await auditLogModel.create(req.user.userID, "CREATE_ORDER", `Tạo đơn #${result.orderID} (${result.itemCount} món)`);

    // Emit WebSocket event cho Kitchen
    const io = req.app.get("io");
    if (io) {
      io.to("kitchen").emit("new-order", { orderID: result.orderID, sessionID });
    }

    res.status(201).json({ message: "Đặt món thành công", ...result });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/session/:sessionID — Lấy đơn theo phiên
const getBySession = async (req, res, next) => {
  try {
    const sessionID = parseInt(req.params.sessionID);
    const orders = await orderService.getOrdersBySession(sessionID);
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/sessions/:id/close — Đóng phiên + tính bill
const closeSession = async (req, res, next) => {
  try {
    const sessionID = parseInt(req.params.id);
    const result = await orderService.closeSession(sessionID);
    await auditLogModel.create(req.user.userID, "CLOSE_SESSION", `Đóng phiên #${sessionID}, bill: ${result.totalBill}`);

    res.json({ message: "Thanh toán thành công", ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = { openSession, createOrder, getBySession, closeSession };
```

**WebSocket trong controller:**
```javascript
const io = req.app.get("io");
io.to("kitchen").emit("new-order", data);
```
- `req.app.get("io")`: Lấy Socket.io instance đã gắn vào Express app (sẽ setup trong server.js).
- `io.to("kitchen")`: Gửi đến tất cả client trong room "kitchen" (tức là tất cả Chef đang mở Kitchen Display).
- `emit("new-order", data)`: Gửi event tên `new-order` kèm data.

---

## File: `src/routes/orderRoutes.js`

```javascript
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

// Sessions
router.post("/sessions", verifyToken, authorizeRoles("Waiter"), orderController.openSession);
router.patch("/sessions/:id/close", verifyToken, authorizeRoles("Waiter"), orderController.closeSession);

// Orders
router.post("/", verifyToken, authorizeRoles("Waiter"), orderController.createOrder);
router.get("/session/:sessionID", verifyToken, orderController.getBySession);

module.exports = router;
```

---

# PHẦN 7: FEATURE 5 — KITCHEN DISPLAY (WebSocket)

---

## File: `src/sockets/kitchenSocket.js`

WebSocket cho phép giao tiếp **2 chiều real-time** giữa server và client, không cần client gửi request liên tục.

```javascript
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
        // status: "Cooking" hoặc "Ready"

        // 1. Cập nhật DB
        await orderModel.updateOrderStatus(orderID, status, chefID);

        // 2. Ghi audit log
        await auditLogModel.create(chefID, "UPDATE_ORDER_STATUS", `Order #${orderID} → ${status}`);

        // 3. Broadcast cho TẤT CẢ client (cả kitchen và waiter)
        io.emit("order-status-update", { orderID, status });

        console.log(`📋 Order #${orderID} → ${status}`);
      } catch (error) {
        console.error("Socket error:", error.message);
        socket.emit("error", { message: "Cập nhật trạng thái thất bại" });
      }
    });

    // Khi client ngắt kết nối
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupKitchenSocket;
```

**Giải thích luồng WebSocket:**

```
Chef mở Kitchen Display
    │
    ├── socket.connect()
    ├── socket.emit("join-room", "kitchen") ← vào room kitchen
    │
    │   Waiter tạo đơn hàng (HTTP POST)
    │        │
    │        └── server: io.to("kitchen").emit("new-order", data)
    │                                        │
    ◄────────────────────────────────────────┘
    │
    │   Chef nhấn "Start Cooking"
    ├── socket.emit("order-status-update", { orderID, status: "Cooking" })
    │        │
    │        └── server: cập nhật DB → io.emit("order-status-update", data)
    │                                        │
    │   Waiter nhận thông báo ◄──────────────┘
    │
    │   Chef nhấn "Ready"
    ├── socket.emit("order-status-update", { orderID, status: "Ready" })
    │        │
    │        └── server: cập nhật DB → io.emit("order-status-update", data)
    │                                        │
    │   Waiter nhận "Món đã sẵn sàng" ◄─────┘
```

---

# PHẦN 8: CẬP NHẬT `server.js`

---

## File: `src/server.js` (phiên bản hoàn chỉnh)

```javascript
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const { testConnection } = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");
const setupKitchenSocket = require("./sockets/kitchenSocket");

const app = express();
const server = http.createServer(app);                // HTTP server cho cả Express + Socket.io
const io = new Server(server, {
  cors: { origin: "http://localhost:5173" },           // Cho phép frontend kết nối
});

const PORT = process.env.PORT || 5000;

// ===== Gắn io vào app để controller dùng =====
app.set("io", io);

// ===== Middlewares =====
app.use(helmet());
app.use(cors({ origin: "http://localhost:5173" }));
app.use(morgan("dev"));
app.use(express.json());

// ===== Health Check =====
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ===== Routes =====
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/menu", require("./routes/menuRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));

// ===== Error Handler (phải đặt cuối cùng) =====
app.use(errorHandler);

// ===== WebSocket =====
setupKitchenSocket(io);

// ===== Start Server =====
const startServer = async () => {
  await testConnection();
  server.listen(PORT, () => {                         // Dùng server.listen, KHÔNG PHẢI app.listen
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket ready`);
  });
};

startServer();
```

**Thay đổi quan trọng so với bản cũ:**
1. `http.createServer(app)` → Tạo HTTP server riêng để Express và Socket.io **chia sẻ cùng 1 server**.
2. `new Server(server, { cors })` → Socket.io bind vào HTTP server.
3. `app.set("io", io)` → Gắn io vào Express app → controller lấy bằng `req.app.get("io")`.
4. `server.listen()` thay vì `app.listen()` → vì HTTP server quản lý cả 2.
5. `app.use(errorHandler)` → phải đặt SAU tất cả routes.

---

# PHẦN 9: TỔNG KẾT — TẤT CẢ FILE CẦN TẠO

## Checklist hoàn chỉnh

### Middlewares
- [ ] `src/middlewares/authMiddleware.js` — verifyToken + authorizeRoles
- [ ] `src/middlewares/errorHandler.js` — Xử lý lỗi tập trung

### Seed Data
- [ ] `src/migrations/002_seed_admin.sql` — Tạo tài khoản admin mặc định

### Feature 1: Login
- [ ] `src/services/authService.js` — login (bcrypt + JWT)
- [ ] `src/controllers/authController.js` — login controller
- [ ] `src/routes/authRoutes.js` — POST /api/auth/login

### Feature 2: User Management
- [ ] `src/services/userService.js` — getAllUsers, createUser, deleteUser
- [ ] `src/controllers/userController.js` — getAll, create, remove
- [ ] `src/routes/userRoutes.js` — CRUD /api/users (Admin only)

### Feature 3: Menu Management
- [ ] `src/services/menuService.js` — getMenu, createDish, updateDish, deleteDish
- [ ] `src/controllers/menuController.js` — CRUD menu
- [ ] `src/routes/menuRoutes.js` — CRUD /api/menu (Chef)

### Feature 4: Order Processing
- [ ] `src/services/orderService.js` — openSession, createOrder, closeSession
- [ ] `src/controllers/orderController.js` — session + order endpoints
- [ ] `src/routes/orderRoutes.js` — /api/orders + /api/sessions

### Feature 5: Kitchen Display
- [ ] `src/sockets/kitchenSocket.js` — WebSocket handlers

### Cập nhật
- [ ] `src/server.js` — Gắn tất cả routes + Socket.io

---

## API Endpoints tổng hợp

| Method | Endpoint | Role | Mô tả |
|--------|----------|------|--------|
| POST | `/api/auth/login` | Public | Đăng nhập |
| GET | `/api/users` | Admin | Lấy danh sách users |
| POST | `/api/users` | Admin | Tạo tài khoản |
| DELETE | `/api/users/:id` | Admin | Xóa tài khoản |
| GET | `/api/menu` | All (login) | Xem thực đơn |
| POST | `/api/menu` | Chef/Admin | Thêm món |
| PUT | `/api/menu/:id` | Chef/Admin | Sửa món |
| DELETE | `/api/menu/:id` | Chef/Admin | Xóa món |
| POST | `/api/orders/sessions` | Waiter | Mở phiên bàn |
| POST | `/api/orders` | Waiter | Tạo đơn hàng |
| GET | `/api/orders/session/:sessionID` | All (login) | Xem đơn theo phiên |
| PATCH | `/api/orders/sessions/:id/close` | Waiter | Đóng phiên + tính bill |

## WebSocket Events

| Event | Hướng | Mô tả |
|-------|-------|--------|
| `join-room` | Client → Server | Chef join room "kitchen" |
| `new-order` | Server → Kitchen | Đơn hàng mới từ Waiter |
| `order-status-update` | Both | Chef cập nhật trạng thái / Broadcast cho all |
