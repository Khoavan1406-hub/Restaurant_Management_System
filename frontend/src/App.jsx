import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import routes from "./routes/AppRoutes";

const RedirectByRole = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role === "Admin") return <Navigate to="/admin" />;
  if (user.role === "Chef") return <Navigate to="/chef" />;
  if (user.role === "Waiter") return <Navigate to="/waiter" />;
  return <Navigate to="/login" />;
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RedirectByRole />} />
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Toaster
          position="top-right"
          containerStyle={{
            zIndex: 999999,
          }}
          toastOptions={{
            style: {
              background: '#1e2130',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '0.875rem',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
