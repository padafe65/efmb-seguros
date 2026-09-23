// src/pages/CreatePolicy.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axiosConfig";

// Función para generar PDF (sin dependencia externa)
const generatePDF = (policyData: any, userData: any, companyData: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const isExpired = policyData.fin_vigencia 
    ? new Date(policyData.fin_vigencia) < new Date()
    : false;

  // Usar datos de la empresa o valores por defecto
  const companyName = companyData?.nombre || 'SEGUROS MAB';
  const companyNit = companyData?.nit || '';
  const companyAddress = companyData?.direccion || '';
  const companyPhone = companyData?.telefono || '';
  const companyEmail = companyData?.email || '';
  const primaryColor = companyData?.color_primario || '#631025';
  const secondaryColor = companyData?.color_secundario || '#4c55d3';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Póliza ${policyData.policy_number}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
          background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
          color: white;
          padding: 30px 20px;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          color: white;
        }
        .header h2 {
          margin: 10px 0;
          color: white;
        }
        .status {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 5px;
          font-weight: bold;
          margin: 10px 0;
        }
        .status.active {
          background: #4caf50;
          color: white;
        }
        .status.expired {
          background: #f44336;
          color: white;
        }
        .section {
          margin: 20px 0;
          padding: 15px;
          background: #f9f9f9;
          border-left: 4px solid ${primaryColor};
        }
        .section h3 {
          margin-top: 0;
          color: #2c3e50;
        }
        .row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #ddd;
        }
        .label {
          font-weight: bold;
          color: #555;
        }
        .value {
          color: #333;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 2px solid #333;
          padding-top: 20px;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${companyName}</h1>
        <h2>Certificado de Póliza de Seguro</h2>
        ${companyNit ? `<p style="margin: 5px 0; font-size: 14px;">NIT: ${companyNit}</p>` : ''}
        <div class="status ${isExpired ? 'expired' : 'active'}">
          ${isExpired ? 'PÓLIZA VENCIDA' : 'PÓLIZA ACTIVA'}
        </div>
      </div>

      <div class="section">
        <h3>Datos del Tomador</h3>
        <div class="row">
          <span class="label">Nombre:</span>
          <span class="value">${userData?.user_name || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Documento:</span>
          <span class="value">${userData?.documento || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Email:</span>
          <span class="value">${userData?.email || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Teléfono:</span>
          <span class="value">${userData?.telefono || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Dirección:</span>
          <span class="value">${userData?.direccion || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Ciudad:</span>
          <span class="value">${userData?.ciudad || 'N/A'}</span>
        </div>
      </div>

      <div class="section">
        <h3>Datos de la Póliza</h3>
        <div class="row">
          <span class="label">Número de Póliza:</span>
          <span class="value"><strong>${policyData.policy_number || 'N/A'}</strong></span>
        </div>
        <div class="row">
          <span class="label">Tipo de Póliza:</span>
          <span class="value">${policyData.tipo_poliza || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Tipo de Riesgo:</span>
          <span class="value">${policyData.tipo_riesgo || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Compañía de Seguros:</span>
          <span class="value">${policyData.compania_seguros || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Inicio de Vigencia:</span>
          <span class="value">${policyData.inicio_vigencia ? new Date(policyData.inicio_vigencia).toLocaleDateString('es-ES') : 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Fin de Vigencia:</span>
          <span class="value"><strong>${policyData.fin_vigencia ? new Date(policyData.fin_vigencia).toLocaleDateString('es-ES') : 'N/A'}</strong></span>
        </div>
        <div class="row">
          <span class="label">Valor Asegurado:</span>
          <span class="value"><strong>$${policyData.valor_asegurado ? Number(policyData.valor_asegurado).toLocaleString() : 'N/A'}</strong></span>
        </div>
        <div class="row">
          <span class="label">Teléfono de Asistencia:</span>
          <span class="value">${policyData.telefono_asistencia || 'N/A'}</span>
        </div>
      </div>

      ${policyData.placa || policyData.cod_fasecolda ? `
      <div class="section">
        <h3>Datos del Vehículo</h3>
        ${policyData.placa ? `<div class="row"><span class="label">Placa:</span><span class="value">${policyData.placa}</span></div>` : ''}
        ${policyData.cod_fasecolda ? `<div class="row"><span class="label">Código Fasecolda:</span><span class="value">${policyData.cod_fasecolda}</span></div>` : ''}
        ${policyData.modelo ? `<div class="row"><span class="label">Modelo:</span><span class="value">${policyData.modelo}</span></div>` : ''}
        ${policyData.tipo_vehiculo ? `<div class="row"><span class="label">Tipo de Vehículo:</span><span class="value">${policyData.tipo_vehiculo}</span></div>` : ''}
        ${policyData.numero_motor ? `<div class="row"><span class="label">Número de Motor:</span><span class="value">${policyData.numero_motor}</span></div>` : ''}
        ${policyData.numero_chasis ? `<div class="row"><span class="label">Número de Chasis:</span><span class="value">${policyData.numero_chasis}</span></div>` : ''}
        ${policyData.valor_comercial ? `<div class="row"><span class="label">Valor Comercial:</span><span class="value">$${Number(policyData.valor_comercial).toLocaleString()}</span></div>` : ''}
      </div>
      ` : ''}

      ${policyData.beneficiario ? `
      <div class="section">
        <h3>Beneficiario</h3>
        <div class="row">
          <span class="label">Beneficiario:</span>
          <span class="value">${policyData.beneficiario}</span>
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <p><strong>SEGUROS MAB</strong></p>
        <p>Este documento es una copia del certificado de póliza de seguro.</p>
        <p>Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}</p>
        <p>Para consultas, contacte a su asesor de seguros.</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Esperar a que cargue y luego imprimir
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

interface CreatePolicyProps {
  mode?: "view" | "edit" | "create";
}

export default function CreatePolicy(props: CreatePolicyProps): JSX.Element {
  const navigate = useNavigate();
  const { id, id_policy } = useParams();
  // Usar id o id_policy según lo que venga de la ruta
  const policyId = id_policy || id;

  const { mode = "create" } = props;
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";


  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<any>({
    policy_number: "",
    tipo_poliza: "",
    inicio_vigencia: "",
    fin_vigencia: "",
    tipo_riesgo: "",
    compania_seguros: "",
    telefono_asistencia: "",
    valor_asegurado: "",
    user_id: "",

    cod_fasecolda: "",
    placa: "",
    tonelaje_cilindraje_pasajeros: "",
    departamento_municipio: "",
    valor_comercial: "",
    valor_accesorios: "",
    valor_total_comercial: "",
    modelo: "",
    servicio: "",
    tipo_vehiculo: "",
    numero_motor: "",
    numero_chasis: "",
    beneficiario: "",
  });

  const [productType, setProductType] =
    useState<"productos" | "autos">("productos");
  const [userData, setUserData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [isPolicyExpired, setIsPolicyExpired] = useState(false);

  // -------------------------------------------------------
  // CARGAR PÓLIZA
  // -------------------------------------------------------
  useEffect(() => {
    if (mode === "create") {
      setLoading(false);
      return;
    }

    const fetchPolicy = async () => {
      try {
        if (!policyId) {
          alert("ID de póliza no válido");
          navigate(-1);
          return;
        }
        
        // Detectar si el usuario es "user" para usar el endpoint correcto
        const rol = localStorage.getItem("rol");
        const endpoint = rol === "user" 
          ? `/policies/user-policy/${policyId}`
          : `/policies/${policyId}`;
        
        const res = await API.get(endpoint);
        const data = res.data;

        const isAuto = !!data.placa || !!data.cod_fasecolda;
        setProductType(isAuto ? "autos" : "productos");

        setForm({
          ...data,

          // ⚠ Tomador asegurado
          user_id: data.user_id ?? data.user?.id ?? "",

          inicio_vigencia: data.inicio_vigencia?.substring(0, 10),
          fin_vigencia: data.fin_vigencia?.substring(0, 10),
        });

        // Guardar datos del usuario para el PDF
        setUserData(data.user || {});

        // Cargar datos de la empresa
        if (data.company?.id) {
          try {
            const companyRes = await API.get(`/companies/${data.company.id}`);
            setCompanyData(companyRes.data);
          } catch (error) {
            console.error('Error cargando datos de empresa', error);
            // Si falla, usar datos básicos de la relación
            setCompanyData(data.company || {});
          }
        } else if (data.company_id) {
          try {
            const companyRes = await API.get(`/companies/${data.company_id}`);
            setCompanyData(companyRes.data);
          } catch (error) {
            console.error('Error cargando datos de empresa', error);
          }
        }

        // Verificar si la póliza está vencida
        if (data.fin_vigencia) {
          const finVigencia = new Date(data.fin_vigencia);
          const hoy = new Date();
          setIsPolicyExpired(finVigencia < hoy);
        }
      } catch (error) {
        console.error(error);
        alert("No se pudo cargar la póliza.");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [policyId, mode, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((s: any) => ({ ...s, [name]: value }));
  };

  useEffect(() => {
  // Solo aplica a AUTOS
  if (productType !== "autos") return;

  const vc = Number(form.valor_comercial) || 0;
  const va = Number(form.valor_accesorios) || 0;

  const total = vc + va;

  setForm((s: any) => ({
    ...s,
    valor_total_comercial: total > 0 ? total : "",
  }));
}, [form.valor_comercial, form.valor_accesorios, productType]);

useEffect(() => {
  if (!form.inicio_vigencia) return;

  // inicio_vigencia viene como YYYY-MM-DD
  const inicio = new Date(form.inicio_vigencia);

  if (isNaN(inicio.getTime())) return;

  const fin = new Date(inicio);
  fin.setFullYear(fin.getFullYear() + 1);

  // Formatear a YYYY-MM-DD (input date)
  const yyyy = fin.getFullYear();
  const mm = String(fin.getMonth() + 1).padStart(2, "0");
  const dd = String(fin.getDate()).padStart(2, "0");

  const finFormatted = `${yyyy}-${mm}-${dd}`;

  setForm((s: any) => ({
    ...s,
    fin_vigencia: finFormatted,
  }));
}, [form.inicio_vigencia]);



  // -------------------------------------------------------
  // SUBMIT
  // -------------------------------------------------------
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const payload: any = {
    ...form,
    user_id: Number(form.user_id),

    valor_asegurado: form.valor_asegurado
      ? Number(form.valor_asegurado)
      : undefined,

    valor_comercial: form.valor_comercial
      ? Number(form.valor_comercial)
      : undefined,

    valor_accesorios: form.valor_accesorios
      ? Number(form.valor_accesorios)
      : undefined,

    valor_total_comercial: form.valor_total_comercial
      ? Number(form.valor_total_comercial)
      : undefined,
  };

  // 🔥 ELIMINAR VACÍOS (string, null, undefined)
  Object.keys(payload).forEach((key) => {
    if (
      payload[key] === "" ||
      payload[key] === null ||
      payload[key] === undefined
    ) {
      delete payload[key];
    }
  });

  // ❌ campos que ROMPEN el DTO
  delete payload.user;
  delete payload.company;
  delete payload.id_policy;
  delete payload.fin_vigencia; // 🔥 SIEMPRE
  delete payload.notificada;

  if (productType === "productos") {
    delete payload.cod_fasecolda;
    delete payload.placa;
    delete payload.tonelaje_cilindraje_pasajeros;
    delete payload.departamento_municipio;
    delete payload.valor_comercial;
    delete payload.valor_accesorios;
    delete payload.valor_total_comercial;
    delete payload.modelo;
    delete payload.servicio;
    delete payload.tipo_vehiculo;
    delete payload.numero_motor;
    delete payload.numero_chasis;
    delete payload.beneficiario;
  }

  console.log("🟦 PAYLOAD FINAL PATCH:", payload);

  const targetPolicyId = id_policy || id;

  try {
    if (isEdit) {
      await API.patch(`/policies/${targetPolicyId}`, payload);
      alert("Póliza actualizada!");
    } else {
      await API.post("/policies/create", payload);
      alert("Póliza creada!");
    }

    const currentRol = localStorage.getItem("rol") || "";
    if (currentRol === "super_user") {
      navigate("/dashboard-super");
    } else if (currentRol === "admin") {
      navigate("/dashboard-admin");
    } else {
      navigate("/dashboard-user");
    }
  } catch (err: any) {
    console.error(err);
    alert(err?.response?.data?.message || "Error al guardar la póliza");
  }
};


  if (loading) return <p>Cargando...</p>;

  // Verificar permisos de edición
  const rol = localStorage.getItem("rol");
  const canEdit = !isView && (
    rol === "admin" || 
    rol === "super_user" || 
    (rol === "user" && !isPolicyExpired)
  );
  const isAdminOrSuper = rol === "admin" || rol === "super_user";

  // Si es usuario normal y la póliza está vencida, forzar modo vista
  const effectiveIsView = isView || (rol === "user" && isPolicyExpired && !isAdminOrSuper);
  const effectiveCanEdit = canEdit && !effectiveIsView;

  const handlePrintPDF = () => {
    generatePDF(form, userData, companyData);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>
          {effectiveIsView ? "Ver Póliza" : isEdit ? "Editar Póliza" : "Crear Póliza"}
        </h2>
        {!isCreate && (
          <div style={{ display: "flex", gap: "10px" }}>
            {isPolicyExpired && (
              <span style={{
                background: "#f44336",
                color: "white",
                padding: "5px 15px",
                borderRadius: "5px",
                fontSize: "14px",
                fontWeight: "bold"
              }}>
                PÓLIZA VENCIDA
              </span>
            )}
            <button
              type="button"
              onClick={handlePrintPDF}
              style={{
                padding: "10px 20px",
                background: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              🖨️ Imprimir PDF
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: "10px 20px",
                background: "#757575",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              ← Volver
            </button>
          </div>
        )}
      </div>

      {isPolicyExpired && rol === "user" && !isAdminOrSuper && (
        <div style={{
          background: "#fff3cd",
          border: "1px solid #ffc107",
          padding: "15px",
          borderRadius: "5px",
          marginBottom: "20px"
        }}>
          <strong>⚠️ Póliza Vencida:</strong> Esta póliza ha vencido. Solo puedes verla, no editarla.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 800 }}>

        <label>Tomador (user_id)</label>
        <input
          name="user_id"
          disabled={effectiveIsView}
          value={form.user_id}
          onChange={handleChange}
        />

        <label>No. Póliza</label>
        <input
          name="policy_number"
          disabled={effectiveIsView}
          value={form.policy_number}
          onChange={handleChange}
        />

<label>Tipo de póliza</label>
        <input
          name="tipo_poliza"
          disabled={effectiveIsView}
          value={form.tipo_poliza}
          onChange={handleChange}
        />

<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div>
        <label style={{ display: "block", marginBottom: 4 }}>Inicio vigencia</label>
        <input
          type="date"
          name="inicio_vigencia"
          disabled={effectiveIsView}
          value={form.inicio_vigencia}
          onChange={handleChange}
          style={{ width: "100%", padding: 6 }}
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 4 }}>Fin vigencia (1 año)</label>
        <input
          type="date"
          name="fin_vigencia"
          disabled
          value={form.fin_vigencia}
          style={{ width: "100%", padding: 6, backgroundColor: "#f0f0f0" }}
        />
      </div>
    </div>




        <label>Tipo de cliente</label>
        <select
          disabled={effectiveIsView}
          value={productType}
          onChange={(e) => setProductType(e.target.value as any)}
        >
          <option value="productos">CLIENTE PRODUCTOS</option>
          <option value="autos">CLIENTE AUTOS</option>
        </select>

        <label>Tipo riesgo</label>
        <input
          name="tipo_riesgo"
          disabled={effectiveIsView}
          value={form.tipo_riesgo}
          onChange={handleChange}
        />

        <label>Compañía seguros</label>
        <input
          name="compania_seguros"
          disabled={effectiveIsView}
          value={form.compania_seguros}
          onChange={handleChange}
        />

        <label>Teléfono asistencia</label>
        <input
          name="telefono_asistencia"
          disabled={effectiveIsView}
          value={form.telefono_asistencia}
          onChange={handleChange}
        />

        <label>Valor asegurado</label>
        <input
          type="number"
          name="valor_asegurado"
          disabled={effectiveIsView}
          value={form.valor_asegurado}
          onChange={handleChange}
        />

        {productType === "autos" && (
          <>
            <h4>Campos Vehículos</h4>

            <label>Cod Fasecolda</label>
            <input
              name="cod_fasecolda"
              disabled={effectiveIsView}
              value={form.cod_fasecolda}
              onChange={handleChange}
            />

            <label>Placa</label>
            <input
              name="placa"
              disabled={effectiveIsView}
              value={form.placa}
              onChange={handleChange}
            />

            <label>Tonelaje/Cilindraje/Pasajeros</label>
            <input
              name="tonelaje_cilindraje_pasajeros"
              disabled={effectiveIsView}
              value={form.tonelaje_cilindraje_pasajeros}
              onChange={handleChange}
            />

            <label>Departamento/Municipio</label>
            <input
              name="departamento_municipio"
              disabled={effectiveIsView}
              value={form.departamento_municipio}
              onChange={handleChange}
            />

            <label>Valor comercial</label>
            <input
              type="number"
              name="valor_comercial"
              disabled={effectiveIsView}
              value={form.valor_comercial}
              onChange={handleChange}
            />

            <label>Valor accesorios</label>
            <input
              type="number"
              name="valor_accesorios"
              disabled={effectiveIsView}
              value={form.valor_accesorios}
              onChange={handleChange}
            />

            <label>Valor total comercial</label>
            <input
              type="number"
              name="valor_total_comercial"
              value={form.valor_total_comercial}
              disabled
            />


            <label>Modelo</label>
            <input
              name="modelo"
              disabled={effectiveIsView}
              value={form.modelo}
              onChange={handleChange}
            />

            <label>Servicio</label>
            <input
              name="servicio"
              disabled={effectiveIsView}
              value={form.servicio}
              onChange={handleChange}
            />

            <label>Tipo vehículo</label>
            <input
              name="tipo_vehiculo"
              disabled={effectiveIsView}
              value={form.tipo_vehiculo}
              onChange={handleChange}
            />

            <label>No. Motor</label>
            <input
              name="numero_motor"
              disabled={effectiveIsView}
              value={form.numero_motor}
              onChange={handleChange}
            />

            <label>No. Chasis</label>
            <input
              name="numero_chasis"
              disabled={effectiveIsView}
              value={form.numero_chasis}
              onChange={handleChange}
            />

            <label>Beneficiario</label>
            <input
              name="beneficiario"
              disabled={effectiveIsView}
              value={form.beneficiario}
              onChange={handleChange}
            />
          </>
        )}

        {effectiveCanEdit && <button type="submit">{isEdit ? "Actualizar" : "Crear"}</button>}
      </form>
    </div>
  );
}
