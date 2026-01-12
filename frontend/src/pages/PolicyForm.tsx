// src/pages/PolicyForm.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../api/axiosConfig";

type Mode = "create" | "edit" | "view";

const emptyForm = {
  policy_number: "",
  tipo_poliza: "",
  inicio_vigencia: "",
  fin_vigencia: "",
  tipo_riesgo: "",
  compania_seguros: "",
  telefono_asistencia: "",
  valor_asegurado: "",

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

  user_id: "",
};

export default function PolicyForm({ mode }: { mode: Mode }) {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const isView = mode === "view";

  const [form, setForm] = useState<any>({ ...emptyForm });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const policyId = params.id;

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const userQuery = q.get("user");
    if (userQuery && isCreate) {
      setForm((s: any) => ({ ...s, user_id: userQuery }));
    }
    // eslint-disable-next-line
  }, [location.search]);

  useEffect(() => {
    const load = async () => {
      if ((isEdit || isView) && policyId) {
        try {
          setLoading(true);
          const res = await API.get(`/policies/${policyId}`);
          const data = res.data;
          setForm({
            policy_number: data.policy_number ?? "",
            tipo_poliza: data.tipo_poliza ?? "",
            inicio_vigencia: data.inicio_vigencia ? data.inicio_vigencia.substring(0, 10) : "",
            fin_vigencia: data.fin_vigencia ? data.fin_vigencia.substring(0, 10) : "",
            tipo_riesgo: data.tipo_riesgo ?? "",
            compania_seguros: data.compania_seguros ?? "",
            telefono_asistencia: data.telefono_asistencia ?? "",
            valor_asegurado: data.valor_asegurado ?? "",

            cod_fasecolda: data.cod_fasecolda ?? "",
            placa: data.placa ?? "",
            tonelaje_cilindraje_pasajeros: data.tonelaje_cilindraje_pasajeros ?? "",
            departamento_municipio: data.departamento_municipio ?? "",
            valor_comercial: data.valor_comercial ?? "",
            valor_accesorios: data.valor_accesorios ?? "",
            valor_total_comercial: data.valor_total_comercial ?? "",
            modelo: data.modelo ?? "",
            servicio: data.servicio ?? "",
            tipo_vehiculo: data.tipo_vehiculo ?? "",
            numero_motor: data.numero_motor ?? "",
            numero_chasis: data.numero_chasis ?? "",
            beneficiario: data.beneficiario ?? "",

            user_id: data.user?.id ?? "",
          });
        } catch (err) {
          console.error("Error cargando póliza:", err);
          alert("No se pudo cargar la póliza");
        } finally {
          setLoading(false);
        }
      }
    };
    load();
    // eslint-disable-next-line
  }, [policyId, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((s: any) => ({ ...s, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const isAuto = String(form.tipo_poliza || "").toLowerCase() === "auto";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.policy_number) e.policy_number = "No. de póliza requerido";
    if (!form.tipo_poliza) e.tipo_poliza = "Tipo de póliza requerido";
    if (!form.inicio_vigencia) e.inicio_vigencia = "Fecha inicio requerida";
    if (!isCreate && !form.fin_vigencia) {
      e.fin_vigencia = "Fecha fin requerida";
    }

    if (!form.user_id) e.user_id = "Tomador (user_id) requerido";
    return e;
  };

const preparePayload = () => {
  const payload: any = {
    policy_number: form.policy_number,
    tipo_poliza: form.tipo_poliza,
    inicio_vigencia: form.inicio_vigencia,
    tipo_riesgo: form.tipo_riesgo || null,
    compania_seguros: form.compania_seguros || null,
    telefono_asistencia: form.telefono_asistencia || null,
    valor_asegurado: form.valor_asegurado
      ? Number(form.valor_asegurado)
      : null,
    user_id: Number(form.user_id),
  };

  // ✅ SOLO EN UPDATE
  if (!isCreate && form.fin_vigencia) {
    payload.fin_vigencia = form.fin_vigencia;
  }

  if (isAuto) {
    payload.cod_fasecolda = form.cod_fasecolda || null;
    payload.placa = form.placa || null;
    payload.tonelaje_cilindraje_pasajeros =
      form.tonelaje_cilindraje_pasajeros || null;
    payload.departamento_municipio =
      form.departamento_municipio || null;
    payload.valor_comercial = form.valor_comercial
      ? Number(form.valor_comercial)
      : null;
    payload.valor_accesorios = form.valor_accesorios
      ? Number(form.valor_accesorios)
      : null;
    payload.valor_total_comercial = form.valor_total_comercial
      ? Number(form.valor_total_comercial)
      : null;
    payload.modelo = form.modelo || null;
    payload.servicio = form.servicio || null;
    payload.tipo_vehiculo = form.tipo_vehiculo || null;
    payload.numero_motor = form.numero_motor || null;
    payload.numero_chasis = form.numero_chasis || null;
    payload.beneficiario = form.beneficiario || null;
  }

  return payload;
};

  const handleCreate = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setLoading(true);
      const payload = preparePayload();
      await API.post("/policies/create", payload);
      alert("Póliza creada");
      navigate("/admin");
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Error creando póliza");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    try {
      setLoading(true);
      const payload = preparePayload();
      await API.patch(`/policies/${policyId}`, payload);
      alert("Póliza actualizada");
      navigate("/admin");
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Error actualizando póliza");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 920 }}>
      <h2>{isCreate ? "Crear póliza" : isEdit ? "Editar póliza" : "Ver póliza"}</h2>

      {loading && <p>Cargando...</p>}

      <div style={{ display: "grid", gap: 8 }}>
        <label>Tomador (user_id)</label>
        <input
          name="user_id"
          value={form.user_id}
          onChange={handleChange}
          disabled={isView}
        />
        {errors.user_id && <small style={{ color: "red" }}>{errors.user_id}</small>}

        <label>No. Póliza</label>
        <input name="policy_number" value={form.policy_number} onChange={handleChange} disabled={isView} />
        {errors.policy_number && <small style={{ color: "red" }}>{errors.policy_number}</small>}

        <label>Tipo de póliza</label>
        <select name="tipo_poliza" value={form.tipo_poliza} onChange={handleChange} disabled={isView && !isCreate}>
          <option value="">-- Seleccione --</option>
          <option value="auto">Auto</option>
          <option value="productos">Productos</option>
          <option value="vida">Vida</option>
          <option value="hogar">Hogar</option>
        </select>
        {errors.tipo_poliza && <small style={{ color: "red" }}>{errors.tipo_poliza}</small>}

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label>Inicio vigencia</label>
            <input name="inicio_vigencia" type="date" value={form.inicio_vigencia} onChange={handleChange} disabled={isView} />
            {errors.inicio_vigencia && <small style={{ color: "red" }}>{errors.inicio_vigencia}</small>}
          </div>
          <div style={{ flex: 1 }}>
            <label>Fin vigencia</label>
            <input name="fin_vigencia" type="date" value={form.fin_vigencia} onChange={handleChange} disabled={isView} />
            {errors.fin_vigencia && <small style={{ color: "red" }}>{errors.fin_vigencia}</small>}
          </div>
        </div>

        <label>Tipo de riesgo</label>
        <input name="tipo_riesgo" value={form.tipo_riesgo} onChange={handleChange} disabled={isView} />

        <label>Compañía seguros</label>
        <input name="compania_seguros" value={form.compania_seguros} onChange={handleChange} disabled={isView} />

        <label>Teléfono asistencia</label>
        <input name="telefono_asistencia" value={form.telefono_asistencia} onChange={handleChange} disabled={isView} />

        <label>Valor asegurado</label>
        <input name="valor_asegurado" type="number" value={form.valor_asegurado} onChange={handleChange} disabled={isView} />

        {isAuto && (
          <>
            <h4>Datos Vehículo</h4>

            <label>Cod. Fasecolda</label>
            <input name="cod_fasecolda" value={form.cod_fasecolda} onChange={handleChange} disabled={isView} />

            <label>Placa</label>
            <input name="placa" value={form.placa} onChange={handleChange} disabled={isView} />

            <label>Tonelaje / Cilindraje / Pasajeros</label>
            <input name="tonelaje_cilindraje_pasajeros" value={form.tonelaje_cilindraje_pasajeros} onChange={handleChange} disabled={isView} />

            <label>Departamento / Municipio</label>
            <input name="departamento_municipio" value={form.departamento_municipio} onChange={handleChange} disabled={isView} />

            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label>Valor comercial</label>
                <input name="valor_comercial" type="number" value={form.valor_comercial} onChange={handleChange} disabled={isView} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Valor accesorios</label>
                <input name="valor_accesorios" type="number" value={form.valor_accesorios} onChange={handleChange} disabled={isView} />
              </div>
            </div>

            <label>Valor total comercial</label>
            <input name="valor_total_comercial" type="number" value={form.valor_total_comercial} onChange={handleChange} disabled={isView} />

            <label>Modelo</label>
            <input name="modelo" value={form.modelo} onChange={handleChange} disabled={isView} />

            <label>Servicio</label>
            <input name="servicio" value={form.servicio} onChange={handleChange} disabled={isView} />

            <label>Tipo vehículo</label>
            <input name="tipo_vehiculo" value={form.tipo_vehiculo} onChange={handleChange} disabled={isView} />

            <label>No. Motor</label>
            <input name="numero_motor" value={form.numero_motor} onChange={handleChange} disabled={isView} />

            <label>No. Chasis / Serie</label>
            <input name="numero_chasis" value={form.numero_chasis} onChange={handleChange} disabled={isView} />

            <label>Beneficiario</label>
            <input name="beneficiario" value={form.beneficiario} onChange={handleChange} disabled={isView} />
          </>
        )}

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          {isCreate && <button onClick={handleCreate}>Crear póliza</button>}
          {isEdit && <button onClick={handleUpdate}>Actualizar póliza</button>}
          {isView && <button onClick={() => navigate(`/admin/policies/edit/${policyId}`)}>Editar</button>}
          <button onClick={() => navigate(-1)}>Volver</button>
        </div>
      </div>
    </div>
  );
}
