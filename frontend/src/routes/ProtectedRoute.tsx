import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
  allowed = [],
}: {
  children: JSX.Element;
  allowed?: string[];
}) {
  const token = localStorage.getItem("token");
  // Intentar obtener rol de diferentes formas (compatibilidad)
  // Login.tsx guarda como "rol", pero algunos componentes usan "roles"
  const rol = localStorage.getItem("rol") || localStorage.getItem("roles") || "";

  if (!token) return <Navigate to="/login" replace />;

  if (allowed.length > 0 && !allowed.includes(rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
