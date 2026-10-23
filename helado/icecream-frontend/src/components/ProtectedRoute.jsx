import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

export default function ProtectedRoute({ children, admin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="p-8 text-center">Cargando…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && !user.is_admin) return <Navigate to="/" replace />;
  return children;
}
