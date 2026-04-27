import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiHome, FiUsers, FiBookOpen, FiShoppingCart, FiMonitor, FiLogOut, FiMenu, FiX, FiClipboard } from "react-icons/fi";
import { useState } from "react";
import ThemeSwitcher from "../components/themeSwitcher";
import "./DashboardLayout.css";

const navConfig = {
  Admin: [
    { path: "/admin", label: "Dashboard", icon: <FiHome /> },
    { path: "/admin/users", label: "Staff Management", icon: <FiUsers /> },
  ],
  Chef: [
    { path: "/chef", label: "Menu Management", icon: <FiBookOpen /> },
    { path: "/chef/kitchen", label: "Kitchen Display", icon: <FiMonitor /> },
  ],
  Waiter: [
    { path: "/waiter", label: "Tables", icon: <FiShoppingCart /> },
    { path: "/waiter/orders", label: "Order", icon: <FiClipboard /> },
  ],
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const links = navConfig[user?.role] || [];

  const isLinkActive = (linkPath, navLinkIsActive) => {
    if (user?.role !== "Waiter") return navLinkIsActive;

    if (linkPath === "/waiter") {
      return location.pathname === "/waiter" || location.pathname.startsWith("/waiter/table/");
    }

    if (linkPath === "/waiter/orders") {
      return location.pathname === "/waiter/orders" || location.pathname.startsWith("/waiter/orders/");
    }

    return navLinkIsActive;
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <FiX /> : <FiMenu />}
      </button>

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">🍽️</div>
          <h2>RMS</h2>
          <span className="sidebar-subtitle">Restaurant Manager</span>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end ?? true}
              className={({ isActive }) => `nav-link ${isLinkActive(link.path, isActive) ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-theme">
            <ThemeSwitcher />
          </div>
          <div className="user-info">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <div className="user-detail">
              <span className="user-name">{user?.username}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
