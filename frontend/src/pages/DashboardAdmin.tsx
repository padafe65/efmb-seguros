  // src/pages/DashboardAdmin.tsx
  import React, { useEffect, useState } from "react";
  import API from "../api/axiosConfig";
  import { useNavigate } from "react-router-dom";
  import "../App.css";
  import { logout } from "../utils/logout";
  import AuditView from "../components/AuditView";


  type User = {
    id: number;
    user_name: string;
    email: string;
    documento?: string;
    roles?: string[];
  };

  type Policy = any;

  export default function DashboardAdmin(): JSX.Element {
    const [activeTab, setActiveTab] = useState<"general" | "audit">("general");
    const [users, setUsers] = useState<User[]>([]);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [filterUserId, setFilterUserId] = useState<string>("");
    const [filterPolicyNumber, setFilterPolicyNumber] = useState<string>("");
    const [filterPlaca, setFilterPlaca] = useState<string>("");
    const [filterUserName, setFilterUserName] = useState<string>("");
    const [filterUserEmail, setFilterUserEmail] = useState<string>("");
    const [filterUserDocumento, setFilterUserDocumento] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [viewUserPolicies, setViewUserPolicies] = useState(false);
    const [selectedUserPolicies, setSelectedUserPolicies] = useState<Policy[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const navigate = useNavigate();

    const loadUsers = async (params: { user_name?: string; email?: string; documento?: string; skip?: number; limit?: number; } = {}) => {
      try {
        setLoading(true);
        const res = await API.get("/auth/users", { params });
        console.log("🟩 Usuarios cargados:", res.data, "params:", params.user_name);
        setUsers(res.data || []);
      } catch (err) {
        console.error(err);
        alert("No se pudieron cargar usuarios");
      } finally {
        setLoading(false);
      }
    };

  const loadPolicies = async (params: { user_id?: string; policy_number?: string; placa?: string } = {}) => {
    try {
      setLoading(true);

      console.log("🟨 loadPolicies con params:", params);

      const res = await API.get("/policies", { params });
      console.log("🟩 Pólizas cargadas:", res.data);

      setPolicies(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar pólizas");
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const token = localStorage.getItem("token");
  console.log("🟦 Token en DashboardAdmin:", token);
  const rol = localStorage.getItem("rol");
  console.log("🟦 Rol en DashboardAdmin:", rol);

  if (!token || rol !== "admin") {
    logout(navigate);
    return;
  }

  loadUsers();
  loadPolicies();
  // eslint-disable-next-line
}, []);

    const handleDeleteUser = async (id: number) => {
      if (!confirm("Eliminar usuario?")) return;
      try {
        await API.delete(`/auth/${id}`);
        alert("Usuario eliminado");
        loadUsers();
      } catch (err) {
        console.error(err);
        alert("Error al eliminar usuario");
      }
    };

    const handleViewUserPolicies = async (user: User) => {
    try {
      setSelectedUser(user);
      setLoading(true);

      const res = await API.get("/policies", {
        params: { user_id: user.id }
      });

      setSelectedUserPolicies(res.data || []);
      setViewUserPolicies(true);

    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar las pólizas del usuario");
    } finally {
      setLoading(false);
    }
  };


  const handleDeletePolicy = async (id: number) => {
    if (!confirm("Eliminar póliza?")) return;
    try {
      await API.delete(`/policies/${id}`);
      alert("Póliza eliminada");
      loadPolicies({
        user_id: filterUserId || undefined,
        policy_number: filterPolicyNumber || undefined
      });
    } catch (err) {
      console.error(err);
      alert("Error al eliminar póliza");
    }
  };


  const handleSearch = () => {
    loadPolicies({
      user_id: filterUserId || undefined,
      policy_number: filterPolicyNumber || undefined,
      placa: filterPlaca || undefined
    });
    loadUsers({
      user_name: filterUserName.trim() || undefined,
      email: filterUserEmail.trim() || undefined,
      documento: filterUserDocumento.trim() || undefined,
    });

  };

const handleOpenAnalytics = () => {
  const token = localStorage.getItem("token");
  let rol = localStorage.getItem("rol") || "";
  let userId = localStorage.getItem("userId") || "";
  let userName = localStorage.getItem("user_name") || "";
  let companyId = localStorage.getItem("company_id") || "";

  // Si los datos vienen dentro del token JWT, se extraen automáticamente:
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      rol = rol || payload.roles?.[0] || payload.rol || "";
      userId = userId || payload.id || payload.sub || "";
      userName = userName || payload.user_name || payload.nombre || "Usuario";
      companyId = companyId || payload.company_id || payload.company?.id || "";
    } catch (err) {
      console.error("Error al decodificar token:", err);
    }
  }

  // Se abre la analítica pasando los parámetros reales y limpios:
  const url =
    "http://localhost:8501/?rol=" + encodeURIComponent(rol) +
    "&user_id=" + encodeURIComponent(userId) +
    "&user_name=" + encodeURIComponent(userName) +
    "&company_id=" + encodeURIComponent(companyId);

  window.open(url, "_blank");
};

  const adminButtons = [
    { label: "Refrescar Usuarios", onClick: loadUsers },
    { label: "Crear Usuario", onClick: () => navigate("/admin/users/create") },
    { label: "Crear Póliza", onClick: () => navigate("/admin/policies/create") },
    { label: "Registro de Auditoría", onClick: () => setActiveTab("audit") },
    { label: "Panel General", onClick: () => setActiveTab("general") },
    { label: "Abrir Analítica", onClick: handleOpenAnalytics },
    { label: "Cerrar Sesión", onClick: () => logout(navigate), isSecondary: true },
  ];


    return (
      <div className="admin-container" style={{ padding: 24 }}>
        <div className="admin-header">
          <h2>Panel Administrador</h2>
        </div>
        
        <div className="admin-actions" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          {adminButtons.map((btn, index) => (
            <button
              key={index}
              className={`admin-btn ${btn.isSecondary ? "secondary" : ""}`}
              onClick={btn.onClick}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {activeTab === "audit" ? (
          <AuditView />
        ) : (
          <>
        <section className="admin-section" style={{ marginBottom: 20 }}>
          <h3>Usuarios</h3>

          <div className="admin-filters" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input className="admin-input" placeholder="Filtrar por user_name" value={filterUserName} onChange={e => setFilterUserName(e.target.value)} />
            <input className="admin-input" placeholder="Filtrar por email" value={filterUserEmail} onChange={e => setFilterUserEmail(e.target.value)} />
            <input className="admin-input" placeholder="Filtrar por documento" value={filterUserDocumento} onChange={e => setFilterUserDocumento(e.target.value)} />
            <button className="admin-btn" onClick={handleSearch}>Filtrar</button>
            <button className="admin-btn secondary" onClick={() => { setFilterUserName(""); setFilterUserEmail(""); setFilterUserDocumento(""); loadUsers(); }}>Quitar filtros</button>
          </div>

          {loading ? (
            <p className="admin-empty">Cargando...</p>
          ) : (
            <table className="admin-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Documento</th>
                  <th>Roles</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.user_name}</td>
                    <td>{u.email}</td>
                    <td>{u.documento}</td>
                    <td>{Array.isArray(u.roles) ? u.roles.join(", ") : u.roles}</td>
                    <td className="row-actions" style={{ display: "flex", gap: 8 }}>
                      <button className="edit" onClick={() => navigate(`/admin/users/edit/${u.id}`)}>Editar / Actualizar</button>
                      <button className="delete" onClick={() => handleDeleteUser(u.id)}>Eliminar</button>
                    <button
                      className="view"
                      onClick={() => handleViewUserPolicies(u)}
                    >
                      Ver pólizas
                    </button>


                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="admin-section">
          <h3>CRUD de pólizas</h3>

          <div className="admin-filters" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input className="admin-input" placeholder="Filtrar por user_id" value={filterUserId} onChange={e => setFilterUserId(e.target.value)} />
            <input className="admin-input" placeholder="Filtrar por policy_number" value={filterPolicyNumber} onChange={e => setFilterPolicyNumber(e.target.value)} />
            <input className="admin-input" placeholder="Filtrar por placa" value={filterPlaca} onChange={e => setFilterPlaca(e.target.value)} />
            <button className="admin-btn" onClick={handleSearch}>Filtrar</button>
            <button className="admin-btn secondary" onClick={() => { setFilterUserId(""); setFilterPolicyNumber(""); loadPolicies(); }}>Quitar filtros</button>
          </div>

          {loading ? <p className="admin-empty">Cargando pólizas...</p> : (
            <table className="admin-table" style={{ width: "100%", marginTop: 12 }}>
              <thead>
              <tr>
                <th>ID</th>
                <th>No. Póliza</th>
                <th>Tipo</th>
                <th>Placa</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Valor</th>
                <th>Usuario</th>
                <th>ID Usuario</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>

              </thead>
              <tbody>
                {policies.map((p: any) => (
                  <tr key={p.id_policy}>
                    <td>{p.id_policy}</td>
                    <td>{p.policy_number}</td>
                    <td>{p.tipo_poliza}</td>
                    <td>{p.placa || "-"}</td>
                    <td>{p.inicio_vigencia ? new Date(p.inicio_vigencia).toLocaleDateString() : "-"}</td>
                    <td>{p.fin_vigencia ? new Date(p.fin_vigencia).toLocaleDateString() : "-"}</td>
                    <td>{p.valor_asegurado ?? "-"}</td>

                    {/* NUEVAS COLUMNAS */}
                    <td>{p.user?.user_name ?? "-"}</td>
                    <td>{p.user?.id ?? "-"}</td>
                    <td>{p.user?.telefono ?? "-"}</td>

                      <td className="row-actions" style={{ display: "flex", gap: 8 }}>
                      <button className="edit" onClick={() => navigate(`/admin/policies/edit/${p.id_policy}`)}>Editar</button>
                      <button className="delete" onClick={() => handleDeletePolicy(p.id_policy)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
                {policies.length === 0 && <tr><td colSpan={7} className="admin-empty">No hay pólizas</td></tr>}
              </tbody>
            </table>
          )}
          {viewUserPolicies && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Pólizas de {selectedUser?.user_name}</h3>

                <button
                  className="close-modal"
                  onClick={() => setViewUserPolicies(false)}
                >
                  Cerrar ✖
                </button>

                {selectedUserPolicies.length === 0 ? (
                  <p>No tiene pólizas registradas.</p>
                ) : (
                  <table className="admin-table" style={{ marginTop: 12 }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>No. Póliza</th>
                        <th>Tipo</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUserPolicies.map((p) => (
                        <tr key={p.id_policy}>
                          <td>{p.id_policy}</td>
                          <td>{p.policy_number}</td>
                          <td>{p.tipo_poliza}</td>
                          <td>{new Date(p.inicio_vigencia).toLocaleDateString()}</td>
                          <td>{new Date(p.fin_vigencia).toLocaleDateString()}</td>

                          <td>
                            <button
                              className="edit"
                              onClick={() =>
                                navigate(`/admin/policies/edit/${p.id_policy}`)
                              }
                            >
                              Editar
                            </button>

                            <button
                              className="delete"
                              onClick={async () => {
                                if (!confirm("¿Eliminar esta póliza? Esta acción no se puede deshacer.")) return;
                                try {
                                  await API.delete(`/policies/${p.id_policy}`);
                                  alert("Póliza eliminada");
                                  // refresca la vista del modal
                                  handleViewUserPolicies(selectedUser!);
                                } catch (err) {
                                  console.error(err);
                                  alert("No se pudo eliminar la póliza");
                                }
                              }}
                            >
                              Eliminar
                            </button>

                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

              </div>
            </div>
  )}

        </section>
          </>
        )}
      </div>
    );
  }
