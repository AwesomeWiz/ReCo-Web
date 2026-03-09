import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "./Sidebar";

export default function ProtectedRoute({ children }) {
  const { manufacturer } = useAuth();
  if (!manufacturer) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}