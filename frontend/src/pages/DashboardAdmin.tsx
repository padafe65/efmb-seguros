  // src/pages/DashboardAdmin.tsx
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
  };

  type Policy = any;

  export default function DashboardAdmin(): JSX.Element {
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
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [responseText, setResponseText] = useState<string>("");
  const [showResponseModal, setShowResponseModal] = useState(false);

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

useEffect(() => {
  const token = localStorage.getItem("token");
  console.log("🟦 Token en DashboardAdmin:", token);
  const rol = localStorage.getItem("rol");
  console.log("🟦 Rol en DashboardAdmin:", rol);

  // Permitir acceso a admin y sub_admin
  if (!token || (rol !== "admin" && rol !== "sub_admin")) {
    logout(navigate);
    return;
  }

  loadUsers();
  loadPolicies();
  loadContactMessages();
  // eslint-disable-next-line
}, []);

    const handleToggleUserStatus = async (user: User) => {
      // Admin solo puede activar/desactivar usuarios con rol "user"
      const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
      const isPrivilegedUser = userRoles.includes("admin") || userRoles.includes("super_user");
      
      if (isPrivilegedUser) {
        alert("⚠️ No tienes permisos para activar/desactivar usuarios con roles privilegiados (admin o super_user). Solo un super_user puede hacerlo.");
        return;
      }

      const action = user.isactive ? "desactivar" : "activar";
      if (!confirm(`¿Estás seguro de ${action} este usuario?`)) return;
      
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


    const scrollToSection = (sectionId: string) => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

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
        </div>

        {/* Barra de navegación fija */}
        <div style={{
          position: "sticky",
          top: 0,
          background: "#fff",
          padding: "10px 0",
          borderBottom: "2px solid #ddd",
          zIndex: 100,
          marginBottom: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            <button 
              className="admin-btn" 
              onClick={() => scrollToSection('section-users')}
              style={{ fontSize: "14px", padding: "8px 15px" }}
            >
              👥 Usuarios
            </button>
            <button 
              className="admin-btn" 
              onClick={() => scrollToSection('section-policies')}
              style={{ fontSize: "14px", padding: "8px 15px" }}
            >
              📋 Pólizas
            </button>
            <button 
              className="admin-btn" 
              onClick={() => scrollToSection('section-messages')}
              style={{ fontSize: "14px", padding: "8px 15px" }}
            >
              💬 Mensajes
            </button>
            <button 
              className="admin-btn secondary" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{ fontSize: "14px", padding: "8px 15px" }}
            >
              ⬆️ Arriba
            </button>
          </div>
        </div>

        <div className="admin-actions" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <button className="admin-btn" onClick={loadUsers}>Refrescar Usuarios</button>
          <button className="admin-btn" onClick={() => navigate("/admin/users/create")}>Crear Usuario</button>
          <button className="admin-btn" onClick={() => navigate("/admin/policies/create")}>Crear Póliza</button>
          <button className="admin-btn secondary" onClick={() => logout(navigate)}>Cerrar Sesión</button>
        </div>

        <section id="section-users" className="admin-section" style={{ marginBottom: 20, scrollMarginTop: "100px" }}>
          <h3>👥 Usuarios</h3>

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
                  <th>Estado</th>
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
                    <td>
                      {/* Admin solo puede activar/desactivar usuarios con rol "user" */}
                      {(!Array.isArray(u.roles) || (!u.roles.includes("admin") && !u.roles.includes("super_user"))) ? (
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
                      ) : (
                        <span style={{ fontSize: "14px", color: u.isactive ? "#28a745" : "#dc3545" }}>
                          {u.isactive ? "Activo" : "Inactivo"}
                          <br />
                          <small style={{ fontSize: "11px", color: "#999", fontStyle: "italic" }}>
                            (Solo super_user puede cambiar)
                          </small>
                        </span>
                      )}
                    </td>
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

        <section id="section-policies" className="admin-section" style={{ scrollMarginTop: "100px" }}>
          <h3>📋 CRUD de pólizas</h3>

          <div className="admin-filters" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input className="admin-input" placeholder="Filtrar por user_id" value={filterUserId} onChange={e => setFilterUserId(e.target.value)} />
            <input className="admin-input" placeholder="Filtrar por policy_number" value={filterPolicyNumber} onChange={e => setFilterPolicyNumber(e.target.value)} />
            <input className="admin-input" placeholder="Filtrar por placa" value={filterPlaca} onChange={e => setFilterPlaca(e.target.value)} />
            <button className="admin-btn" onClick={handleSearch}>Filtrar</button>
            <button className="admin-btn secondary" onClick={() => { setFilterUserId(""); setFilterPolicyNumber(""); loadPolicies(); }}>Quitar filtros</button>
          </div>

          {loading ? <p className="admin-empty">Cargando pólizas...</p> : (
            <div style={{ overflowX: "auto", maxWidth: "100%" }}>
              <table className="admin-table" style={{ width: "100%", marginTop: 12, minWidth: "800px" }}>
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
                      <td>{p.user?.user_name ?? "-"}</td>
                      <td>{p.user?.id ?? "-"}</td>
                      <td>{p.user?.telefono ?? "-"}</td>
                      <td className="row-actions" style={{ display: "flex", gap: 8 }}>
                        <button className="edit" onClick={() => navigate(`/admin/policies/edit/${p.id_policy}`)}>Editar</button>
                        <button className="delete" onClick={() => handleDeletePolicy(p.id_policy)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                  {policies.length === 0 && <tr><td colSpan={11} className="admin-empty">No hay pólizas</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>

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

        <section id="section-messages" className="admin-section" style={{ scrollMarginTop: "100px" }}>
          <h3>💬 Mensajes de Contacto</h3>
          <button className="admin-btn" onClick={loadContactMessages} style={{ marginBottom: "10px" }}>
            🔄 Actualizar Mensajes
          </button>

          {loading ? (
            <p className="admin-empty">Cargando mensajes...</p>
          ) : (
            <div style={{ overflowX: "auto", maxWidth: "100%" }}>
              <table className="admin-table" style={{ width: "100%", marginTop: 12, minWidth: "900px" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>De</th>
                  <th>Email</th>
                  <th>Asunto</th>
                  <th>Mensaje</th>
                  <th>Usuario</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contactMessages.map((msg: any) => (
                  <tr key={msg.id} style={{ background: msg.leido ? "#f0f0f0" : "#fff3cd" }}>
                    <td>{msg.id}</td>
                    <td>{msg.nombre}</td>
                    <td>{msg.email}</td>
                    <td>{msg.asunto}</td>
                    <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {msg.mensaje.substring(0, 50)}...
                    </td>
                    <td>{msg.user?.user_name || "Visitante"}</td>
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
                {contactMessages.length === 0 && (
                  <tr>
                    <td colSpan={9} className="admin-empty">
                      No hay mensajes de contacto
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
      </div>
    );
  }
