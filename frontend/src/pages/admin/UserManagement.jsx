import { useEffect, useState, useCallback } from "react";
import { getAllUsers, createUser, deleteUser } from "../../api/userApi";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiSearch } from "react-icons/fi";
import Modal from "../../components/Modal";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id_number: "", username: "", password: "", role: "Waiter" });

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await getAllUsers();
      setUsers(data);
    } catch (err) {
      toast.error(`Failed to load staff list: ${err.message || "Unknown error"}`);
    }
  }, []); // Empty array means this function never needs to be recreated

  // 2. Safely call it inside useEffect
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser({ ...form, phone_number: "", contact_email: "" });
      toast.success("Account created successfully!");
      setShowModal(false);
      setForm({ id_number: "", username: "", password: "", role: "Waiter" });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create account");
    }
  };

  const handleDelete = async (userID, username) => {
    if (!window.confirm(`Delete account "${username}"?`)) return;
    try {
      await deleteUser(userID);
      toast.success("Account deleted");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1>Staff Management</h1>
        <p>Create, view, and remove staff accounts</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, position: "relative", minWidth: 200 }}>
            <FiSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: 10, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", fontFamily: "inherit" }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> Add Staff</button>
        </div>
      </div>

      <div className="card">
        {filtered.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.userID}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{u.username}</td>
                    <td><span className={`badge ${u.role === "Chef" ? "badge-info" : u.role === "Admin" ? "badge-success" : "badge-warning"}`}>{u.role}</span></td>
                    <td><span className={`badge ${u.is_active ? "badge-success" : "badge-danger"}`}>{u.is_active ? "Active" : "Inactive"}</span></td>
                    <td>{new Date(u.created_at).toLocaleDateString("en-US")}</td>
                    <td>
                      {u.role !== "Admin" && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.userID, u.username)}><FiTrash2 /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>No staff found</p>
          </div>
        )}
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2>Add New Staff</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="input-group">
              <label>Username *</label>
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Password *</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="input-group">
                <label>ID Number *</label>
                <input required value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Role *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="Waiter">Waiter</option>
                  <option value="Chef">Chef</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Account</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
