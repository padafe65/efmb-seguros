/**
 * Navega al dashboard correspondiente según el rol del usuario
 * @param navigate - Función de navegación de react-router-dom (retornada por useNavigate)
 */
export const navigateToDashboard = (navigate: (path: string) => void) => {
  const rol = localStorage.getItem("rol");
  
  if (rol === "super_user") {
    navigate("/dashboard-super");
  } else if (rol === "admin" || rol === "sub_admin") {
    navigate("/dashboard-admin");
  } else if (rol === "user") {
    navigate("/dashboard-user");
  } else {
    navigate("/login");
  }
};
