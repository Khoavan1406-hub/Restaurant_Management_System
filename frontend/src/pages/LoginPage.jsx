import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginApi } from "../api/authApi";
import toast from "react-hot-toast";
import { FiUser, FiLock, FiArrowRight } from "react-icons/fi";
import "./LoginPage.css";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }

    setLoading(true);
    try {
      const { data } = await loginApi(username, password);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.username}!`);

      const redirect = {
        Admin: "/admin",
        Chef: "/chef",
        Waiter: "/waiter",
      };
      navigate(redirect[data.user.role] || "/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-decoration">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>
        <div className="bg-circle circle-3"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🍽️</div>
          <h1>Restaurant Manager</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <FiUser className="input-icon" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="login-input-group">
            <FiLock className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="login-spinner"></span>
            ) : (
              <>
                Sign In
                <FiArrowRight />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
