// src/pages/Register.tsx
import React, { useState, useEffect } from "react";
import API from "../api/axiosConfig";
import { useParams, useNavigate } from "react-router-dom";

export default function Register(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditing = Boolean(id);
  const role = localStorage.getItem("rol") || ""; // "admin" | "user" | "super_user"
  const isAdmin = role === "admin" || role === "super_user";

  const [form, setForm] = useState<any>({
    user_name: "",
    email: "",
    documento: "",
    direccion: "",
    ciudad: "",
    telefono: "",
    actividad_empresa: "",
    representante_legal: "",
    fecha_nacimiento: "",
    roles: ["user"],
    isactive: true,
    user_password: "",
    company_id: "",
  });
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    // Cargar listado de empresas si es admin o super_user
    if (isAdmin) {
      API.get("/companies")
        .then((res) => setCompanies(res.data || []))
        .catch((err) => console.error("Error cargando empresas:", err));
    }
  }, [isAdmin]);

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
      let fechaFormatted = "";
      if (user.fecha_nacimiento) {
        try {
          fechaFormatted = new Date(user.fecha_nacimiento).toISOString().substring(0, 10);
        } catch {
          fechaFormatted = String(user.fecha_nacimiento).substring(0, 10);
        }
      }
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
        fecha_nacimiento: fechaFormatted,
        roles: user.roles || ["user"],
        isactive: user.isactive ?? true,
        company_id: user.company?.id?.toString() || user.company_id?.toString() || "",
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

    // ❗Evitar enviar contraseña vacía
    if (isEditing && !dataToSend.user_password) {
      delete dataToSend.user_password;
    }

    // Normalizar company_id para que sea número o null (evitar string vacío)
    if (dataToSend.company_id === "" || dataToSend.company_id === undefined) {
      dataToSend.company_id = null;
    } else {
      dataToSend.company_id = Number(dataToSend.company_id);
    }

    if (isEditing) {
      await API.patch(`/auth/update/${id}`, dataToSend);
      alert("Usuario actualizado correctamente");
    } else {
      await API.post("/auth/register", dataToSend);
      alert("Usuario creado correctamente");
    }

    if (role === "super_user") {
      navigate("/dashboard-super");
    } else {
      navigate("/dashboard-admin");
    }

  } catch (error) {
    console.error("Error guardando", error);
    alert("Hubo un error al guardar");
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

        <label>Fecha de nacimiento</label>
        <input name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} type="date" />

        <label>Roles</label>
        <select
          name="roles"
          value={Array.isArray(form.roles) ? form.roles[0] : form.roles}
          onChange={(e) => setForm((s:any) => ({ ...s, roles: [e.target.value] }))}
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
          <option value="super_user">super_user</option>
        </select>

        {isAdmin && (
          <>
            <label>Empresa / Aseguradora</label>
            <select
              name="company_id"
              value={form.company_id || ""}
              onChange={handleChange}
            >
              <option value="">-- Sin empresa asociada --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.nit ? `(${c.nit})` : ""}
                </option>
              ))}
            </select>
          </>
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
          <button
            type="button"
            onClick={() => {
              if (role === "super_user") navigate("/dashboard-super");
              else navigate("/dashboard-admin");
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
