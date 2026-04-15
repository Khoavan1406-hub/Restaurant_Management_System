# Bước 2: Viết các file Model (Backend)

> **Model là gì?** Model là layer tương tác trực tiếp với database. Mỗi model tương ứng với 1 bảng trong MySQL. Model CHỈ chứa các hàm query — không có business logic.

---

## Nguyên tắc chung khi viết Model

### 1. Cấu trúc mỗi file model

```javascript
// 1. Import pool từ config
const { pool } = require("../config/db");

// 2. Viết các hàm async (vì query DB là bất đồng bộ)
const findById = async (id) => {
  const [rows] = await pool.execute("SELECT * FROM `Table` WHERE id = ?", [id]);
  return rows[0]; // rows là mảng, lấy phần tử đầu tiên
};

// 3. Export tất cả hàm
module.exports = { findById };
```

### 2. Tại sao dùng `pool.execute()` thay vì `pool.query()`?

| | `pool.query()` | `pool.execute()` |
|---|---|---|
| SQL Injection | ⚠️ Có thể bị nếu nối chuỗi | ✅ An toàn nhờ Prepared Statement |
| Performance | Tạo query mới mỗi lần | Cache execution plan |
| Cách dùng | Giống nhau | Giống nhau |

**Luôn dùng `pool.execute()` + dấu `?` placeholder:**
```javascript
// ❌ SAI - dễ bị SQL Injection
pool.query(`SELECT * FROM User WHERE username = '${username}'`);

// ✅ ĐÚNG - Prepared Statement, an toàn
pool.execute("SELECT * FROM `User` WHERE username = ?", [username]);
```

### 3. Destructuring kết quả `[rows]`

`pool.execute()` trả về mảng 2 phần tử: `[rows, fields]`
- `rows`: Mảng dữ liệu (kết quả SELECT) hoặc object info (kết quả INSERT/UPDATE/DELETE)
- `fields`: Metadata cột (thường không cần dùng)

```javascript
// SELECT → rows là mảng các object
const [rows] = await pool.execute("SELECT * FROM `User`");
// rows = [{ userID: 1, username: "admin" }, { userID: 2, username: "chef1" }]

// INSERT → rows là object chứa insertId
const [result] = await pool.execute("INSERT INTO `User` ...", [...]);
// result = { insertId: 3, affectedRows: 1 }
```

### 4. Backtick cho tên bảng

Luôn dùng backtick `` ` `` bao quanh tên bảng vì `User`, `Order` là **reserved keywords** trong MySQL:
```javascript
// ❌ Lỗi syntax
"SELECT * FROM User"
"SELECT * FROM Order"

// ✅ Đúng
"SELECT * FROM `User`"
"SELECT * FROM `Order`"
```

---

## File 1: `src/models/userModel.js`

Bảng `User` có: `userID`, `id_number`, `username`, `passwordHash`, `phone_number`, `contact_email`, `role`, `is_active`, `created_at`, `updated_at`

### Các hàm cần viết:

```javascript
const { pool } = require("../config/db");
```

#### 1) `findByUsername(username)` — Tìm user theo username (dùng cho Login)

```javascript
const findByUsername = async (username) => {
  const [rows] = await pool.execute(
    "SELECT * FROM `User` WHERE `username` = ?",
    [username]
  );
  return rows[0]; // Trả về 1 user hoặc undefined nếu không tìm thấy
};
```

**Tại sao `rows[0]`?** Vì `username` là UNIQUE → chỉ có tối đa 1 kết quả. `rows` là mảng, lấy phần tử đầu.

#### 2) `findById(userID)` — Tìm user theo ID

```javascript
const findById = async (userID) => {
  const [rows] = await pool.execute(
    "SELECT `userID`, `id_number`, `username`, `phone_number`, `contact_email`, `role`, `is_active`, `created_at` FROM `User` WHERE `userID` = ?",
    [userID]
  );
  return rows[0];
};
```

**Lưu ý**: Không SELECT `passwordHash` — không bao giờ trả password ra ngoài trừ khi cần so sánh (login).

#### 3) `findAll()` — Lấy tất cả users (dùng cho Admin xem danh sách)

```javascript
const findAll = async () => {
  const [rows] = await pool.execute(
    "SELECT `userID`, `id_number`, `username`, `phone_number`, `contact_email`, `role`, `is_active`, `created_at` FROM `User` ORDER BY `created_at` DESC"
  );
  return rows; // Trả về mảng, không phải rows[0]
};
```

**Tại sao loại bỏ `passwordHash`?** An toàn — không bao giờ gửi hash password trong danh sách.

#### 4) `create(userData)` — Tạo user mới (dùng cho Admin tạo tài khoản)

```javascript
const create = async ({ id_number, username, passwordHash, phone_number, contact_email, role }) => {
  const [result] = await pool.execute(
    "INSERT INTO `User` (`id_number`, `username`, `passwordHash`, `phone_number`, `contact_email`, `role`) VALUES (?, ?, ?, ?, ?, ?)",
    [id_number, username, passwordHash, phone_number, contact_email, role]
  );
  return result; // { insertId: 5, affectedRows: 1 }
};
```

**Tại sao dùng destructuring `{ id_number, username, ... }`?** 
- Rõ ràng biết hàm cần những field nào.
- Thứ tự tham số không quan trọng khi gọi: `create({ username: "chef1", role: "Chef", ... })`.

#### 5) `insertRoleTable(userID, role)` — Thêm vào bảng Admin/Chef/Waiter

```javascript
const insertRoleTable = async (userID, role) => {
  const table = role; // "Admin", "Chef", hoặc "Waiter" — trùng tên bảng
  const [result] = await pool.execute(
    `INSERT INTO \`${table}\` (\`userID\`) VALUES (?)`,
    [userID]
  );
  return result;
};
```

**Lưu ý**: Ở đây ta dùng template literal cho TÊN BẢNG (không phải giá trị) — điều này an toàn vì `role` đã được validate bằng ENUM ở database level (chỉ có thể là 'Admin', 'Chef', 'Waiter').

#### 6) `deleteById(userID)` — Xóa user (Admin xóa tài khoản)

```javascript
const deleteById = async (userID) => {
  const [result] = await pool.execute(
    "DELETE FROM `User` WHERE `userID` = ?",
    [userID]
  );
  return result; // { affectedRows: 1 } hoặc { affectedRows: 0 } nếu không tìm thấy
};
```

**Tại sao không cần xóa bảng Admin/Chef/Waiter?** Vì FK có `ON DELETE CASCADE` → MySQL tự xóa bản ghi con khi cha bị xóa.

#### 7) Export tất cả

```javascript
module.exports = {
  findByUsername,
  findById,
  findAll,
  create,
  insertRoleTable,
  deleteById,
};
```

---

## File 2: `src/models/dishModel.js`

Bảng `Dish` có: `dishID`, `chefID`, `name`, `description`, `category`, `price`, `daily_portion`, `current_portion`, `is_available`, `created_at`, `updated_at`

### Các hàm cần viết:

```javascript
const { pool } = require("../config/db");
```

#### 1) `findAll()` — Lấy toàn bộ menu (Waiter xem menu để đặt món)

```javascript
const findAll = async () => {
  const [rows] = await pool.execute(
    "SELECT * FROM `Dish` WHERE `is_available` = TRUE ORDER BY `category`, `name`"
  );
  return rows;
};
```

**Tại sao filter `is_available = TRUE`?** Waiter chỉ thấy món còn phục vụ. Món hết khẩu phần bị ẩn.

#### 2) `findAllForChef()` — Lấy toàn bộ menu kể cả món hết (Chef quản lý)

```javascript
const findAllForChef = async () => {
  const [rows] = await pool.execute(
    "SELECT * FROM `Dish` ORDER BY `category`, `name`"
  );
  return rows;
};
```

#### 3) `findById(dishID)` — Tìm 1 món

```javascript
const findById = async (dishID) => {
  const [rows] = await pool.execute(
    "SELECT * FROM `Dish` WHERE `dishID` = ?",
    [dishID]
  );
  return rows[0];
};
```

#### 4) `create(dishData)` — Thêm món mới (Chef)

```javascript
const create = async ({ chefID, name, description, category, price, daily_portion }) => {
  const [result] = await pool.execute(
    "INSERT INTO `Dish` (`chefID`, `name`, `description`, `category`, `price`, `daily_portion`, `current_portion`, `is_available`) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)",
    [chefID, name, description, category, price, daily_portion, daily_portion]
  );
  return result;
};
```

**Lưu ý**: `current_portion` ban đầu = `daily_portion` (bắt đầu ngày mới, tất cả khẩu phần đều đầy).

#### 5) `update(dishID, dishData)` — Sửa thông tin món (Chef)

```javascript
const update = async (dishID, { name, description, category, price, daily_portion }) => {
  const [result] = await pool.execute(
    "UPDATE `Dish` SET `name` = ?, `description` = ?, `category` = ?, `price` = ?, `daily_portion` = ? WHERE `dishID` = ?",
    [name, description, category, price, daily_portion, dishID]
  );
  return result;
};
```

#### 6) `decreasePortion(dishID, quantity)` — Trừ khẩu phần khi đặt món

```javascript
const decreasePortion = async (dishID, quantity) => {
  const [result] = await pool.execute(
    "UPDATE `Dish` SET `current_portion` = `current_portion` - ?, `is_available` = CASE WHEN (`current_portion` - ?) <= 0 THEN FALSE ELSE TRUE END WHERE `dishID` = ? AND `current_portion` >= ?",
    [quantity, quantity, dishID, quantity]
  );
  return result;
};
```

**Đây là hàm quan trọng nhất!** Giải thích:
- `current_portion - ?`: Trừ số lượng đặt.
- `CASE WHEN ... <= 0 THEN FALSE`: Nếu hết khẩu phần → tự động `is_available = FALSE` (khóa món).
- `WHERE current_portion >= ?`: Chỉ cho trừ nếu còn đủ → **tránh khẩu phần âm**.
- Toàn bộ logic này nằm trong **1 câu SQL duy nhất** → atomic (không bị race condition khi 2 waiter đặt cùng lúc).

#### 7) `deleteDish(dishID)` — Xóa món

```javascript
const deleteDish = async (dishID) => {
  const [result] = await pool.execute(
    "DELETE FROM `Dish` WHERE `dishID` = ?",
    [dishID]
  );
  return result;
};
```

#### 8) Export

```javascript
module.exports = {
  findAll,
  findAllForChef,
  findById,
  create,
  update,
  decreasePortion,
  deleteDish,
};
```

---

## File 3: `src/models/sessionModel.js`

Bảng `TableSession` có: `sessionID`, `waiterID`, `table_number`, `start_time`, `end_time`, `status`, `total_bill`

### Các hàm cần viết:

```javascript
const { pool } = require("../config/db");
```

#### 1) `create(waiterID, table_number)` — Mở phiên bàn mới

```javascript
const create = async (waiterID, table_number) => {
  const [result] = await pool.execute(
    "INSERT INTO `TableSession` (`waiterID`, `table_number`) VALUES (?, ?)",
    [waiterID, table_number]
  );
  return result;
};
```

**Tại sao không truyền `status`, `start_time`?** Vì DB có DEFAULT: `status = 'Active'`, `start_time = CURRENT_TIMESTAMP`.

#### 2) `findActiveByTable(table_number)` — Kiểm tra bàn đã có phiên chưa

```javascript
const findActiveByTable = async (table_number) => {
  const [rows] = await pool.execute(
    "SELECT * FROM `TableSession` WHERE `table_number` = ? AND `status` = 'Active'",
    [table_number]
  );
  return rows[0]; // undefined nếu bàn trống
};
```

**Vì sao cần?** Quy tắc: 1 bàn chỉ có tối đa 1 phiên Active. Trước khi mở phiên mới phải kiểm tra.

#### 3) `findById(sessionID)` — Lấy thông tin phiên

```javascript
const findById = async (sessionID) => {
  const [rows] = await pool.execute(
    "SELECT * FROM `TableSession` WHERE `sessionID` = ?",
    [sessionID]
  );
  return rows[0];
};
```

#### 4) `closeSession(sessionID, total_bill)` — Đóng phiên (thanh toán)

```javascript
const closeSession = async (sessionID, total_bill) => {
  const [result] = await pool.execute(
    "UPDATE `TableSession` SET `status` = 'Completed', `end_time` = NOW(), `total_bill` = ? WHERE `sessionID` = ?",
    [total_bill, sessionID]
  );
  return result;
};
```

#### 5) Export

```javascript
module.exports = {
  create,
  findActiveByTable,
  findById,
  closeSession,
};
```

---

## File 4: `src/models/orderModel.js`

Bảng `Order` + `OrderItem` — quản lý đơn hàng.

```javascript
const { pool } = require("../config/db");
```

#### 1) `createOrder(orderData)` — Tạo đơn hàng mới

```javascript
const createOrder = async ({ sessionID, waiterID }) => {
  const [result] = await pool.execute(
    "INSERT INTO `Order` (`sessionID`, `waiterID`) VALUES (?, ?)",
    [sessionID, waiterID]
  );
  return result; // result.insertId = orderID vừa tạo
};
```

#### 2) `addOrderItem(itemData)` — Thêm món vào đơn

```javascript
const addOrderItem = async ({ orderID, dishID, quantity, special_note }) => {
  const [result] = await pool.execute(
    "INSERT INTO `OrderItem` (`orderID`, `dishID`, `quantity`, `special_note`) VALUES (?, ?, ?, ?)",
    [orderID, dishID, quantity, special_note || null]
  );
  return result;
};
```

**`special_note || null`**: Nếu không có ghi chú → lưu NULL thay vì chuỗi rỗng.

#### 3) `findOrdersBySession(sessionID)` — Lấy tất cả đơn trong 1 phiên (tính bill)

```javascript
const findOrdersBySession = async (sessionID) => {
  const [rows] = await pool.execute(
    `SELECT o.*, oi.itemID, oi.dishID, oi.quantity, oi.special_note,
            d.name AS dish_name, d.price AS dish_price
     FROM \`Order\` o
     JOIN \`OrderItem\` oi ON o.orderID = oi.orderID
     JOIN \`Dish\` d ON oi.dishID = d.dishID
     WHERE o.sessionID = ?
     ORDER BY o.timestamp`,
    [sessionID]
  );
  return rows;
};
```

**Đây là câu query phức tạp nhất — giải thích:**
- `JOIN OrderItem`: Kết hợp đơn hàng với chi tiết món.
- `JOIN Dish`: Lấy tên và giá món từ bảng Dish.
- `d.name AS dish_name`: Đổi tên cột tránh trùng với cột `name` khác.
- Kết quả: mỗi row = 1 món trong 1 đơn hàng, có đầy đủ thông tin.

#### 4) `updateOrderStatus(orderID, status, chefID)` — Chef cập nhật trạng thái

```javascript
const updateOrderStatus = async (orderID, status, chefID = null) => {
  const [result] = await pool.execute(
    "UPDATE `Order` SET `status` = ?, `chefID` = ? WHERE `orderID` = ?",
    [status, chefID, orderID]
  );
  return result;
};
```

#### 5) `findPendingOrders()` — Lấy đơn chờ xử lý (Kitchen Display)

```javascript
const findPendingOrders = async () => {
  const [rows] = await pool.execute(
    `SELECT o.orderID, o.sessionID, o.timestamp, o.status,
            ts.table_number,
            oi.itemID, oi.quantity, oi.special_note,
            d.name AS dish_name
     FROM \`Order\` o
     JOIN \`TableSession\` ts ON o.sessionID = ts.sessionID
     JOIN \`OrderItem\` oi ON o.orderID = oi.orderID
     JOIN \`Dish\` d ON oi.dishID = d.dishID
     WHERE o.status IN ('Not Started', 'Cooking')
     ORDER BY o.timestamp ASC`
  );
  return rows;
};
```

**IN ('Not Started', 'Cooking')**: Chef thấy cả đơn mới và đơn đang nấu.

#### 6) Export

```javascript
module.exports = {
  createOrder,
  addOrderItem,
  findOrdersBySession,
  updateOrderStatus,
  findPendingOrders,
};
```

---

## File 5: `src/models/auditLogModel.js`

Bảng `AuditLog` — ghi lại mọi thao tác quan trọng.

```javascript
const { pool } = require("../config/db");

const create = async (userID, action, detail = null) => {
  const [result] = await pool.execute(
    "INSERT INTO `AuditLog` (`userID`, `action`, `detail`) VALUES (?, ?, ?)",
    [userID, action, detail]
  );
  return result;
};

const findAll = async () => {
  const [rows] = await pool.execute(
    `SELECT al.*, u.username
     FROM \`AuditLog\` al
     LEFT JOIN \`User\` u ON al.userID = u.userID
     ORDER BY al.timestamp DESC
     LIMIT 100`
  );
  return rows;
};

module.exports = { create, findAll };
```

**`LEFT JOIN`**: Dùng LEFT thay vì INNER vì `userID` có thể NULL (user đã bị xóa nhưng log vẫn còn).

**`LIMIT 100`**: Tránh lấy hàng nghìn dòng log → tốn bộ nhớ.

---

## Tổng kết: 5 file Model cần tạo

| File | Số hàm | Mục đích |
|------|--------|----------|
| `userModel.js` | 6 hàm | findByUsername, findById, findAll, create, insertRoleTable, deleteById |
| `dishModel.js` | 7 hàm | findAll, findAllForChef, findById, create, update, decreasePortion, deleteDish |
| `sessionModel.js` | 4 hàm | create, findActiveByTable, findById, closeSession |
| `orderModel.js` | 5 hàm | createOrder, addOrderItem, findOrdersBySession, updateOrderStatus, findPendingOrders |
| `auditLogModel.js` | 2 hàm | create, findAll |

---

## Checklist

Tạo từng file theo thứ tự, copy code từ hướng dẫn trên:

- [ ] `backend/src/models/userModel.js`
- [ ] `backend/src/models/dishModel.js`
- [ ] `backend/src/models/sessionModel.js`
- [ ] `backend/src/models/orderModel.js`
- [ ] `backend/src/models/auditLogModel.js`

Sau khi viết xong tất cả models → bước tiếp theo là viết **Services** (business logic) và **Controllers** (xử lý request).
