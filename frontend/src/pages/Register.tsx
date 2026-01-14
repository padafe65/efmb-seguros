// src/pages/Register.tsx
import React, { useState, useEffect } from "react";
import API from "../api/axiosConfig";
import { useParams, useNavigate } from "react-router-dom";
import { navigateToDashboard } from "../utils/navigateToDashboard";

export default function Register(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditing = Boolean(id);
  const role = localStorage.getItem("rol") || ""; // "admin" | "user" | "super_user" | "sub_admin"
  const isAdmin = role === "admin" || role === "super_user" || role === "sub_admin";
  const isSuperUser = role === "super_user"; // Solo super_user puede crear usuarios con roles privilegiados (admin, super_user)
  const canCreateSubAdmin = role === "admin" || role === "super_user" || role === "sub_admin"; // Admin, super_user y sub_admin pueden crear sub_admin

  const [form, setForm] = useState<any>({
    user_name: "",
    email: "",
    documento: "",
    direccion: "",
    ciudad: "",
    telefono: "",
    actividad_empresa: "",
    representante_legal: "",
    facebook_url: "",
    fecha_nacimiento: "",
    roles: ["user"],
    isactive: true,
    user_password: "",
  });

  useEffect(() => {
    if (isEditing && id) {
      loadUserData(Number(id));
    }
    // eslint-disable-next-line
  }, [id]);

  const loadUserData = async (userId: number) => {
    try {
      const res = await API.get(`/auth/users/${userId}`);
      const user = res.data;
      // Mapear a form (no traemos password)
      setForm({
        user_name: user.user_name || "",
        email: user.email || "",
        documento: user.documento || "",
        direccion: user.direccion || "",
        ciudad: user.ciudad || "",
        telefono: user.telefono || "",
        actividad_empresa: user.actividad_empresa || "",
        representante_legal: user.representante_legal || "",
        facebook_url: user.facebook_url || "",
        fecha_nacimiento: user.fecha_nacimiento ? new Date(user.fecha_nacimiento).toISOString().substring(0,10) : "",
        roles: user.roles || ["user"],
        isactive: user.isactive ?? true,
        user_password: "", // vacío por seguridad
      });
    } catch (err) {
      console.error("Error cargando usuario", err);
      alert("No se pudo cargar el usuario");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((s: any) => ({ ...s, [name]: value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const dataToSend = { ...form };

    // 🔒 Validación de seguridad en frontend
    if (!isEditing) {
      const requestedRole = Array.isArray(dataToSend.roles) ? dataToSend.roles[0] : dataToSend.roles;
      
      // Solo super_user puede crear admin o super_user
      if (!isSuperUser && (requestedRole === 'admin' || requestedRole === 'super_user')) {
        alert("⚠️ No tienes permisos para crear usuarios con roles privilegiados (admin o super_user). Se asignará el rol 'user'.");
        dataToSend.roles = ['user'];
      }
      
      // Solo admin y super_user pueden crear sub_admin
      if (!canCreateSubAdmin && requestedRole === 'sub_admin') {
        alert("⚠️ No tienes permisos para crear usuarios con rol sub_admin. Se asignará el rol 'user'.");
        dataToSend.roles = ['user'];
      }
    }

    // ❗Evitar enviar contraseña vacía
    if (isEditing && !dataToSend.user_password) {
      delete dataToSend.user_password;
    }

    if (isEditing) {
      await API.patch(`/auth/update/${id}`, dataToSend);
      alert("Usuario actualizado correctamente");
    } else {
      await API.post("/auth/register", dataToSend);
      alert("Usuario creado correctamente");
    }

    // Navegar al dashboard correspondiente según el rol
    navigateToDashboard(navigate);

  } catch (error: any) {
    console.error("Error guardando", error);
    const errorMessage = error.response?.data?.message || "Hubo un error al guardar";
    alert(`❌ ${errorMessage}`);
  }
};

  return (
    <div style={{ padding: 20 }}>
      <h2>{isEditing ? "Editar Usuario" : "Crear Usuario"}</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 700 }}>
        <label>Nombre</label>
        <input name="user_name" value={form.user_name} onChange={handleChange} placeholder="Nombre" required />

        <label>Email</label>
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" required />

        <label>Documento</label>
        <input name="documento" value={form.documento} onChange={handleChange} placeholder="Documento" />

        <label>Dirección</label>
        <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección" />

        <label>Ciudad</label>
        <input name="ciudad" value={form.ciudad} onChange={handleChange} placeholder="Ciudad" />

        <label>Teléfono</label>
        <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" />

        <label>Actividad empresa</label>
        <input name="actividad_empresa" value={form.actividad_empresa} onChange={handleChange} placeholder="Actividad empresa" />

        <label>Representante legal</label>
        <input name="representante_legal" value={form.representante_legal} onChange={handleChange} placeholder="Representante legal" />

        <label>URL de Facebook (opcional)</label>
        <input 
          name="facebook_url" 
          value={form.facebook_url} 
          onChange={handleChange} 
          placeholder="https://www.facebook.com/tu-pagina" 
          type="url"
        />
        <small style={{ color: "#666", fontSize: "12px" }}>
          Ingresa el enlace completo de tu página de Facebook (opcional)
        </small>

        <label>Fecha de nacimiento</label>
        <input name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} type="date" />

        <label>Roles</label>
        <select
          name="roles"
          value={Array.isArray(form.roles) ? form.roles[0] : form.roles}
          onChange={(e) => setForm((s:any) => ({ ...s, roles: [e.target.value] }))}
          disabled={!isAdmin && !isEditing} // Solo admin, sub_admin y super_user pueden asignar roles al crear
        >
          <option value="user">user</option>
          {canCreateSubAdmin && (
            <option value="sub_admin">sub_admin</option>
          )}
          {isSuperUser && (
            <>
              <option value="admin">admin</option>
              <option value="super_user">super_user</option>
            </>
          )}
        </select>
        {!isAdmin && !isEditing && (
          <small style={{ color: "#666", fontSize: "12px" }}>
            ⚠️ El registro público solo permite crear usuarios con rol "user".
          </small>
        )}
        {canCreateSubAdmin && !isSuperUser && !isEditing && (
          <small style={{ color: "#666", fontSize: "12px" }}>
            ℹ️ Puedes crear usuarios con rol "user" o "sub_admin". Solo un super_user puede crear "admin" o "super_user".
          </small>
        )}

        {/* Contraseña solo para crear o si el mismo usuario se está editando */}
        {(!isEditing || (!isAdmin && isEditing)) && (
          <>
            <label>{isEditing ? "Nueva contraseña (opcional)" : "Contraseña"}</label>
            <input
              name="user_password"
              type="password"
              value={form.user_password}
              onChange={(e) => setForm((s:any) => ({ ...s, user_password: e.target.value }))}
              placeholder={isEditing ? "Dejar vacío para no cambiar" : "Contraseña"}
              {...(!isEditing ? { required: true } : {})}
            />
          </>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit">{isEditing ? "Actualizar Usuario" : "Crear Usuario"}</button>
          <button type="button" onClick={() => navigateToDashboard(navigate)}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
