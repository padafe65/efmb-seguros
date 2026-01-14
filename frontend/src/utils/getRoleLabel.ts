/**
 * Traduce el rol del usuario al español para mostrar en los dashboards
 * @param role - Rol del usuario (admin, sub_admin, super_user, user)
 * @returns Etiqueta en español del rol
 */
export const getRoleLabel = (role: string | null | undefined): string => {
  if (!role) return "Usuario";
  
  const roleMap: { [key: string]: string } = {
    admin: "Administrador",
    sub_admin: "Sub Administrador",
    super_user: "Super Usuario",
    user: "Usuario",
  };
  
  return roleMap[role] || role;
};
