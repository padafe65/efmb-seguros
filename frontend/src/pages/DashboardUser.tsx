// src/pages/DashboardUser.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FlipFormCard from "../components/FlipFormCard";
import API from "../api/axiosConfig";
import { logout } from "../utils/logout";

type User = {
  id: number;
  user_name: string;
  documento?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  actividad_empresa?: string;
  representante_legal?: string;
  fecha_nacimiento?: string | null;
};

type Policy = {
  id_policy: number;
  policy_number: string;
  tipo_poliza: string;
  inicio_vigencia?: string | null;
  fin_vigencia?: string | null;
  valor_asegurado?: number | null;
  compania_seguros?: string | null;
  tipo_riesgo?: string | null;
  placa?: string | null;
  modelo?: string | null;
  notificada?: boolean;
};

type ViewType = 
  | "dashboard" 
  | "datos" 
  | "polizas" 
  | "notificaciones" 
  | "estadisticas" 
  | "aprender" 
  | "contacto" 
  | "promociones";

export default function DashboardUser(): JSX.Element {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [form, setForm] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);

  // Filtros para pólizas
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [searchPolicy, setSearchPolicy] = useState<string>("");
  const [searchPlaca, setSearchPlaca] = useState<string>("");

  // Formulario de contacto
  const [contactForm, setContactForm] = useState({
    nombre: "",
    email: "",
    asunto: "",
    mensaje: "",
  });

  // obtiene id desde token
  const getUserIdFromToken = useCallback((): number | null => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const id = payload.id_user ?? payload.id ?? null;
      return typeof id === "number" ? id : Number(id) || null;
    } catch {
      return null;
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/auth/getUserExpress", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setUser(data);
      return data;
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPolicies = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      const res = await API.get(`/policies/user/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setPolicies(res.data || []);
    } catch (err) {
      console.error("loadPolicies error", err);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("rol");

    if (!token || role !== "user") {
      navigate("/", { replace: true });
      return;
    }

    const id = getUserIdFromToken();
    if (!id) {
      localStorage.clear();
      navigate("/", { replace: true });
      return;
    }

    loadUser().then((data) => {
      if (data?.id) {
        loadPolicies(data.id);
        // Cargar datos de la empresa si el usuario tiene company_id
        if (data.company_id || data.company?.id) {
          const companyId = data.company_id || data.company?.id;
          API.get(`/companies/${companyId}`)
            .then(res => setCompanyData(res.data))
            .catch(err => console.error('Error cargando empresa', err));
        }
      }
    });
  }, [navigate, getUserIdFromToken, loadUser, loadPolicies]);

  // Funciones de navegación
  const handleViewChange = async (view: ViewType) => {
    setCurrentView(view);
    
    if (view === "datos") {
    const latest = await loadUser();
    const u = latest || user;
    if (u) {
      setForm({
        user_name: u.user_name,
        documento: u.documento,
        email: u.email,
        direccion: u.direccion,
        ciudad: u.ciudad,
        telefono: u.telefono,
        actividad_empresa: u.actividad_empresa,
        representante_legal: u.representante_legal,
        fecha_nacimiento: u.fecha_nacimiento
          ? String(u.fecha_nacimiento).substring(0, 10)
          : "",
      });
      }
    } else if (view === "polizas") {
      const id = getUserIdFromToken();
      if (id) {
        await loadPolicies(id);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await API.patch(
        "/auth/update",
        { ...form },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Datos actualizados correctamente");
      await loadUser();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar");
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Obtener user_id si el usuario está logueado
      const userId = getUserIdFromToken();
      
      const payload: any = {
        nombre: contactForm.nombre,
        email: contactForm.email,
        asunto: contactForm.asunto,
        mensaje: contactForm.mensaje,
      };
      
      // Agregar user_id solo si el usuario está logueado
      if (userId) {
        payload.user_id = userId;
      }
      
      await API.post("/contact/send-message", payload);
      
      alert("✅ Mensaje enviado correctamente. Nos pondremos en contacto contigo pronto.");
      setContactForm({ nombre: "", email: "", asunto: "", mensaje: "" });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Error al enviar el mensaje";
      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de utilidad
  const getPolicyStatus = (finVigencia: string | null): { status: string; color: string; days: number } => {
    if (!finVigencia) return { status: "Sin fecha", color: "gray", days: 0 };
    
    const fin = new Date(finVigencia);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);
    
    const diffTime = fin.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: "Vencida", color: "red", days: Math.abs(diffDays) };
    } else if (diffDays <= 30) {
      return { status: "Por vencer", color: "orange", days: diffDays };
    } else {
      return { status: "Activa", color: "green", days: diffDays };
    }
  };

  const getPoliciesStats = () => {
    const total = policies.length;
    const activasList = policies.filter(p => {
      const status = getPolicyStatus(p.fin_vigencia);
      return status.status === "Activa";
    });
    const activas = activasList.length;
    
    const porVencer = policies.filter(p => {
      const status = getPolicyStatus(p.fin_vigencia);
      return status.status === "Por vencer";
    }).length;
    
    const vencidasList = policies.filter(p => {
      const status = getPolicyStatus(p.fin_vigencia);
      return status.status === "Vencida";
    });
    const vencidas = vencidasList.length;
    
    // Convertir a número para evitar concatenación
    const totalAseguradoActivas = activasList.reduce((sum, p) => {
      const valor = typeof p.valor_asegurado === 'string' 
        ? parseFloat(p.valor_asegurado) || 0 
        : Number(p.valor_asegurado) || 0;
      return sum + valor;
    }, 0);
    
    const totalAseguradoVencidas = vencidasList.reduce((sum, p) => {
      const valor = typeof p.valor_asegurado === 'string' 
        ? parseFloat(p.valor_asegurado) || 0 
        : Number(p.valor_asegurado) || 0;
      return sum + valor;
    }, 0);
    
    return { total, activas, porVencer, vencidas, totalAseguradoActivas, totalAseguradoVencidas };
  };

  const getFilteredPolicies = () => {
    let filtered = [...policies];
    
    if (filterTipo) {
      filtered = filtered.filter(p => 
        p.tipo_poliza.toLowerCase().includes(filterTipo.toLowerCase())
      );
    }
    
    if (filterEstado) {
      filtered = filtered.filter(p => {
        const status = getPolicyStatus(p.fin_vigencia);
        return status.status === filterEstado;
      });
    }
    
    if (searchPolicy) {
      filtered = filtered.filter(p => 
        p.policy_number.toLowerCase().includes(searchPolicy.toLowerCase())
      );
    }
    
    if (searchPlaca) {
      filtered = filtered.filter(p => 
        p.placa && p.placa.toLowerCase().includes(searchPlaca.toLowerCase())
      );
    }
    
    return filtered;
  };

  const stats = getPoliciesStats();
  const filteredPolicies = getFilteredPolicies();
  const policiesExpiring = policies.filter(p => {
    const status = getPolicyStatus(p.fin_vigencia);
    return status.status === "Por vencer";
  });

  // Render de vistas
  const renderDashboard = () => (
    <div>
      <h2>Dashboard</h2>
      
      {/* Alertas */}
      {policiesExpiring.length > 0 && (
        <div style={{
          background: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "20px"
        }}>
          <h3 style={{ marginTop: 0, color: "#856404" }}>⚠️ Alertas</h3>
          <p style={{ color: "#856404" }}>
            Tienes <strong>{policiesExpiring.length}</strong> póliza(s) próxima(s) a vencer en los próximos 30 días.
          </p>
          <ul style={{ color: "#856404" }}>
            {policiesExpiring.slice(0, 3).map(p => {
              const status = getPolicyStatus(p.fin_vigencia);
              return (
                <li key={p.id_policy}>
                  Póliza {p.policy_number} - Vence en {status.days} días
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Resumen */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "20px"
      }}>
        <div style={{
          background: "#e3f2fd",
          padding: "20px",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <h3 style={{ margin: 0, fontSize: "32px", color: "#1976d2" }}>{stats.total}</h3>
          <p style={{ margin: "8px 0 0", color: "#666" }}>Total Pólizas</p>
        </div>
        <div style={{
          background: "#e8f5e9",
          padding: "20px",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <h3 style={{ margin: 0, fontSize: "32px", color: "#388e3c" }}>{stats.activas}</h3>
          <p style={{ margin: "8px 0 0", color: "#666" }}>Pólizas Activas</p>
        </div>
        <div style={{
          background: "#fff3e0",
          padding: "20px",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <h3 style={{ margin: 0, fontSize: "32px", color: "#f57c00" }}>{stats.porVencer}</h3>
          <p style={{ margin: "8px 0 0", color: "#666" }}>Por Vencer</p>
        </div>
        <div style={{
          background: "#e8f5e9",
          padding: "20px",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <h3 style={{ margin: 0, fontSize: "24px", color: "#388e3c" }}>
            ${stats.totalAseguradoActivas.toLocaleString()}
          </h3>
          <p style={{ margin: "8px 0 0", color: "#666" }}>Total Asegurado (Activas)</p>
        </div>
        <div style={{
          background: "#ffebee",
          padding: "20px",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <h3 style={{ margin: 0, fontSize: "24px", color: "#c62828" }}>
            ${stats.totalAseguradoVencidas.toLocaleString()}
          </h3>
          <p style={{ margin: "8px 0 0", color: "#666" }}>Total Asegurado (Vencidas)</p>
        </div>
      </div>

      {/* Pólizas recientes */}
      <div>
        <h3>Pólizas Recientes</h3>
        {policies.slice(0, 5).length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "10px", textAlign: "left" }}>No. Póliza</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Tipo</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Estado</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Vence</th>
              </tr>
            </thead>
            <tbody>
              {policies.slice(0, 5).map(p => {
                const status = getPolicyStatus(p.fin_vigencia);
  return (
                  <tr key={p.id_policy}>
                    <td style={{ padding: "10px" }}>{p.policy_number}</td>
                    <td style={{ padding: "10px" }}>{p.tipo_poliza}</td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ 
                        color: status.color, 
                        fontWeight: "bold" 
                      }}>
                        {status.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      {p.fin_vigencia 
                        ? new Date(p.fin_vigencia).toLocaleDateString() 
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No tienes pólizas registradas</p>
        )}
        {policies.length > 5 && (
          <button 
            onClick={() => handleViewChange("polizas")}
            style={{ marginTop: "10px", padding: "8px 16px" }}
          >
            Ver todas las pólizas
          </button>
        )}
      </div>
    </div>
  );

  const renderPolizas = () => (
    <div>
      <h2>Mis Pólizas</h2>
      
      {/* Filtros */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "10px",
        marginBottom: "20px",
        padding: "15px",
        background: "#f5f5f5",
        borderRadius: "8px"
      }}>
        <input
          type="text"
          placeholder="Buscar por número de póliza..."
          value={searchPolicy}
          onChange={(e) => setSearchPolicy(e.target.value)}
          style={{ padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Buscar por placa..."
          value={searchPlaca}
          onChange={(e) => setSearchPlaca(e.target.value)}
          style={{ padding: "8px" }}
        />
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          style={{ padding: "8px" }}
        >
          <option value="">Todos los tipos</option>
          {Array.from(new Set(policies.map(p => p.tipo_poliza))).map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          style={{ padding: "8px" }}
        >
          <option value="">Todos los estados</option>
          <option value="Activa">Activa</option>
          <option value="Por vencer">Por vencer</option>
          <option value="Vencida">Vencida</option>
        </select>
      </div>

      {/* Tabla de pólizas */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>No. Póliza</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Tipo</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Inicio</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Fin</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Estado</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Valor</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPolicies.map((p) => {
              const status = getPolicyStatus(p.fin_vigencia);
              return (
                <tr key={p.id_policy} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "10px" }}>{p.policy_number}</td>
                  <td style={{ padding: "10px" }}>{p.tipo_poliza}</td>
                  <td style={{ padding: "10px" }}>
                    {p.inicio_vigencia
                      ? new Date(p.inicio_vigencia).toLocaleDateString()
                      : "-"}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {p.fin_vigencia
                      ? new Date(p.fin_vigencia).toLocaleDateString()
                      : "-"}
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span style={{ 
                      color: status.color, 
                      fontWeight: "bold" 
                    }}>
                      {status.status}
                      {status.days > 0 && status.status !== "Activa" && ` (${status.days} días)`}
                    </span>
                  </td>
                  <td style={{ padding: "10px" }}>
                    {p.valor_asegurado 
                      ? `$${p.valor_asegurado.toLocaleString()}` 
                      : "-"}
                  </td>
                  <td style={{ padding: "10px" }}>
                    <button 
                      onClick={() => navigate(`/policy/view/${p.id_policy}`)}
                      style={{ padding: "5px 10px", marginRight: "5px" }}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredPolicies.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "20px", textAlign: "center" }}>
                  No se encontraron pólizas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderNotificaciones = () => (
    <div>
      <h2>🔔 Notificaciones</h2>
      <div style={{ marginTop: "20px" }}>
        <h3>Notificaciones Recientes</h3>
        {policiesExpiring.length > 0 ? (
          <div>
            {policiesExpiring.map(p => {
              const status = getPolicyStatus(p.fin_vigencia);
              return (
                <div 
                  key={p.id_policy}
                  style={{
                    background: "#fff3cd",
                    border: "1px solid #ffc107",
                    borderRadius: "8px",
                    padding: "15px",
                    marginBottom: "10px"
                  }}
                >
                  <strong>⚠️ Póliza próxima a vencer</strong>
                  <p style={{ margin: "5px 0" }}>
                    Tu póliza <strong>{p.policy_number}</strong> ({p.tipo_poliza}) 
                    vence en <strong>{status.days} días</strong>.
                  </p>
                  <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>
                    Fecha de vencimiento: {p.fin_vigencia 
                      ? new Date(p.fin_vigencia).toLocaleDateString() 
                      : "-"}
                  </p>
                  <p style={{ margin: "5px 0", fontSize: "12px", color: "#999" }}>
                    {p.notificada 
                      ? "✅ Notificación enviada por email y WhatsApp" 
                      : "⏳ Notificación pendiente"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p>No tienes notificaciones pendientes</p>
        )}
      </div>
    </div>
  );

  const renderEstadisticas = () => {
    const tiposPoliza = policies.reduce((acc, p) => {
      acc[p.tipo_poliza] = (acc[p.tipo_poliza] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div>
        <h2>📊 Estadísticas</h2>
        <div style={{ marginTop: "20px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px"
          }}>
            <div style={{
              background: "#f5f5f5",
              padding: "20px",
              borderRadius: "8px"
            }}>
              <h3>Resumen General</h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li style={{ padding: "8px 0" }}>
                  <strong>Total de pólizas:</strong> {stats.total}
                </li>
                <li style={{ padding: "8px 0" }}>
                  <strong>Pólizas activas:</strong> {stats.activas}
                </li>
                <li style={{ padding: "8px 0" }}>
                  <strong>Por vencer:</strong> {stats.porVencer}
                </li>
                <li style={{ padding: "8px 0" }}>
                  <strong>Vencidas:</strong> {stats.vencidas}
                </li>
                <li style={{ padding: "8px 0" }}>
                  <strong>Total asegurado (activas):</strong> ${stats.totalAseguradoActivas.toLocaleString()}
                </li>
                <li style={{ padding: "8px 0" }}>
                  <strong>Total asegurado (vencidas):</strong> ${stats.totalAseguradoVencidas.toLocaleString()}
                </li>
              </ul>
            </div>

            <div style={{
              background: "#f5f5f5",
              padding: "20px",
              borderRadius: "8px"
            }}>
              <h3>Pólizas por Tipo</h3>
              {Object.keys(tiposPoliza).length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {Object.entries(tiposPoliza).map(([tipo, count]) => (
                    <li key={tipo} style={{ padding: "8px 0" }}>
                      <strong>{tipo}:</strong> {count}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay datos disponibles</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAprender = () => (
    <div>
      <h2>📚 Aprende sobre Seguros</h2>
      <div style={{ marginTop: "20px" }}>
        <div style={{
          background: "#e3f2fd",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          <h3>¿Qué es un seguro?</h3>
          <p>
            Un seguro es un contrato mediante el cual una compañía de seguros se compromete 
            a indemnizar o reparar los daños que pueda sufrir el asegurado, a cambio del pago 
            de una prima.
          </p>
        </div>

        <div style={{
          background: "#e8f5e9",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          <h3>Tipos de Seguros</h3>
          <ul>
            <li><strong>Seguro de Vehículos:</strong> Protege tu automóvil contra accidentes, robos y daños.</li>
            <li><strong>Seguro de Productos:</strong> Protege tus bienes y mercancías.</li>
            <li><strong>Seguro de Responsabilidad Civil:</strong> Te protege de reclamaciones de terceros.</li>
          </ul>
        </div>

        <div style={{
          background: "#fff3e0",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          <h3>¿Qué hacer en caso de siniestro?</h3>
          <ol>
            <li>Mantén la calma y asegúrate de que todos estén a salvo.</li>
            <li>Contacta inmediatamente a tu compañía de seguros.</li>
            <li>Documenta el incidente con fotos y videos si es posible.</li>
            <li>No admitas responsabilidad sin consultar primero.</li>
            <li>Conserva todos los documentos relacionados.</li>
          </ol>
        </div>

        <div style={{
          background: "#fce4ec",
          padding: "20px",
          borderRadius: "8px"
        }}>
          <h3>Consejos para Renovar tu Póliza</h3>
          <ul>
            <li>Revisa tu póliza al menos un mes antes de que venza.</li>
            <li>Compara ofertas de diferentes compañías.</li>
            <li>Actualiza la información de tu vehículo o bienes.</li>
            <li>Considera aumentar tu cobertura si tus necesidades han cambiado.</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderContacto = () => (
    <div>
      <h2>💬 Contacto y Soporte</h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        marginTop: "20px"
      }}>
        <div>
          <h3>Formulario de Contacto</h3>
          <form onSubmit={handleContactSubmit} style={{ display: "grid", gap: "10px" }}>
            <input
              type="text"
              placeholder="Tu nombre"
              value={contactForm.nombre || user?.user_name || ""}
              onChange={(e) => setContactForm({...contactForm, nombre: e.target.value})}
              required
              style={{ padding: "10px" }}
              disabled={!!user?.user_name}
            />
            <input
              type="email"
              placeholder="Tu email"
              value={contactForm.email || user?.email || ""}
              onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
              required
              style={{ padding: "10px" }}
              disabled={!!user?.email}
            />
            <input
              type="text"
              placeholder="Asunto"
              value={contactForm.asunto}
              onChange={(e) => setContactForm({...contactForm, asunto: e.target.value})}
              required
              style={{ padding: "10px" }}
            />
            <textarea
              placeholder="Tu mensaje"
              value={contactForm.mensaje}
              onChange={(e) => setContactForm({...contactForm, mensaje: e.target.value})}
              required
              rows={5}
              style={{ padding: "10px" }}
            />
            <button type="submit" style={{ padding: "10px", background: "#0984e3", color: "white", border: "none", borderRadius: "4px" }}>
              Enviar Mensaje
            </button>
          </form>
        </div>

        <div>
          <h3>Preguntas Frecuentes (FAQ)</h3>
          <div style={{ marginTop: "15px" }}>
            <div style={{ marginBottom: "15px" }}>
              <strong>¿Cómo renuevo mi póliza?</strong>
              <p style={{ margin: "5px 0", color: "#666" }}>
                Puedes renovar tu póliza contactándonos por WhatsApp, Facebook o a través 
                del formulario de contacto. Te enviaremos un recordatorio un mes antes del vencimiento.
              </p>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <strong>¿Qué hago si tengo un siniestro?</strong>
              <p style={{ margin: "5px 0", color: "#666" }}>
                Contacta inmediatamente a tu compañía de seguros usando el teléfono de asistencia 
                que aparece en tu póliza. También puedes contactarnos para ayuda.
              </p>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <strong>¿Puedo modificar mi póliza?</strong>
              <p style={{ margin: "5px 0", color: "#666" }}>
                Sí, puedes solicitar modificaciones contactándonos. Algunos cambios pueden requerir 
                una actualización de la prima.
              </p>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <strong>¿Cómo actualizo mis datos personales?</strong>
              <p style={{ margin: "5px 0", color: "#666" }}>
                Puedes actualizar tus datos desde la sección "Mis Datos" en tu panel de usuario.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPromociones = () => (
    <div>
      <h2>🎁 Promociones y Ofertas</h2>
      <div style={{ marginTop: "20px" }}>
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "30px",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          <h3 style={{ marginTop: 0 }}>🎉 Renovación Anticipada</h3>
          <p>
            Renueva tu póliza 30 días antes de su vencimiento y obtén un <strong>10% de descuento</strong> 
            en tu prima. ¡No pierdas esta oportunidad!
          </p>
          <button 
            onClick={() => handleViewChange("polizas")}
            style={{
              marginTop: "15px",
              padding: "10px 20px",
              background: "white",
              color: "#667eea",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Ver mis pólizas
          </button>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          color: "white",
          padding: "30px",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          <h3 style={{ marginTop: 0 }}>🚗 Seguro Adicional</h3>
          <p>
            Contrata un segundo seguro y obtén un <strong>15% de descuento</strong> en ambas pólizas. 
            Protege más, paga menos.
          </p>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          color: "white",
          padding: "30px",
          borderRadius: "8px"
        }}>
          <h3 style={{ marginTop: 0 }}>👥 Referidos</h3>
          <p>
            Refiere a un amigo y ambos obtendrán beneficios especiales. Contacta con nosotros 
            para más información.
          </p>
        </div>
      </div>
    </div>
  );

  const renderDatos = () => (
    <div>
      <button
        onClick={() => setCurrentView("dashboard")}
        style={{
          marginBottom: "20px",
          padding: "10px 20px",
          background: "#3498db",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        ← Volver al Dashboard
      </button>
            <FlipFormCard
              frontImage="/img/pizarra.gif"
              title="Mis Datos / Editar"
        onClose={() => setCurrentView("dashboard")}
            >
              <form onSubmit={handleUpdate} style={{ display: "grid", gap: 8 }}>
                <h2>Editar Perfil</h2>

                <label>Nombre</label>
                <input
                  name="user_name"
                  value={form.user_name || ""}
                  onChange={handleChange}
                  required
                />

                <label>Documento</label>
                <input
                  name="documento"
                  value={form.documento || ""}
                  onChange={handleChange}
                />

                <label>Correo</label>
                <input
                  name="email"
                  value={form.email || ""}
                  onChange={handleChange}
                  type="email"
                />

                <label>Dirección</label>
                <input
                  name="direccion"
                  value={form.direccion || ""}
                  onChange={handleChange}
                />

                <label>Ciudad</label>
                <input
                  name="ciudad"
                  value={form.ciudad || ""}
                  onChange={handleChange}
                />

                <label>Teléfono</label>
                <input
                  name="telefono"
                  value={form.telefono || ""}
                  onChange={handleChange}
                />

                <label>Actividad Empresa</label>
                <input
                  name="actividad_empresa"
                  value={form.actividad_empresa || ""}
                  onChange={handleChange}
                />

                <label>Representante Legal</label>
                <input
                  name="representante_legal"
                  value={form.representante_legal || ""}
                  onChange={handleChange}
                />

                <label>Fecha Nacimiento</label>
                <input
                  name="fecha_nacimiento"
                  type="date"
                  value={
                    form.fecha_nacimiento
                      ? String(form.fecha_nacimiento).substring(0, 10)
                      : ""
                  }
                  onChange={handleChange}
                />

                <button type="submit">Guardar cambios</button>
              </form>
            </FlipFormCard>
    </div>
  );

  return (
    <div style={{ 
      display: "flex", 
      minHeight: "100vh",
      background: "#f5f5f5"
    }}>
      {/* Sidebar */}
      <aside style={{
        width: "250px",
        background: "#2c3e50",
        color: "white",
        padding: "20px",
        minHeight: "100vh"
      }}>
        <h2 style={{ marginTop: 0, marginBottom: "30px" }}>Panel Usuario</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={() => handleViewChange("dashboard")}
            style={{
              padding: "12px",
              background: currentView === "dashboard" ? "#3498db" : "transparent",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "16px"
            }}
          >
            🏠 Inicio/Dashboard
          </button>
          <button
            onClick={() => handleViewChange("datos")}
            style={{
              padding: "12px",
              background: currentView === "datos" ? "#3498db" : "transparent",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "16px"
            }}
          >
            📄 Mis Datos
          </button>
          <button
            onClick={() => handleViewChange("polizas")}
            style={{
              padding: "12px",
              background: currentView === "polizas" ? "#3498db" : "transparent",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "16px"
            }}
          >
            📑 Mis Pólizas
          </button>
          <button
            onClick={() => handleViewChange("notificaciones")}
            style={{
              padding: "12px",
              background: currentView === "notificaciones" ? "#3498db" : "transparent",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "16px"
            }}
          >
            🔔 Notificaciones
          </button>
          <button
            onClick={() => handleViewChange("estadisticas")}
            style={{
              padding: "12px",
              background: currentView === "estadisticas" ? "#3498db" : "transparent",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "16px"
            }}
          >
            📊 Estadísticas
          </button>
          <button
            onClick={() => handleViewChange("aprender")}
            style={{
              padding: "12px",
              background: currentView === "aprender" ? "#3498db" : "transparent",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "16px"
            }}
          >
            📚 Aprende sobre Seguros
          </button>
          <button
            onClick={() => handleViewChange("contacto")}
            style={{
              padding: "12px",
              background: currentView === "contacto" ? "#3498db" : "transparent",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "16px"
            }}
          >
            💬 Contacto y Soporte
          </button>
          <button
            onClick={() => handleViewChange("promociones")}
            style={{
              padding: "12px",
              background: currentView === "promociones" ? "#3498db" : "transparent",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "16px"
            }}
          >
            🎁 Promociones
          </button>
          <button
            onClick={() => navigate("/forgot-password")}
            style={{
              padding: "12px",
              background: "transparent",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "16px"
            }}
          >
            🔐 Cambiar Contraseña
          </button>
          <button
            onClick={() => logout(navigate)}
            style={{
              padding: "12px",
              background: "transparent",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "16px",
              marginTop: "20px",
              borderTop: "1px solid #34495e",
              paddingTop: "20px"
            }}
          >
            🚪 Salir
                        </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: "30px",
        background: "white",
        margin: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <header style={{ marginBottom: "30px" }}>
          <h1 style={{ margin: 0, color: "whitesmoke", font:"extrabold" }}>
            {user ? `Bienvenid@, ${user.user_name}` : "Bienvenido"}
          </h1>
          {companyData && (
            <div style={{
              marginTop: "10px",
              padding: "15px",
              background: "linear-gradient(135deg, #631025, #4c55d3)",
              color: "white",
              borderRadius: "8px"
            }}>
              <h3 style={{ margin: 0, fontSize: "20px" }}>{companyData.nombre}</h3>
              {companyData.nit && <p style={{ margin: "5px 0 0", fontSize: "14px", opacity: 0.9 }}>NIT: {companyData.nit}</p>}
            </div>
          )}
        </header>

        {loading && <p>Cargando...</p>}

        {!loading && (
          <>
            {currentView === "dashboard" && renderDashboard()}
            {currentView === "datos" && renderDatos()}
            {currentView === "polizas" && renderPolizas()}
            {currentView === "notificaciones" && renderNotificaciones()}
            {currentView === "estadisticas" && renderEstadisticas()}
            {currentView === "aprender" && renderAprender()}
            {currentView === "contacto" && renderContacto()}
            {currentView === "promociones" && renderPromociones()}
          </>
        )}
      </main>
    </div>
  );
}
