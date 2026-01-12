// src/pages/DashboardSuperUser.tsx
import React, { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { logout } from "../utils/logout";

type User = {
  id: number;
  user_name: string;
  email: string;
  documento?: string;
  roles?: string[];
  isactive?: boolean;
  ciudad?: string;
  telefono?: string;
};

type Policy = any;

export default function DashboardSuperUser(): JSX.Element {
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
  const [editingRoles, setEditingRoles] = useState<number | null>(null);
  const [newRoles, setNewRoles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "policies" | "stats">("users");

  const navigate = useNavigate();

  const loadUsers = async (params: {
    user_name?: string;
    email?: string;
    documento?: string;
    skip?: number;
    limit?: number;
  } = {}) => {
    try {
      setLoading(true);
      const res = await API.get("/auth/users", { params });
      console.log("🟩 Usuarios cargados:", res.data);
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const loadPolicies = async (params: {
    user_id?: string;
    policy_number?: string;
    placa?: string;
  } = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No hay token de autenticación. Por favor, inicia sesión nuevamente.");
        logout(navigate);
        return;
      }
      
      const res = await API.get("/policies", { 
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("🟩 Pólizas cargadas:", res.data);
      setPolicies(res.data || []);
    } catch (err: any) {
      console.error("Error cargando pólizas:", err);
      if (err.response?.status === 401) {
        alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
        logout(navigate);
      } else {
        alert("No se pudieron cargar pólizas: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");
    console.log("🟦 Token en DashboardSuperUser:", token);
    console.log("🟦 Rol en DashboardSuperUser:", rol);

    if (!token || rol !== "super_user") {
      logout(navigate);
      return;
    }

    loadUsers();
    loadPolicies();
    // eslint-disable-next-line
  }, []);

  const handleDeleteUser = async (id: number) => {
    if (!confirm("¿Eliminar usuario?")) return;
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
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No hay token de autenticación. Por favor, inicia sesión nuevamente.");
        logout(navigate);
        return;
      }
      
      // Usar el endpoint específico para obtener pólizas de un usuario
      const res = await API.get(`/policies/user/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSelectedUserPolicies(res.data || []);
      setViewUserPolicies(true);
    } catch (err: any) {
      console.error("Error cargando pólizas del usuario:", err);
      if (err.response?.status === 401) {
        alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
        logout(navigate);
      } else {
        alert("No se pudieron cargar las pólizas del usuario: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (id: number) => {
    if (!confirm("¿Eliminar póliza?")) return;
    try {
      await API.delete(`/policies/${id}`);
      alert("Póliza eliminada");
      loadPolicies({
        user_id: filterUserId || undefined,
        policy_number: filterPolicyNumber || undefined,
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
      placa: filterPlaca || undefined,
    });
    loadUsers({
      user_name: filterUserName.trim() || undefined,
      email: filterUserEmail.trim() || undefined,
      documento: filterUserDocumento.trim() || undefined,
    });
  };

  const handleEditRoles = (user: User) => {
    setEditingRoles(user.id);
    setNewRoles([...user.roles] || []);
  };

  const handleSaveRoles = async (userId: number) => {
    try {
      await API.patch(`/auth/users/${userId}/roles`, { roles: newRoles });
      alert("Roles actualizados correctamente");
      setEditingRoles(null);
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar roles");
    }
  };

  const toggleRole = (role: string) => {
    setNewRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const getStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.isactive).length;
    const totalPolicies = policies.length;
    const policiesExpiring = policies.filter((p) => {
      const finVigencia = new Date(p.fin_vigencia);
      const hoy = new Date();
      const unMes = new Date();
      unMes.setMonth(unMes.getMonth() + 1);
      return finVigencia >= hoy && finVigencia <= unMes;
    }).length;

    return {
      totalUsers,
      activeUsers,
      totalPolicies,
      policiesExpiring,
    };
  };

  const stats = getStats();

  return (
    <div className="admin-container" style={{ padding: 24 }}>
      <div className="admin-header">
        <h2>Panel Super Usuario</h2>
        <p style={{ color: "#666", marginTop: 8 }}>
          Acceso completo al sistema - Gestión de usuarios, pólizas y roles
        </p>
      </div>

      <div className="admin-actions" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button className="admin-btn" onClick={() => setActiveTab("users")}>
          👥 Usuarios
        </button>
        <button className="admin-btn" onClick={() => setActiveTab("policies")}>
          📋 Pólizas
        </button>
        <button className="admin-btn" onClick={() => setActiveTab("stats")}>
          📊 Estadísticas
        </button>
        <button className="admin-btn" onClick={loadUsers}>
          🔄 Refrescar
        </button>
        <button className="admin-btn" onClick={() => navigate("/admin/users/create")}>
          ➕ Crear Usuario
        </button>
        <button className="admin-btn" onClick={() => navigate("/admin/policies/create")}>
          ➕ Crear Póliza
        </button>
        <button className="admin-btn secondary" onClick={() => logout(navigate)}>
          🚪 Cerrar Sesión
        </button>
      </div>

      {/* Tab: Estadísticas */}
      {activeTab === "stats" && (
        <section className="admin-section">
          <h3>📊 Estadísticas del Sistema</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginTop: 16,
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: 20,
                borderRadius: 10,
                color: "white",
              }}
            >
              <h4 style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>Total Usuarios</h4>
              <p style={{ margin: 8, fontSize: 32, fontWeight: "bold" }}>{stats.totalUsers}</p>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                padding: 20,
                borderRadius: 10,
                color: "white",
              }}
            >
              <h4 style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>Usuarios Activos</h4>
              <p style={{ margin: 8, fontSize: 32, fontWeight: "bold" }}>{stats.activeUsers}</p>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                padding: 20,
                borderRadius: 10,
                color: "white",
              }}
            >
              <h4 style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>Total Pólizas</h4>
              <p style={{ margin: 8, fontSize: 32, fontWeight: "bold" }}>{stats.totalPolicies}</p>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                padding: 20,
                borderRadius: 10,
                color: "white",
              }}
            >
              <h4 style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>Por Vencer (1 mes)</h4>
              <p style={{ margin: 8, fontSize: 32, fontWeight: "bold" }}>{stats.policiesExpiring}</p>
            </div>
          </div>
        </section>
      )}

      {/* Tab: Usuarios */}
      {activeTab === "users" && (
        <section className="admin-section" style={{ marginBottom: 20 }}>
          <h3>👥 Gestión de Usuarios</h3>

          <div className="admin-filters" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              className="admin-input"
              placeholder="Filtrar por nombre"
              value={filterUserName}
              onChange={(e) => setFilterUserName(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Filtrar por email"
              value={filterUserEmail}
              onChange={(e) => setFilterUserEmail(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Filtrar por documento"
              value={filterUserDocumento}
              onChange={(e) => setFilterUserDocumento(e.target.value)}
            />
            <button className="admin-btn" onClick={handleSearch}>
              🔍 Filtrar
            </button>
            <button
              className="admin-btn secondary"
              onClick={() => {
                setFilterUserName("");
                setFilterUserEmail("");
                setFilterUserDocumento("");
                loadUsers();
              }}
            >
              🗑️ Limpiar
            </button>
          </div>

          {loading ? (
            <p className="admin-empty">Cargando...</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Documento</th>
                    <th>Roles</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.user_name}</td>
                      <td>{u.email}</td>
                      <td>{u.documento || "-"}</td>
                      <td>
                        {editingRoles === u.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {["user", "admin", "super_user"].map((role) => (
                              <label key={role} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <input
                                  type="checkbox"
                                  checked={newRoles.includes(role)}
                                  onChange={() => toggleRole(role)}
                                />
                                {role}
                              </label>
                            ))}
                            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                              <button
                                className="admin-btn"
                                style={{ padding: "4px 8px", fontSize: 12 }}
                                onClick={() => handleSaveRoles(u.id)}
                              >
                                ✅ Guardar
                              </button>
                              <button
                                className="admin-btn secondary"
                                style={{ padding: "4px 8px", fontSize: 12 }}
                                onClick={() => setEditingRoles(null)}
                              >
                                ❌ Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {Array.isArray(u.roles) ? u.roles.join(", ") : u.roles || "user"}
                            <button
                              className="admin-btn"
                              style={{ marginLeft: 8, padding: "4px 8px", fontSize: 12 }}
                              onClick={() => handleEditRoles(u)}
                            >
                              ✏️ Editar Roles
                            </button>
                          </div>
                        )}
                      </td>
                      <td>{u.isactive ? "✅ Activo" : "❌ Inactivo"}</td>
                      <td className="row-actions" style={{ display: "flex", gap: 8 }}>
                        <button className="edit" onClick={() => navigate(`/admin/users/edit/${u.id}`)}>
                          Editar
                        </button>
                        <button className="delete" onClick={() => handleDeleteUser(u.id)}>
                          Eliminar
                        </button>
                        <button className="view" onClick={() => handleViewUserPolicies(u)}>
                          Ver Pólizas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab: Pólizas */}
      {activeTab === "policies" && (
        <section className="admin-section">
          <h3>📋 Gestión de Pólizas</h3>

          <div className="admin-filters" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              className="admin-input"
              placeholder="Filtrar por user_id"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Filtrar por policy_number"
              value={filterPolicyNumber}
              onChange={(e) => setFilterPolicyNumber(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Filtrar por placa"
              value={filterPlaca}
              onChange={(e) => setFilterPlaca(e.target.value)}
            />
            <button className="admin-btn" onClick={handleSearch}>
              🔍 Filtrar
            </button>
            <button
              className="admin-btn secondary"
              onClick={() => {
                setFilterUserId("");
                setFilterPolicyNumber("");
                setFilterPlaca("");
                loadPolicies();
              }}
            >
              🗑️ Limpiar
            </button>
          </div>

          {loading ? (
            <p className="admin-empty">Cargando pólizas...</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
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
                      <td>{p.user?.user_name ?? "-"}</td>
                      <td>{p.user?.telefono ?? "-"}</td>
                      <td className="row-actions" style={{ display: "flex", gap: 8 }}>
                        <button className="edit" onClick={() => navigate(`/admin/policies/edit/${p.id_policy}`)}>
                          Editar
                        </button>
                        <button className="delete" onClick={() => handleDeletePolicy(p.id_policy)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {policies.length === 0 && (
                    <tr>
                      <td colSpan={10} className="admin-empty">
                        No hay pólizas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Modal de pólizas del usuario */}
      {viewUserPolicies && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Pólizas de {selectedUser?.user_name}</h3>
            <button className="close-modal" onClick={() => setViewUserPolicies(false)}>
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
                          onClick={() => {
                            navigate(`/admin/policies/edit/${p.id_policy}`);
                            setViewUserPolicies(false);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="delete"
                          onClick={async () => {
                            if (!confirm("¿Eliminar esta póliza?")) return;
                            try {
                              await API.delete(`/policies/${p.id_policy}`);
                              alert("Póliza eliminada");
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
    </div>
  );
}
