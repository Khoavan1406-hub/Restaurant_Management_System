import LoginPage from "../pages/LoginPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import UserManagement from "../pages/admin/UserManagement";
import MenuManagement from "../pages/chef/MenuManagement";
import KitchenDisplay from "../pages/chef/KitchenDisplay";
import WaiterDashboard from "../pages/waiter/WaiterDashboard";
import OrderPage from "../pages/waiter/OrderPage";
import WaiterOrders from "../pages/waiter/WaiterOrders";
import Unauthorized from "../pages/Unauthorized";
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";

const routes = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  // ===== Admin Routes =====
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["Admin"]}>
        <DashboardLayout><AdminDashboard /></DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <ProtectedRoute allowedRoles={["Admin"]}>
        <DashboardLayout><UserManagement /></DashboardLayout>
      </ProtectedRoute>
    ),
  },
  // ===== Chef Routes =====
  {
    path: "/chef",
    element: (
      <ProtectedRoute allowedRoles={["Chef"]}>
        <DashboardLayout><MenuManagement /></DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/chef/kitchen",
    element: (
      <ProtectedRoute allowedRoles={["Chef"]}>
        <DashboardLayout><KitchenDisplay /></DashboardLayout>
      </ProtectedRoute>
    ),
  },
  // ===== Waiter Routes =====
  {
    path: "/waiter",
    element: (
      <ProtectedRoute allowedRoles={["Waiter"]}>
        <DashboardLayout><WaiterDashboard /></DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/waiter/table/:tableNumber",
    element: (
      <ProtectedRoute allowedRoles={["Waiter"]}>
        <DashboardLayout><OrderPage /></DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/waiter/orders",
    element: (
      <ProtectedRoute allowedRoles={["Waiter"]}>
        <DashboardLayout><WaiterOrders /></DashboardLayout>
      </ProtectedRoute>
    ),
  },
];

export default routes;
