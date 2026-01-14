// src/pages/DashboardSuperUser.tsx
import React, { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { logout } from "../utils/logout";
import { getRoleLabel } from "../utils/getRoleLabel";

type User = {
  id: number;
  user_name: string;
  email: string;
  documento?: string;
  roles?: string[];
  isactive?: boolean;
  ciudad?: string;
  telefono?: string;
  company?: {
    id: number;
    nombre: string;
    nit?: string;
  };
  company_id?: number;
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
  const [editingCompany, setEditingCompany] = useState<number | null>(null);
  const [newCompanyId, setNewCompanyId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"users" | "policies" | "stats" | "companies" | "messages">("users");
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [responseText, setResponseText] = useState<string>("");
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [filterMessageCompany, setFilterMessageCompany] = useState<string>("");
  const [filterCompanyId, setFilterCompanyId] = useState<string>("");
  const [editingCompanyData, setEditingCompanyData] = useState<any>(null);
  const [companyForm, setCompanyForm] = useState<any>({
    nombre: "",
    nit: "",
    direccion: "",
    telefono: "",
    email: "",
    whatsapp_number: "",
    facebook_url: "",
    logo_url: "",
    color_primario: "#631025",
    color_secundario: "#4c55d3",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [useLogoUrl, setUseLogoUrl] = useState<boolean>(true); // true = URL, false = upload

  const navigate = useNavigate();

  const loadCompanies = async () => {
    try {
      const res = await API.get("/companies");
      setCompanies(res.data || []);
    } catch (error) {
      console.error("Error cargando empresas", error);
    }
  };

  const loadUsers = async (params: {
    user_name?: string;
    email?: string;
    documento?: string;
    skip?: number;
    limit?: number;
    company_id?: number;
  } = {}) => {
    try {
      setLoading(true);
      const finalParams = { ...params };
      if (filterCompanyId) {
        finalParams.company_id = Number(filterCompanyId);
      }
      const res = await API.get("/auth/users", { params: finalParams });
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

    loadCompanies();
    loadUsers();
    loadPolicies();
    // eslint-disable-next-line
  }, []);

  const handleToggleUserStatus = async (user: User) => {
    const action = user.isactive ? "desactivar" : "activar";
    const userType = user.roles?.includes("admin") || user.roles?.includes("super_user") 
      ? "usuario privilegiado" 
      : "usuario";
    
    if (!confirm(`¿Estás seguro de ${action} este ${userType}?`)) return;
    
    try {
      await API.patch(`/auth/users/${user.id}/toggle-status`);
      alert(`Usuario ${action === "activar" ? "activado" : "desactivado"} correctamente`);
      loadUsers();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Error al cambiar el estado del usuario";
      alert(`❌ ${errorMessage}`);
    }
  };

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

  const loadContactMessages = async () => {
    try {
      setLoading(true);
      const res = await API.get("/contact/messages");
      setContactMessages(res.data || []);
    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar mensajes de contacto");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await API.patch(`/contact/messages/${messageId}/read`);
      alert("✅ Mensaje marcado como leído");
      loadContactMessages();
    } catch (err) {
      console.error(err);
      alert("❌ Error al marcar como leído");
    }
  };

  const handleRespond = async () => {
    if (!selectedMessage || !responseText.trim()) {
      alert("❌ Por favor escribe una respuesta");
      return;
    }

    try {
      await API.patch(`/contact/messages/${selectedMessage.id}/respond`, {
        respuesta: responseText,
      });
      alert("✅ Respuesta enviada correctamente");
      setShowResponseModal(false);
      setResponseText("");
      setSelectedMessage(null);
      loadContactMessages();
    } catch (err) {
      console.error(err);
      alert("❌ Error al enviar respuesta");
    }
  };

  const handleSearch = () => {
    loadPolicies({
      user_id: filterUserId || undefined,
      policy_number: filterPolicyNumber || undefined,
      placa: filterPlaca || undefined,
      company_id: filterCompanyId ? Number(filterCompanyId) : undefined,
    });
    loadUsers({
      user_name: filterUserName.trim() || undefined,
      email: filterUserEmail.trim() || undefined,
      documento: filterUserDocumento.trim() || undefined,
      company_id: filterCompanyId ? Number(filterCompanyId) : undefined,
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

  const handleEditUserCompany = (user: User) => {
    setEditingCompany(user.id);
    setNewCompanyId(user.company?.id?.toString() || user.company_id?.toString() || "");
  };

  const handleSaveUserCompany = async (userId: number) => {
    try {
      await API.patch(`/auth/update/${userId}`, { 
        company_id: newCompanyId ? Number(newCompanyId) : null 
      });
      alert("Empresa asignada correctamente");
      setEditingCompany(null);
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Error al asignar empresa");
    }
  };

  const handleEditCompany = (company: any) => {
    setEditingCompanyData(company.id);
    setCompanyForm({
      nombre: company.nombre || "",
      nit: company.nit || "",
      direccion: company.direccion || "",
      telefono: company.telefono || "",
      email: company.email || "",
      whatsapp_number: company.whatsapp_number || "",
      facebook_url: company.facebook_url || "",
      logo_url: company.logo_url || "",
      color_primario: company.color_primario || "#631025",
      color_secundario: company.color_secundario || "#4c55d3",
    });
    // Si tiene logo_url, asumir que es URL externa si no empieza con /uploads/
    setUseLogoUrl(company.logo_url ? !company.logo_url.startsWith('/uploads/') : true);
    setLogoFile(null);
    setLogoPreview(company.logo_url && company.logo_url.startsWith('/uploads/') 
      ? `http://localhost:3000${company.logo_url}` 
      : company.logo_url || null);
  };

  const handleSaveCompany = async () => {
    try {
      const formData = new FormData();
      
      // Agregar todos los campos del formulario
      formData.append('nombre', companyForm.nombre);
      if (companyForm.nit) formData.append('nit', companyForm.nit);
      if (companyForm.direccion) formData.append('direccion', companyForm.direccion);
      if (companyForm.telefono) formData.append('telefono', companyForm.telefono);
      if (companyForm.email) formData.append('email', companyForm.email);
      if (companyForm.whatsapp_number) formData.append('whatsapp_number', companyForm.whatsapp_number);
      if (companyForm.facebook_url) formData.append('facebook_url', companyForm.facebook_url);
      if (companyForm.color_primario) formData.append('color_primario', companyForm.color_primario);
      if (companyForm.color_secundario) formData.append('color_secundario', companyForm.color_secundario);

      // Si se usa URL, agregar logo_url. Si se usa upload, agregar el archivo
      if (useLogoUrl && companyForm.logo_url) {
        formData.append('logo_url', companyForm.logo_url);
      } else if (!useLogoUrl && logoFile) {
        formData.append('logo', logoFile);
      }

      if (editingCompanyData && editingCompanyData !== 0) {
        await API.patch(`/companies/${editingCompanyData}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        alert("Empresa actualizada correctamente");
      } else {
        await API.post("/companies", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        alert("Empresa creada correctamente");
      }
      
      setEditingCompanyData(null);
      setCompanyForm({
        nombre: "",
        nit: "",
        direccion: "",
        telefono: "",
        email: "",
        whatsapp_number: "",
        facebook_url: "",
        logo_url: "",
        color_primario: "#631025",
        color_secundario: "#4c55d3",
      });
      setLogoFile(null);
      setLogoPreview(null);
      setUseLogoUrl(true);
      loadCompanies();
    } catch (err) {
      console.error(err);
      alert("Error al guardar empresa");
    }
  };

  const handleToggleCompanyStatus = async (company: any) => {
    const action = company.isactive ? "desactivar" : "activar";
    if (!confirm(`¿Estás seguro de ${action} esta empresa?`)) return;
    
    try {
      await API.patch(`/companies/${company.id}/toggle-status`);
      alert(`Empresa ${action === "activar" ? "activada" : "desactivada"} correctamente`);
      loadCompanies();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Error al cambiar el estado de la empresa";
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleDeleteCompany = async (id: number) => {
    if (!confirm("¿Eliminar empresa? Los usuarios asociados perderán su asignación.")) return;
    try {
      await API.delete(`/companies/${id}`);
      alert("Empresa eliminada correctamente");
      loadCompanies();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar empresa");
    }
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

  const rol = localStorage.getItem("rol");
  const userName = localStorage.getItem("user_name") || "Usuario";
  const roleLabel = getRoleLabel(rol);

  return (
    <div className="admin-container" style={{ padding: 24 }}>
      <div className="admin-header">
        <h2>Panel {roleLabel}</h2>
        <p style={{ color: "#666", marginTop: 8, fontSize: "16px" }}>
          👤 {userName}
        </p>
        <p style={{ color: "#666", marginTop: 4, fontSize: "14px" }}>
          Acceso completo al sistema - Gestión de usuarios, pólizas y roles
        </p>
      </div>

      <div className="admin-actions" style={{ 
        display: "flex", 
        gap: 12, 
        marginBottom: 12,
        position: "sticky",
        top: 0,
        background: "#fff",
        padding: "15px 0",
        zIndex: 100,
        borderBottom: "2px solid #ddd",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        flexWrap: "wrap"
      }}>
        <button className="admin-btn" onClick={() => setActiveTab("users")}>
          👥 Usuarios
        </button>
        <button className="admin-btn" onClick={() => setActiveTab("policies")}>
          📋 Pólizas
        </button>
        <button className="admin-btn" onClick={() => setActiveTab("stats")}>
          📊 Estadísticas
        </button>
        <button className="admin-btn" onClick={() => setActiveTab("companies")}>
          🏢 Empresas
        </button>
        <button className="admin-btn" onClick={() => { setActiveTab("messages"); loadContactMessages(); }}>
          💬 Mensajes
        </button>
        <button className="admin-btn" onClick={loadUsers}>
          🔄 Refrescar
        </button>
        <button 
          className="admin-btn secondary" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ⬆️ Arriba
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

          <div className="admin-filters" style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
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
            <select
              className="admin-input"
              value={filterCompanyId}
              onChange={(e) => setFilterCompanyId(e.target.value)}
              style={{ padding: "8px" }}
            >
              <option value="">Todas las empresas</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.nombre}</option>
              ))}
            </select>
            <button className="admin-btn" onClick={handleSearch}>
              🔍 Filtrar
            </button>
            <button
              className="admin-btn secondary"
              onClick={() => {
                setFilterUserName("");
                setFilterUserEmail("");
                setFilterUserDocumento("");
                setFilterCompanyId("");
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
                    <th>Empresa</th>
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
                        {editingCompany === u.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <select
                              value={newCompanyId}
                              onChange={(e) => setNewCompanyId(e.target.value)}
                              style={{ padding: "4px", fontSize: 12 }}
                            >
                              <option value="">Sin empresa</option>
                              {companies.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nombre}
                                </option>
                              ))}
                            </select>
                            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                              <button
                                className="admin-btn"
                                style={{ padding: "4px 8px", fontSize: 12 }}
                                onClick={() => handleSaveUserCompany(u.id)}
                              >
                                ✅ Guardar
                              </button>
                              <button
                                className="admin-btn secondary"
                                style={{ padding: "4px 8px", fontSize: 12 }}
                                onClick={() => setEditingCompany(null)}
                              >
                                ❌ Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {u.company?.nombre || "Sin empresa"}
                            <button
                              className="admin-btn"
                              style={{ marginLeft: 8, padding: "4px 8px", fontSize: 12 }}
                              onClick={() => handleEditUserCompany(u)}
                            >
                              ✏️ Editar
                            </button>
                          </div>
                        )}
                      </td>
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
                      <td>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={u.isactive || false}
                            onChange={() => handleToggleUserStatus(u)}
                            style={{ width: "20px", height: "20px", cursor: "pointer" }}
                          />
                          <span style={{ fontSize: "14px", color: u.isactive ? "#28a745" : "#dc3545" }}>
                            {u.isactive ? "Activo" : "Inactivo"}
                          </span>
                        </label>
                      </td>
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

          <div className="admin-filters" style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
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
            <select
              className="admin-input"
              value={filterCompanyId}
              onChange={(e) => setFilterCompanyId(e.target.value)}
              style={{ padding: "8px" }}
            >
              <option value="">Todas las empresas</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.nombre}</option>
              ))}
            </select>
            <button className="admin-btn" onClick={handleSearch}>
              🔍 Filtrar
            </button>
            <button
              className="admin-btn secondary"
              onClick={() => {
                setFilterUserId("");
                setFilterPolicyNumber("");
                setFilterPlaca("");
                setFilterCompanyId("");
                loadPolicies();
              }}
            >
              🗑️ Limpiar
            </button>
          </div>

          {loading ? (
            <p className="admin-empty">Cargando pólizas...</p>
          ) : (
            <div style={{ overflowX: "auto", maxWidth: "100%" }}>
              <table className="admin-table" style={{ width: "100%", marginTop: 12, minWidth: "1200px" }}>
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
                    <th>Empresa</th>
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
                      <td>{p.company?.nombre || "Sin empresa"}</td>
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
                      <td colSpan={11} className="admin-empty">
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

      {/* Tab: Empresas */}
      {activeTab === "companies" && (
        <section className="admin-section">
          <h3>🏢 Gestión de Empresas</h3>

          <div style={{ marginBottom: 20 }}>
            <button
              className="admin-btn"
              onClick={() => {
                setEditingCompanyData(0); // 0 significa crear nuevo
                setCompanyForm({
                  nombre: "",
                  nit: "",
                  direccion: "",
                  telefono: "",
                  email: "",
                  whatsapp_number: "",
                  facebook_url: "",
                  logo_url: "",
                  color_primario: "#631025",
                  color_secundario: "#4c55d3",
                });
                setLogoFile(null);
                setLogoPreview(null);
                setUseLogoUrl(true);
              }}
            >
              ➕ Crear Nueva Empresa
            </button>
          </div>

          {/* Formulario de creación/edición */}
          {editingCompanyData !== null && (
            <div style={{
              background: "#f5f5f5",
              padding: 20,
              borderRadius: 8,
              marginBottom: 20
            }}>
              <h4>{editingCompanyData === 0 ? "Crear Nueva Empresa" : "Editar Empresa"}</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 10 }}>
                <input
                  className="admin-input"
                  placeholder="Nombre de la empresa *"
                  value={companyForm.nombre}
                  onChange={(e) => setCompanyForm({...companyForm, nombre: e.target.value})}
                  required
                />
                <input
                  className="admin-input"
                  placeholder="NIT"
                  value={companyForm.nit}
                  onChange={(e) => setCompanyForm({...companyForm, nit: e.target.value})}
                />
                <input
                  className="admin-input"
                  placeholder="Dirección"
                  value={companyForm.direccion}
                  onChange={(e) => setCompanyForm({...companyForm, direccion: e.target.value})}
                />
                <input
                  className="admin-input"
                  placeholder="Teléfono"
                  value={companyForm.telefono}
                  onChange={(e) => setCompanyForm({...companyForm, telefono: e.target.value})}
                />
                <input
                  className="admin-input"
                  placeholder="Email"
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({...companyForm, email: e.target.value})}
                />
                <input
                  className="admin-input"
                  placeholder="Número de WhatsApp (ej: 573026603858)"
                  value={companyForm.whatsapp_number}
                  onChange={(e) => setCompanyForm({...companyForm, whatsapp_number: e.target.value})}
                />
                <input
                  className="admin-input"
                  placeholder="URL de Facebook (ej: https://www.facebook.com/tu-pagina)"
                  type="url"
                  value={companyForm.facebook_url}
                  onChange={(e) => setCompanyForm({...companyForm, facebook_url: e.target.value})}
                />
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                    Logo de la Empresa
                  </label>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        checked={useLogoUrl}
                        onChange={() => setUseLogoUrl(true)}
                      />
                      Usar URL
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        checked={!useLogoUrl}
                        onChange={() => setUseLogoUrl(false)}
                      />
                      Subir desde PC
                    </label>
                  </div>
                  
                  {useLogoUrl ? (
                    <input
                      className="admin-input"
                      placeholder="URL del logo (ej: https://ejemplo.com/logo.png)"
                      value={companyForm.logo_url}
                      onChange={(e) => setCompanyForm({...companyForm, logo_url: e.target.value})}
                    />
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLogoFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLogoPreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ padding: "8px", width: "100%" }}
                      />
                      {logoPreview && (
                        <div style={{ marginTop: "10px" }}>
                          <img
                            src={logoPreview}
                            alt="Preview"
                            style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "8px" }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <input
                  className="admin-input"
                  placeholder="Color primario (hex)"
                  value={companyForm.color_primario}
                  onChange={(e) => setCompanyForm({...companyForm, color_primario: e.target.value})}
                />
                <input
                  className="admin-input"
                  placeholder="Color secundario (hex)"
                  value={companyForm.color_secundario}
                  onChange={(e) => setCompanyForm({...companyForm, color_secundario: e.target.value})}
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                <button className="admin-btn" onClick={handleSaveCompany}>
                  💾 {editingCompanyData === 0 ? "Crear" : "Actualizar"} Empresa
                </button>
                <button
                  className="admin-btn secondary"
                  onClick={() => {
                    setEditingCompanyData(null);
                    setCompanyForm({
                      nombre: "",
                      nit: "",
                      direccion: "",
                      telefono: "",
                      email: "",
                      whatsapp_number: "",
                      facebook_url: "",
                      logo_url: "",
                      color_primario: "#631025",
                      color_secundario: "#4c55d3",
                    });
                    setLogoFile(null);
                    setLogoPreview(null);
                    setUseLogoUrl(true);
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Tabla de empresas */}
          {loading ? (
            <p className="admin-empty">Cargando empresas...</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>NIT</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Colores</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.nombre}</td>
                      <td>{c.nit || "-"}</td>
                      <td>{c.email || "-"}</td>
                      <td>{c.telefono || "-"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              background: c.color_primario || "#631025",
                              border: "1px solid #ccc",
                              borderRadius: 4
                            }}
                          />
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              background: c.color_secundario || "#4c55d3",
                              border: "1px solid #ccc",
                              borderRadius: 4
                            }}
                          />
                        </div>
                      </td>
                      <td>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={c.isactive || false}
                            onChange={() => handleToggleCompanyStatus(c)}
                            style={{ width: "20px", height: "20px", cursor: "pointer" }}
                          />
                          <span style={{ fontSize: "14px", color: c.isactive ? "#28a745" : "#dc3545" }}>
                            {c.isactive ? "Activa" : "Inactiva"}
                          </span>
                        </label>
                      </td>
                      <td className="row-actions" style={{ display: "flex", gap: 8 }}>
                        <button
                          className="edit"
                          onClick={() => handleEditCompany(c)}
                        >
                          Editar
                        </button>
                        <button
                          className="delete"
                          onClick={() => handleDeleteCompany(c.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr>
                      <td colSpan={8} className="admin-empty">
                        No hay empresas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === "messages" && (
        <section className="admin-section">
          <h3>💬 Mensajes de Contacto</h3>
          
          {/* Filtros */}
          <div className="admin-filters" style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ fontWeight: "bold", minWidth: "120px" }}>Filtrar por Empresa:</label>
            <select
              className="admin-input"
              value={filterMessageCompany}
              onChange={(e) => setFilterMessageCompany(e.target.value)}
              style={{ padding: "8px", minWidth: "200px" }}
            >
              <option value="">Todas las empresas</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.nombre}
                </option>
              ))}
            </select>
            <button 
              className="admin-btn secondary" 
              onClick={() => setFilterMessageCompany("")}
              style={{ padding: "8px 15px" }}
            >
              🗑️ Limpiar Filtro
            </button>
          </div>

          <button className="admin-btn" onClick={loadContactMessages} style={{ marginBottom: "10px" }}>
            🔄 Actualizar Mensajes
          </button>

          {loading ? (
            <p className="admin-empty">Cargando mensajes...</p>
          ) : (
            <div style={{ overflowX: "auto", maxWidth: "100%" }}>
              <table className="admin-table" style={{ width: "100%", marginTop: 12, minWidth: "1000px" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>De</th>
                  <th>Email</th>
                  <th>Asunto</th>
                  <th>Mensaje</th>
                  <th>Usuario</th>
                  <th>Empresa</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contactMessages
                  .filter((msg: any) => {
                    // Filtrar por compañía si hay un filtro seleccionado
                    if (filterMessageCompany) {
                      const companyId = Number(filterMessageCompany);
                      return msg.company?.id === companyId;
                    }
                    return true; // Mostrar todos si no hay filtro
                  })
                  .map((msg: any) => (
                  <tr key={msg.id} style={{ background: msg.leido ? "#f0f0f0" : "#fff3cd" }}>
                    <td>{msg.id}</td>
                    <td>{msg.nombre}</td>
                    <td>{msg.email}</td>
                    <td>{msg.asunto}</td>
                    <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {msg.mensaje.substring(0, 50)}...
                    </td>
                    <td>{msg.user?.user_name || "Visitante"}</td>
                    <td>{msg.company?.nombre || "-"}</td>
                    <td>{new Date(msg.created_at).toLocaleString('es-ES')}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {msg.leido ? (
                          <span style={{ color: "#28a745", fontSize: "12px" }}>✓ Leído</span>
                        ) : (
                          <span style={{ color: "#ff9800", fontSize: "12px" }}>⏳ Pendiente</span>
                        )}
                        {msg.respondido && (
                          <span style={{ color: "#2196f3", fontSize: "12px" }}>💬 Respondido</span>
                        )}
                      </div>
                    </td>
                    <td className="row-actions" style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                      <button
                        className="view"
                        onClick={() => {
                          setSelectedMessage(msg);
                          setShowResponseModal(true);
                        }}
                      >
                        Ver/Responder
                      </button>
                      {!msg.leido && (
                        <button
                          className="edit"
                          onClick={() => handleMarkAsRead(msg.id)}
                        >
                          Marcar Leído
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {contactMessages.filter((msg: any) => {
                  if (filterMessageCompany) {
                    const companyId = Number(filterMessageCompany);
                    return msg.company?.id === companyId;
                  }
                  return true;
                }).length === 0 && (
                  <tr>
                    <td colSpan={10} className="admin-empty">
                      {filterMessageCompany 
                        ? "No hay mensajes de contacto para la empresa seleccionada"
                        : "No hay mensajes de contacto"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          )}

          {/* Modal para ver y responder mensaje */}
          {showResponseModal && selectedMessage && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: "600px" }}>
                <h3>Mensaje de {selectedMessage.nombre}</h3>
                <button
                  className="close-modal"
                  onClick={() => {
                    setShowResponseModal(false);
                    setSelectedMessage(null);
                    setResponseText("");
                  }}
                >
                  Cerrar ✖
                </button>

                <div style={{ marginTop: "20px" }}>
                  <p><strong>Email:</strong> {selectedMessage.email}</p>
                  <p><strong>Asunto:</strong> {selectedMessage.asunto}</p>
                  <p><strong>Fecha:</strong> {new Date(selectedMessage.created_at).toLocaleString('es-ES')}</p>
                  <p><strong>Usuario:</strong> {selectedMessage.user?.user_name || "Visitante"}</p>
                  {selectedMessage.company && (
                    <p><strong>Empresa:</strong> {selectedMessage.company.nombre}</p>
                  )}
                  <div style={{ marginTop: "15px", padding: "15px", background: "#f5f5f5", borderRadius: "4px" }}>
                    <strong>Mensaje:</strong>
                    <p style={{ whiteSpace: "pre-wrap", marginTop: "5px" }}>{selectedMessage.mensaje}</p>
                  </div>

                  {selectedMessage.respondido && selectedMessage.respuesta && (
                    <div style={{ marginTop: "15px", padding: "15px", background: "#e3f2fd", borderRadius: "4px" }}>
                      <strong>Respuesta anterior:</strong>
                      <p style={{ whiteSpace: "pre-wrap", marginTop: "5px" }}>{selectedMessage.respuesta}</p>
                      <small style={{ color: "#666" }}>
                        Respondido el: {new Date(selectedMessage.responded_at).toLocaleString('es-ES')}
                      </small>
                    </div>
                  )}

                  <div style={{ marginTop: "20px" }}>
                    <label>
                      <strong>Tu respuesta:</strong>
                    </label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Escribe tu respuesta aquí..."
                      rows={6}
                      style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "4px", border: "1px solid #ddd" }}
                    />
                  </div>

                  <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                    <button className="admin-btn" onClick={handleRespond}>
                      {selectedMessage.respondido ? "Actualizar Respuesta" : "Enviar Respuesta"}
                    </button>
                    {!selectedMessage.leido && (
                      <button
                        className="admin-btn secondary"
                        onClick={() => {
                          handleMarkAsRead(selectedMessage.id);
                          setSelectedMessage({ ...selectedMessage, leido: true });
                        }}
                      >
                        Marcar como Leído
                      </button>
                    )}
                  </div>
                </div>
              </div>
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
                    <th>Empresa</th>
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
                      <td>{p.company?.nombre || "Sin empresa"}</td>
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
