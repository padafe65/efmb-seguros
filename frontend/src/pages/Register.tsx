// src/pages/Register.tsx
import React, { useState, useEffect } from "react";
import API from "../api/axiosConfig";
import { useParams, useNavigate } from "react-router-dom";
import FlipFormCard from "../components/FlipFormCard";

const registerImg = "/img/seguros2.jpg"; // Puedes cambiarla por seguros1.webp o la que prefieras

export default function Register(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditing = Boolean(id);
  const role = localStorage.getItem("rol") || "";
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
        user_password: "",
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

  const handleCancel = () => {
    if (role === "super_user") {
      navigate("/dashboard-super");
    } else if (role === "admin") {
      navigate("/dashboard-admin");
    } else {
      navigate("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSend = { ...form };

      if (isEditing && !dataToSend.user_password) {
        delete dataToSend.user_password;
      }

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

      handleCancel();
    } catch (error) {
      console.error("Error guardando", error);
      alert("Hubo un error al guardar el usuario");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <FlipFormCard
        frontImage={registerImg}
        title={isEditing ? "Editar Usuario" : "Registro de Usuario"}
        onClose={handleCancel}
      >
        <form onSubmit={handleSubmit} style={{ width: "100%", padding: "10px 0" }}>
          <h2 style={{ textAlign: "center", marginBottom: "15px", color: "#2d3748" }}>
            {isEditing ? "Actualizar Datos del Usuario" : "Crear Nueva Cuenta"}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <label>Nombre Completo *</label>
              <input
                name="user_name"
                value={form.user_name}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                required
              />
            </div>

            <div>
              <label>Correo Electrónico *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div>
              <label>Documento de Identidad</label>
              <input
                name="documento"
                value={form.documento}
                onChange={handleChange}
                placeholder="Número de cédula o NIT"
              />
            </div>

            <div>
              <label>Teléfono de Contacto</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Celular / Teléfono"
              />
            </div>

            <div>
              <label>Ciudad</label>
              <input
                name="ciudad"
                value={form.ciudad}
                onChange={handleChange}
                placeholder="Ciudad de residencia"
              />
            </div>

            <div>
              <label>Dirección</label>
              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Dirección completa"
              />
            </div>

            <div>
              <label>Actividad Empresa</label>
              <input
                name="actividad_empresa"
                value={form.actividad_empresa}
                onChange={handleChange}
                placeholder="Actividad económica"
              />
            </div>

            <div>
              <label>Representante Legal</label>
              <input
                name="representante_legal"
                value={form.representante_legal}
                onChange={handleChange}
                placeholder="Nombre representante"
              />
            </div>

            <div>
              <label>Fecha de Nacimiento</label>
              <input
                name="fecha_nacimiento"
                type="date"
                value={form.fecha_nacimiento}
                onChange={handleChange}
              />
            </div>

            {isAdmin && (
              <div>
                <label>Rol asignado</label>
                <select
                  name="roles"
                  value={Array.isArray(form.roles) ? form.roles[0] : form.roles}
                  onChange={(e) => setForm((s: any) => ({ ...s, roles: [e.target.value] }))}
                >
                  <option value="user">Usuario (Cliente)</option>
                  <option value="admin">Administrador</option>
                  <option value="sub_admin">Sub Administrador</option>
                  <option value="super_user">Super Usuario</option>
                </select>
              </div>
            )}

            {isAdmin && (
              <div>
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
              </div>
            )}

            {(!isEditing || (!isAdmin && isEditing)) && (
              <div style={{ gridColumn: isAdmin ? "span 2" : "auto" }}>
                <label>{isEditing ? "Nueva contraseña (opcional)" : "Contraseña *"}</label>
                <input
                  name="user_password"
                  type="password"
                  value={form.user_password}
                  onChange={(e) => setForm((s: any) => ({ ...s, user_password: e.target.value }))}
                  placeholder={isEditing ? "Dejar vacío para mantener actual" : "Contraseña segura"}
                  {...(!isEditing ? { required: true } : {})}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: "#0984e3",
              color: "white",
              fontWeight: "bold",
              fontSize: "15px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            {isEditing ? "Guardar Cambios" : "Completar Registro"}
          </button>
        </form>
      </FlipFormCard>
    </div>
  );
}