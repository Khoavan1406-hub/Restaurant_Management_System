# 🍽️ Restaurant Management System

A full-stack restaurant management system with role-based access control, real-time kitchen display, and order processing.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, React Router, Axios, Socket.io Client |
| **Backend** | Node.js, Express, Socket.io, JWT, Bcrypt, Multer |
| **Database** | MySQL 8.0 (Docker) |
| **Styling** | Vanilla CSS, Dark Theme, Inter Font |

## Features

### 🔐 Authentication
- JWT-based login with bcrypt password hashing
- Role-based access control (Admin, Chef, Waiter)
- Protected routes with auto-redirect

### 👨‍💼 Admin — Staff Management
- Create/delete staff accounts (Chef, Waiter)
- View all staff with role badges and status

### 👨‍🍳 Chef — Menu & Kitchen
- **Menu Management**: Add/edit/delete dishes with image upload, daily portions, auto sold-out
- **Kitchen Display**: Real-time order feed via WebSocket, update status (Pending → Cooking → Ready)

### 🧑‍🍳 Waiter — Tables & Orders
- **Table Layout**: 12-table grid, persistent sessions from DB
- **Order Page**: Browse menu with images, add to cart, place orders, checkout & close table

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Database connection pool
│   │   ├── controllers/    # Request handlers
│   │   ├── middlewares/     # Auth, upload, error handler
│   │   ├── migrations/     # SQL schema + seeds
│   │   ├── models/         # Database queries
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   ├── sockets/        # WebSocket handlers
│   │   └── server.js       # Entry point
│   └── uploads/            # Uploaded dish images
├── frontend/
│   └── src/
│       ├── api/            # Centralized API calls
│       ├── components/     # Reusable components (Modal, ProtectedRoute)
│       ├── context/        # Auth context provider
│       ├── hooks/          # Custom hooks (useSocket)
│       ├── layouts/        # Dashboard layout with sidebar
│       ├── pages/          # Role-based page components
│       └── routes/         # Centralized route config
└── docker-compose.yml      # MySQL container
```

## Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop

### 1. Start Database
```bash
docker compose up db -d
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Open Browser
Navigate to `http://localhost:5173`

### Default Login
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |

> Create Chef and Waiter accounts from the Admin dashboard.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | — | Login |
| GET | `/api/users` | Admin | List staff |
| POST | `/api/users` | Admin | Create staff |
| DELETE | `/api/users/:id` | Admin | Delete staff |
| GET | `/api/menu` | All | List dishes |
| POST | `/api/menu` | Chef | Add dish (multipart) |
| PUT | `/api/menu/:id` | Chef | Update dish (multipart) |
| DELETE | `/api/menu/:id` | Chef | Delete dish |
| GET | `/api/orders/sessions/active` | Waiter | Active sessions |
| POST | `/api/orders/sessions` | Waiter | Open table |
| PATCH | `/api/orders/sessions/:id/close` | Waiter | Checkout |
| POST | `/api/orders` | Waiter | Place order |
| GET | `/api/orders/session/:id` | All | Orders by session |
| GET | `/api/orders/pending` | Chef | Pending orders |

## License
MIT