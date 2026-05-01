import { useEffect, useState } from "react";
import { getAllUsers } from "../../api/userApi";
import { getEmployeePerformance } from "../../api/reportApi";
import { FiUsers } from "react-icons/fi";
import { GrUserAdmin } from "react-icons/gr";
import { BiDish } from "react-icons/bi";
import { LuChefHat } from "react-icons/lu";

const formatDateTime = (timestamp) => {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [period, setPeriod] = useState("today");
  const [report, setReport] = useState({ chefs: [], waiters: [] });
  const [reportLoading, setReportLoading] = useState(false);

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

  useEffect(() => {
    const fetchReport = async () => {
      setReportLoading(true);
      try {
        const { data } = await getEmployeePerformance(period);
        setReport({
          chefs: data.chefs || [],
          waiters: data.waiters || [],
        });
      } catch (err) {
        console.error(err);
        setReport({ chefs: [], waiters: [] });
      } finally {
        setReportLoading(false);
      }
    };

    fetchReport();
  }, [period]);

  const formatMoney = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

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

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Employee Performance</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { key: "today", label: "Today" },
              { key: "week", label: "This Week" },
              { key: "month", label: "This Month" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPeriod(item.key)}
                className="btn btn-sm"
                style={{
                  background: period === item.key ? "var(--accent)" : "transparent",
                  color: period === item.key ? "#fff" : "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {reportLoading ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <p>Loading employee performance...</p>
          </div>
        ) : (
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            <div className="card" style={{ margin: 0 }}>
              <h3 style={{ marginBottom: 12, fontSize: "1rem" }}>Chefs - Completed Orders</h3>
              {report.chefs.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Chef</th>
                        <th>Completed Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.chefs.map((chef, index) => (
                        <tr key={chef.userID}>
                          <td>#{index + 1}</td>
                          <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{chef.username}</td>
                          <td>{chef.completedOrders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 16 }}>
                  <p>No chef data for this period</p>
                </div>
              )}
            </div>

            <div className="card" style={{ margin: 0 }}>
              <h3 style={{ marginBottom: 12, fontSize: "1rem" }}>Waiters - Total Bill</h3>
              {report.waiters.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Waiter</th>
                        <th>Total Bill</th>
                        <th>Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.waiters.map((waiter, index) => (
                        <tr key={waiter.userID}>
                          <td>#{index + 1}</td>
                          <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{waiter.username}</td>
                          <td>{formatMoney(waiter.totalBill)}</td>
                          <td>{waiter.completedSessions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 16 }}>
                  <p>No waiter data for this period</p>
                </div>
              )}
            </div>
          </div>
        )}
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
                {[...users].sort((a, b) => b.is_active - a.is_active).slice(0, 5).map((u) => (
                  <tr key={u.userID}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{u.username}</td>
                    <td>{u.id_number}</td>
                    <td><span className={`badge ${u.role === "Chef" ? "badge-info" : u.role === "Waiter" ? "badge-warning" : "badge-pending"}`}>{u.role}</span></td>
                    <td><span className={`badge ${u.is_active ? "badge-success" : "badge-danger"}`}>{u.is_active ? "Active" : "Inactive"}</span></td>
                    <td>{formatDateTime(u.created_at)}</td>
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
