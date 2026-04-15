import { useNavigate } from "react-router-dom";
import { FiAlertTriangle } from "react-icons/fi";

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div className="loading-screen" style={{ flexDirection: "column", gap: "16px" }}>
      <FiAlertTriangle style={{ fontSize: "3rem", color: "#ef4444" }} />
      <h2>403 — Access Denied</h2>
      <p style={{ color: "#64748b" }}>You do not have permission to access this page.</p>
      <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
};

export default Unauthorized;
