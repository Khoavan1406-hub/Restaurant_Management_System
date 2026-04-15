import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiHome, FiUsers, FiBookOpen, FiShoppingCart, FiMonitor, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { useState } from "react";
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
  ],
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const links = navConfig[user?.role] || [];

  const handleLogout = () => {
    logout();
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
              end
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
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
