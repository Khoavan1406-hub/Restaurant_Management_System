import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { openSession, getActiveSessions } from "../../api/orderApi";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { FiArrowRight, FiLock } from "react-icons/fi";
import "./WaiterDashboard.css";

const TOTAL_TABLES = 12;

const WaiterDashboard = () => {
  const [activeTables, setActiveTables] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load active sessions from DB on mount
  useEffect(() => {
    const fetchActive = async () => {
      try {
        const { data } = await getActiveSessions();
        const map = {};
        data.forEach((s) => {
          map[s.table_number] = { sessionID: s.sessionID, waiterID: s.waiterID };
        });
        setActiveTables(map);
      } catch (err) {
        console.error("Failed to load active sessions", err);
      }
    };
    fetchActive();
  }, []);

  const handleTableClick = async (tableNumber) => {
    const session = activeTables[tableNumber];

    if (session) {
      // Table is occupied — only the owning waiter can enter
      if (session.waiterID !== user.userID) {
        toast.error(`Table ${tableNumber} is managed by another waiter`);
        return;
      }
      navigate(`/waiter/table/${tableNumber}?sessionID=${session.sessionID}`);
    } else {
      // Open new session
      try {
        const { data } = await openSession(tableNumber);
        toast.success(`Table ${tableNumber} is now open`);
        setActiveTables({
          ...activeTables,
          [tableNumber]: { sessionID: data.sessionID, waiterID: user.userID },
        });
        navigate(`/waiter/table/${tableNumber}?sessionID=${data.sessionID}`);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to open table");
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Table Session</h1>
        <p>Select a table to open a session and place orders</p>
      </div>

      <div className="table-grid">
        {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map((num) => {
          const session = activeTables[num];
          const isActive = !!session;
          const isOwned = isActive && session.waiterID === user.userID;
          const isLocked = isActive && !isOwned;

          return (
            <div
              key={num}
              className={`table-card ${isLocked ? "locked" : isActive ? "active" : "empty"}`}
              onClick={() => handleTableClick(num)}
            >
              <div className="table-number">Table {num}</div>
              <div className="table-status">
                {isLocked ? (
                  <span className="badge badge-danger">Other Waiter</span>
                ) : isActive ? (
                  <span className="badge badge-warning">Occupied</span>
                ) : (
                  <span className="badge badge-success">Available</span>
                )}
              </div>
              <div className="table-action">
                {isLocked ? (
                  <>Locked <FiLock /></>
                ) : isActive ? (
                  <>View Orders <FiArrowRight /></>
                ) : (
                  <>Open Table <FiArrowRight /></>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WaiterDashboard;
