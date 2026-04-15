import { useEffect, useState, useCallback } from "react";
import { getPendingOrders } from "../../api/orderApi";
import useSocket from "../../hooks/useSocket";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { FiClock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import "./KitchenDisplay.css";

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const socketRef = useSocket();
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await getPendingOrders();
      const grouped = {};
      data.forEach((row) => {
        if (!grouped[row.orderID]) {
          grouped[row.orderID] = {
            orderID: row.orderID,
            table_number: row.table_number,
            timestamp: row.timestamp,
            status: row.status,
            items: [],
          };
        }
        grouped[row.orderID].items.push({
          dish_name: row.dish_name,
          quantity: row.quantity,
          special_note: row.special_note,
        });
      });
      setOrders(Object.values(grouped));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("join-room", "kitchen");

    socket.on("new-order", () => {
      toast("🔔 New order received!", { icon: "📋" });
      fetchOrders();
    });

    socket.on("order-status-update", () => {
      fetchOrders();
    });

    return () => {
      socket.off("new-order");
      socket.off("order-status-update");
    };
  }, [socketRef, fetchOrders]);

  const updateStatus = (orderID, status) => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit("order-status-update", { orderID, status, chefID: user.userID });
      toast.success(`Order #${orderID} → ${status}`);
    }
  };

  const timeAgo = (timestamp) => {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  };

  const notStarted = orders.filter((o) => o.status === "Not Started");
  const cooking = orders.filter((o) => o.status === "Cooking");

  return (
    <div>
      <div className="page-header">
        <h1>🔥 Kitchen Display</h1>
        <p>Real-time orders from waiters</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon red"><FiAlertCircle /></div>
          <div className="stat-info"><h3>{notStarted.length}</h3><p>Pending</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><FiClock /></div>
          <div className="stat-info"><h3>{cooking.length}</h3><p>Cooking</p></div>
        </div>
      </div>

      <div className="kitchen-grid">
        <div>
          <h2 className="kitchen-section-title">
            <FiAlertCircle style={{ color: "var(--danger)" }} /> Pending ({notStarted.length})
          </h2>
          {notStarted.length > 0 ? notStarted.map((order) => (
            <div key={order.orderID} className="kitchen-card new-order">
              <div className="kitchen-card-header">
                <div>
                  <span className="kitchen-order-id">#{order.orderID}</span>
                  <span className="badge badge-danger">Table {order.table_number}</span>
                </div>
                <span className="kitchen-time">{timeAgo(order.timestamp)}</span>
              </div>
              <div className="kitchen-items">
                {order.items.map((item, i) => (
                  <div key={i} className="kitchen-item">
                    <span className="kitchen-qty">{item.quantity}x</span>
                    <span className="kitchen-name">{item.dish_name}</span>
                    {item.special_note && <span className="kitchen-note">📝 {item.special_note}</span>}
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ width: "100%", marginTop: 12 }} onClick={() => updateStatus(order.orderID, "Cooking")}>
                🔥 Start Cooking
              </button>
            </div>
          )) : (
            <div className="empty-state"><div className="empty-icon">✅</div><p>No pending orders</p></div>
          )}
        </div>

        <div>
          <h2 className="kitchen-section-title">
            <FiClock style={{ color: "var(--warning)" }} /> Cooking ({cooking.length})
          </h2>
          {cooking.length > 0 ? cooking.map((order) => (
            <div key={order.orderID} className="kitchen-card cooking">
              <div className="kitchen-card-header">
                <div>
                  <span className="kitchen-order-id">#{order.orderID}</span>
                  <span className="badge badge-warning">Table {order.table_number}</span>
                </div>
                <span className="kitchen-time">{timeAgo(order.timestamp)}</span>
              </div>
              <div className="kitchen-items">
                {order.items.map((item, i) => (
                  <div key={i} className="kitchen-item">
                    <span className="kitchen-qty">{item.quantity}x</span>
                    <span className="kitchen-name">{item.dish_name}</span>
                    {item.special_note && <span className="kitchen-note">📝 {item.special_note}</span>}
                  </div>
                ))}
              </div>
              <button className="btn btn-success" style={{ width: "100%", marginTop: 12 }} onClick={() => updateStatus(order.orderID, "Ready")}>
                <FiCheckCircle /> Ready to Serve
              </button>
            </div>
          )) : (
            <div className="empty-state"><div className="empty-icon">🍳</div><p>Nothing cooking</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KitchenDisplay;
