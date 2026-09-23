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
  const rawRol = localStorage.getItem("rol") || localStorage.getItem("roles") || "";
  const userRoles = rawRol.includes(",") ? rawRol.split(",") : [rawRol];

  if (!token) return <Navigate to="/login" replace />;

  if (allowed.length > 0 && !allowed.some((a) => userRoles.includes(a))) {
    return <Navigate to="/" replace />;
  }

  return children;
}
