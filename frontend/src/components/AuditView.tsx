import React, { useEffect, useState } from "react";
import API from "../api/axiosConfig";

interface AuditLog {
  id: number;
  userId?: number;
  userEmail?: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: string;
  entityId?: string;
  previousData?: any;
  newData?: any;
  ipAddress?: string;
  createdAt: string;
}

export default function AuditView(): JSX.Element {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [onlyChanges, setOnlyChanges] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/audit?limit=100&_t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      setLogs(data || []);
    } catch (error) {
      console.error("Error al obtener registros de auditoría:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return (
          <span
            style={{
              background: "#2ecc71",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            CREAR
          </span>
        );
      case "UPDATE":
        return (
          <span
            style={{
              background: "#f39c12",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            ACTUALIZAR
          </span>
        );
      case "DELETE":
        return (
          <span
            style={{
              background: "#e74c3c",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            ELIMINAR
          </span>
        );
      default:
        return <span>{action}</span>;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchAction = filterAction ? log.action === filterAction : true;
    const matchEntity = filterEntity
      ? log.entity.toLowerCase().includes(filterEntity.toLowerCase())
      : true;
    return matchAction && matchEntity;
  });

  // Función para parsear de manera segura datos serializados
  const parseJsonSafe = (data: any) => {
    if (!data) return {};
    if (typeof data === "object") return data;
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  };

  // Función para normalizar y comparar valores de forma homogénea
  const normalizeValue = (val: any) => {
    if (val === null || val === undefined || val === "") return "";
    // Si es formato fecha ISO o string de fecha, extraer solo YYYY-MM-DD
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      return val.substring(0, 10);
    }
    // Comparación homogénea de números y strings numéricos
    if (
      typeof val === "number" ||
      (!isNaN(Number(val)) && typeof val === "string" && val.trim() !== "")
    ) {
      return String(Number(val));
    }
    if (typeof val === "boolean") return val ? "true" : "false";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val).trim();
  };

  // Renderizador de diferencias detalladas
  const renderDiffTable = (prev: any = {}, curr: any = {}) => {
    // Normalizar si vienen nulos o indefinidos
    const rawPrev =
      prev === "null" || prev === null || prev === undefined ? null : prev;
    const rawCurr =
      curr === "null" || curr === null || curr === undefined ? null : curr;

    const prevObj = parseJsonSafe(rawPrev);
    const currObj = parseJsonSafe(rawCurr);

    const allKeys = Array.from(
      new Set([...Object.keys(prevObj), ...Object.keys(currObj)])
    );

    // Excluir campos técnicos, hashes o contraseñas
    const cleanKeys = allKeys.filter(
      (k) =>
        ![
          "user_password",
          "password",
          "reset_password_token",
          "reset_password_expires",
        ].includes(k)
    );

    // Caso: Registros históricos sin datos guardados
    if (cleanKeys.length === 0) {
      return (
        <div
          style={{
            padding: "24px 20px",
            textAlign: "center",
            color: "#636e72",
            background: "#fdfefe",
            border: "1px dashed #b2bec3",
            borderRadius: "8px",
            marginTop: "12px",
          }}
        >
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>📋</div>
          <strong style={{ color: "#2d3436" }}>
            Sin datos detallados en este registro histórico
          </strong>
          <p style={{ margin: "6px 0 0 0", fontSize: "13px" }}>
            Este registro corresponde a una prueba donde los campos se guardaron
            vacíos en la base de datos (valores nulos).
          </p>
        </div>
      );
    }

    const rows = cleanKeys.map((key) => {
      const valBefore = prevObj[key];
      const valAfter = currObj[key];

      const normBefore = normalizeValue(valBefore);
      const normAfter = normalizeValue(valAfter);

      const isAdded =
        (valBefore === undefined || valBefore === null) &&
        valAfter !== undefined &&
        valAfter !== null;
      const isRemoved =
        valBefore !== undefined &&
        valBefore !== null &&
        (valAfter === undefined || valAfter === null);
      const isModified = !isAdded && !isRemoved && normBefore !== normAfter;
      const isUnchanged = normBefore === normAfter;

      return {
        key,
        valBefore,
        valAfter,
        isAdded,
        isRemoved,
        isModified,
        isUnchanged,
      };
    });

    const displayRows = onlyChanges
      ? rows.filter((r) => !r.isUnchanged)
      : rows;

    if (displayRows.length === 0) {
      return (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: "#666",
            background: "#f8f9fa",
            borderRadius: "6px",
            marginTop: "12px",
          }}
        >
          ℹ️ No se detectaron diferencias con el filtro actual. Desmarca la
          casilla "Solo mostrar campos modificados" para ver la lista completa.
        </div>
      );
    }

    const formatVal = (v: any) => {
      if (v === null || v === undefined)
        return <em style={{ color: "#aaa" }}>ninguno</em>;
      if (typeof v === "boolean")
        return v ? "true (Activo)" : "false (Inactivo)";
      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v))
        return v.substring(0, 10);
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    };

    return (
      <div style={{ overflowX: "auto", marginTop: "10px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#f1f2f6",
                borderBottom: "2px solid #ced6e0",
                textAlign: "left",
              }}
            >
              <th style={{ padding: "10px" }}>Campo</th>
              <th style={{ padding: "10px" }}>Estado Anterior</th>
              <th style={{ padding: "10px" }}>Nuevo Estado</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Cambio</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r) => {
              let rowBg = "transparent";
              let badge = null;

              if (r.isModified) {
                rowBg = "#fff9db"; // Fondo amarillo suave
                badge = (
                  <span
                    style={{
                      background: "#f59f00",
                      color: "white",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    MODIFICADO
                  </span>
                );
              } else if (r.isAdded) {
                rowBg = "#ebfbee"; // Fondo verde suave
                badge = (
                  <span
                    style={{
                      background: "#2ecc71",
                      color: "white",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    AGREGADO
                  </span>
                );
              } else if (r.isRemoved) {
                rowBg = "#ffe3e3"; // Fondo rojo suave
                badge = (
                  <span
                    style={{
                      background: "#e74c3c",
                      color: "white",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    ELIMINADO
                  </span>
                );
              } else {
                badge = (
                  <span
                    style={{
                      background: "#ced6e0",
                      color: "#2f3542",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                    }}
                  >
                    SIN CAMBIO
                  </span>
                );
              }

              return (
                <tr
                  key={r.key}
                  style={{
                    background: rowBg,
                    borderBottom: "1px solid #e9ecef",
                  }}
                >
                  <td
                    style={{
                      padding: "10px",
                      fontWeight: "bold",
                      color: "#2d3436",
                    }}
                  >
                    {r.key}
                  </td>

                  {/* Estado Anterior SIN TACHADO */}
                  <td
                    style={{
                      padding: "10px",
                      color: r.isModified ? "#b33939" : "#555",
                    }}
                  >
                    {formatVal(r.valBefore)}
                  </td>

                  {/* Nuevo Estado destacado en verde si fue modificado */}
                  <td
                    style={{
                      padding: "10px",
                      color: r.isModified ? "#218c74" : "#555",
                      fontWeight: r.isModified ? "bold" : "normal",
                    }}
                  >
                    {formatVal(r.valAfter)}
                  </td>

                  <td style={{ padding: "10px", textAlign: "center" }}>
                    {badge}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ marginTop: "15px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h2 style={{ margin: 0, color: "#2c3e50" }}>
          📋 Registro de Auditoría del Sistema
        </h2>
        <button
          onClick={fetchLogs}
          style={{
            background: "#0984e3",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🔄 Refrescar Registros
        </button>
      </div>

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "15px",
          flexWrap: "wrap",
        }}
      >
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          <option value="">Todas las acciones</option>
          <option value="CREATE">CREAR</option>
          <option value="UPDATE">ACTUALIZAR</option>
          <option value="DELETE">ELIMINAR</option>
        </select>

        <input
          type="text"
          placeholder="Filtrar por módulo (ej. User, Policy)..."
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            minWidth: "220px",
          }}
        />
      </div>

      {loading ? (
        <p>Cargando registros de auditoría...</p>
      ) : (
        <div
          style={{
            overflowX: "auto",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8f9fa",
                  borderBottom: "2px solid #dee2e6",
                }}
              >
                <th style={{ padding: "12px" }}>Fecha / Hora</th>
                <th style={{ padding: "12px" }}>Usuario Responsable</th>
                <th style={{ padding: "12px" }}>Acción</th>
                <th style={{ padding: "12px" }}>Módulo / Entidad</th>
                <th style={{ padding: "12px" }}>ID Afectado</th>
                <th style={{ padding: "12px", textAlign: "center" }}>
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px" }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px" }}>
                    {log.userEmail ||
                      (log.userId ? `ID: ${log.userId}` : "Sistema")}
                  </td>
                  <td style={{ padding: "12px" }}>
                    {getActionBadge(log.action)}
                  </td>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>
                    {log.entity}
                  </td>
                  <td style={{ padding: "12px" }}>{log.entityId || "N/A"}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <button
                      onClick={() => setSelectedLog(log)}
                      style={{
                        background: "#6c5ce7",
                        color: "white",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      🔍 Ver Cambios
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#888",
                    }}
                  >
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de diferencias interactivas */}
      {selectedLog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10005,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "850px",
              maxHeight: "88vh",
              overflowY: "auto",
              padding: "25px",
              position: "relative",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            <button
              onClick={() => setSelectedLog(null)}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕
            </button>
            <h3 style={{ marginTop: 0, color: "#2c3e50" }}>
              Comparativa de Cambios #{selectedLog.id}
            </h3>

            <div
              style={{
                display: "flex",
                gap: "15px",
                flexWrap: "wrap",
                background: "#f8f9fa",
                padding: "10px 14px",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#555",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong>Módulo:</strong> {selectedLog.entity} |{" "}
                <strong>Acción:</strong> {selectedLog.action} |{" "}
                <strong>Realizado por:</strong>{" "}
                <span style={{ color: "#2980b9", fontWeight: "bold" }}>
                  {selectedLog.userEmail ||
                    (selectedLog.userId
                      ? `ID: ${selectedLog.userId}`
                      : "Sistema")}
                </span>{" "}
                | <strong>Fecha:</strong>{" "}
                {new Date(selectedLog.createdAt).toLocaleString()}
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  color: "#2d3436",
                }}
              >
                <input
                  type="checkbox"
                  checked={onlyChanges}
                  onChange={(e) => setOnlyChanges(e.target.checked)}
                />
                Solo mostrar campos modificados
              </label>
            </div>

            {/* Tabla con resaltado de cambios */}
            {renderDiffTable(selectedLog.previousData, selectedLog.newData)}

            <div style={{ textAlign: "right", marginTop: "20px" }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  background: "#718096",
                  color: "white",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}