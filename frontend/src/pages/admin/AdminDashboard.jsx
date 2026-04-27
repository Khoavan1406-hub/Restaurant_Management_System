import { useEffect, useState } from "react";
import { getAllUsers } from "../../api/userApi";
import { FiUsers } from "react-icons/fi";
import { GrUserAdmin } from "react-icons/gr";
import { BiDish } from "react-icons/bi";
import { LuChefHat } from "react-icons/lu";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const activeChefs = users.filter((u) => u.is_active && u.role === "Chef").length;
  const totalChefs = users.filter((u) => u.role === "Chef").length;
  const activeWaiters = users.filter((u) => u.role === "Waiter" && u.is_active).length;
  const totalWaiters = users.filter((u) => u.role === "Waiter").length;
  const activeAdmins = users.filter((u) => u.role === "Admin" && u.is_active).length;
  const totalAdmins = users.filter((u) => u.role === "Admin").length;

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of the restaurant management system</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon amber"><FiUsers /></div>
          <div className="stat-info"><h3>{activeUsers}/{totalUsers}</h3><p>Total Staff</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><GrUserAdmin /></div>
          <div className="stat-info"><h3>{activeAdmins}/{totalAdmins}</h3><p>Admins</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><LuChefHat /></div>
          <div className="stat-info"><h3>{activeChefs}/{totalChefs}</h3><p>Chefs</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><BiDish /></div>
          <div className="stat-info"><h3>{activeWaiters}/{totalWaiters}</h3><p>Waiters</p></div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: "1.1rem" }}>Recent Staff</h2>
        {users.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>ID Number</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 5).map((u) => (
                  <tr key={u.userID}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{u.username}</td>
                    <td>{u.id_number}</td>
                    <td><span className={`badge ${u.role === "Chef" ? "badge-info" : u.role === "Waiter" ? "badge-warning" : "badge-success"}`}>{u.role}</span></td>
                    <td><span className={`badge ${u.is_active ? "badge-success" : "badge-danger"}`}>{u.is_active ? "Active" : "Inactive"}</span></td>
                    <td>{new Date(u.created_at).toLocaleDateString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>No staff members yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
