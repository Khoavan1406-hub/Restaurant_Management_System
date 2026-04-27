### Need to fix and implement
1. [Admin] Create users
- The id when created must be check / modified to be formated correctly before checking / creating.

2. Rendering error (toast) - fixed: cho zindex = 99999
- Toast phải render ở trên mọi thứ, ví dụ như khi tạo user báo lỗi trùng lập, toast render ở dưới pops-up nên user không thấy được error.

3. Status - fixed: set default is_active khi create user la false
- Chưa login vẫn active

4. [Waiter] Waiter cannot change order to served

5. [Waiter] Path when click to a table should be table not order