import { useCallback, useEffect, useState } from "react";
import { FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";
import toast from "react-hot-toast";
import { getWaiterOrders, updateWaiterOrderStatus } from "../../api/orderApi";
import useSocket from "../../hooks/useSocket";
import "./WaiterOrders.css";

const formatDateTime = (timestamp) => {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
};

const statusBadge = {
  "Not Started": { text: "Pending", className: "badge-pending" },
  Cooking: { text: "Cooking", className: "badge-warning" },
  Ready: { text: "Ready", className: "badge-info" },
  Completed: { text: "Done", className: "badge-success" },
  Cancelled: { text: "Cancelled", className: "badge-danger" },
};

const WaiterOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingOrderID, setProcessingOrderID] = useState(null);
  const socketRef = useSocket();

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await getWaiterOrders();
      const grouped = new Map();

      data.forEach((row) => {
        if (!grouped.has(row.orderID)) {
          grouped.set(row.orderID, {
            orderID: row.orderID,
            sessionID: row.sessionID,
            table_number: row.table_number,
            timestamp: row.timestamp,
            status: row.status,
            items: [],
          });
        }

        grouped.get(row.orderID).items.push({
          itemID: row.itemID,
          dish_name: row.dish_name,
          quantity: row.quantity,
          special_note: row.special_note,
        });
      });

      setOrders(Array.from(grouped.values()));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleStatusUpdate = () => {
      fetchOrders();
    };

    socket.on("order-status-update", handleStatusUpdate);

    return () => {
      socket.off("order-status-update", handleStatusUpdate);
    };
  }, [socketRef, fetchOrders]);

  const handleUpdateStatus = async (orderID, status) => {
    if (status === "Cancelled" && !window.confirm(`Cancel order #${orderID}?`)) {
      return;
    }

    setProcessingOrderID(orderID);
    try {
      await updateWaiterOrderStatus(orderID, status);
      toast.success(`Order #${orderID} ${status}`);
      await fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update order status");
    } finally {
      setProcessingOrderID(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Order Management</h1>
        <p>View and manage orders</p>
      </div>

      {loading ? (
        <div className="card waiter-orders-empty">
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="card waiter-orders-empty">
          <div className="empty-icon">✅</div>
          <p>No orders found for your active tables.</p>
        </div>
      ) : (
        <div className="waiter-orders-grid">
          {orders.map((order) => {
            const badge = statusBadge[order.status] || { text: order.status, className: "badge-info" };

            return (
              <div key={order.orderID} className="waiter-order-card">
                <div className="waiter-order-header">
                  <div>
                    <h3>Order #{order.orderID}</h3>
                    <p>
                      Table {order.table_number} | Session #{order.sessionID}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span className={`badge ${badge.className}`}>{badge.text}</span>
                    <div className="waiter-order-time">
                      <FiClock />
                      <span>{formatDateTime(order.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="waiter-order-items">
                  {order.items.map((item) => (
                    <div key={item.itemID} className="waiter-order-item">
                      <span className="waiter-order-qty">{item.quantity}x</span>
                      <span className="waiter-order-name">{item.dish_name}</span>
                      {item.special_note && (
                        <span className="waiter-order-note">Note: {item.special_note}</span>
                      )}
                    </div>
                  ))}

                </div>{order.status === "Not Started" && (
                  <div className="waiter-order-actions">
                    <button
                      className="btn btn-danger"
                      onClick={() => handleUpdateStatus(order.orderID, "Cancelled")}
                      disabled={processingOrderID === order.orderID}
                    >
                      <FiXCircle /> Cancel order
                    </button>
                  </div>
                )}

                {order.status === "Ready" && (
                  <div className="waiter-order-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => handleUpdateStatus(order.orderID, "Completed")}
                      disabled={processingOrderID === order.orderID}
                    >
                      <FiCheckCircle /> Complete order
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WaiterOrders;
