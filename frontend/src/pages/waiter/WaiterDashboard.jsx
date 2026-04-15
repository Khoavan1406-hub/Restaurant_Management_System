import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { openSession, getActiveSessions } from "../../api/orderApi";
import toast from "react-hot-toast";
import { FiArrowRight } from "react-icons/fi";
import "./WaiterDashboard.css";

const TOTAL_TABLES = 12;

const WaiterDashboard = () => {
  const [activeTables, setActiveTables] = useState({});
  const navigate = useNavigate();

  // Load active sessions from DB on mount
  useEffect(() => {
    const fetchActive = async () => {
      try {
        const { data } = await getActiveSessions();
        const map = {};
        data.forEach((s) => {
          map[s.table_number] = s.sessionID;
        });
        setActiveTables(map);
      } catch (err) {
        console.error("Failed to load active sessions", err);
      }
    };
    fetchActive();
  }, []);

  const handleTableClick = async (tableNumber) => {
    if (activeTables[tableNumber]) {
      // Table already has active session — go to order page
      navigate(`/waiter/order/${tableNumber}?sessionID=${activeTables[tableNumber]}`);
    } else {
      // Open new session
      try {
        const { data } = await openSession(tableNumber);
        toast.success(`Table ${tableNumber} is now open`);
        setActiveTables({ ...activeTables, [tableNumber]: data.sessionID });
        navigate(`/waiter/order/${tableNumber}?sessionID=${data.sessionID}`);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to open table");
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Table Layout</h1>
        <p>Select a table to open a session and place orders</p>
      </div>

      <div className="table-grid">
        {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map((num) => {
          const isActive = !!activeTables[num];
          return (
            <div
              key={num}
              className={`table-card ${isActive ? "active" : "empty"}`}
              onClick={() => handleTableClick(num)}
            >
              <div className="table-number">Table {num}</div>
              <div className="table-status">
                {isActive ? (
                  <span className="badge badge-warning">Occupied</span>
                ) : (
                  <span className="badge badge-success">Available</span>
                )}
              </div>
              <div className="table-action">
                {isActive ? "View Orders" : "Open Table"} <FiArrowRight />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WaiterDashboard;
