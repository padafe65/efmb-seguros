// src/pages/CreatePolicy.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axiosConfig";

interface CreatePolicyProps {
  mode?: "view" | "edit" | "create";
}

export default function CreatePolicy(props: CreatePolicyProps): JSX.Element {
  const navigate = useNavigate();
  const { id_policy } = useParams();

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
        const res = await API.get(`/policies/${id_policy}`);
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
      } catch (error) {
        console.error(error);
        alert("No se pudo cargar la póliza.");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [id_policy, mode]);

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

  try {
    if (isEdit) {
      await API.patch(`/policies/${id_policy}`, payload);
      alert("Póliza actualizada!");
    } else {
      await API.post("/policies/create", payload);
      alert("Póliza creada!");
    }

    navigate("/dashboard-admin");
  } catch (err: any) {
    console.error(err);
    alert(err?.response?.data?.message || "Error al guardar la póliza");
  }
};


  if (loading) return <p>Cargando...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>{isEdit ? "Editar Póliza" : isView ? "Ver Póliza" : "Crear Póliza"}</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 800 }}>

        <label>Tomador (user_id)</label>
        <input
          name="user_id"
          disabled={isView}
          value={form.user_id}
          onChange={handleChange}
        />

        <label>No. Póliza</label>
        <input
          name="policy_number"
          disabled={isView}
          value={form.policy_number}
          onChange={handleChange}
        />

        <label>Tipo de póliza</label>
        <input
          name="tipo_poliza"
          disabled={isView}
          value={form.tipo_poliza}
          onChange={handleChange}
        />

        <label>Inicio vigencia</label>
        <input
          type="date"
          name="inicio_vigencia"
          disabled={isView}
          value={form.inicio_vigencia}
          onChange={handleChange}
        />

        <input
          type="date"
          name="fin_vigencia"
          value={form.fin_vigencia}
          disabled
        />


        {!isCreate && (
          <>
            <label>Fin vigencia</label>
            <input
              type="date"
              name="fin_vigencia"
              disabled
              value={form.fin_vigencia}
            />
          </>
        )}


        <label>Tipo de cliente</label>
        <select
          disabled={isView}
          value={productType}
          onChange={(e) => setProductType(e.target.value as any)}
        >
          <option value="productos">CLIENTE PRODUCTOS</option>
          <option value="autos">CLIENTE AUTOS</option>
        </select>

        <label>Tipo riesgo</label>
        <input
          name="tipo_riesgo"
          disabled={isView}
          value={form.tipo_riesgo}
          onChange={handleChange}
        />

        <label>Compañía seguros</label>
        <input
          name="compania_seguros"
          disabled={isView}
          value={form.compania_seguros}
          onChange={handleChange}
        />

        <label>Teléfono asistencia</label>
        <input
          name="telefono_asistencia"
          disabled={isView}
          value={form.telefono_asistencia}
          onChange={handleChange}
        />

        <label>Valor asegurado</label>
        <input
          type="number"
          name="valor_asegurado"
          disabled={isView}
          value={form.valor_asegurado}
          onChange={handleChange}
        />

        {productType === "autos" && (
          <>
            <h4>Campos Vehículos</h4>

            <label>Cod Fasecolda</label>
            <input
              name="cod_fasecolda"
              disabled={isView}
              value={form.cod_fasecolda}
              onChange={handleChange}
            />

            <label>Placa</label>
            <input
              name="placa"
              disabled={isView}
              value={form.placa}
              onChange={handleChange}
            />

            <label>Tonelaje/Cilindraje/Pasajeros</label>
            <input
              name="tonelaje_cilindraje_pasajeros"
              disabled={isView}
              value={form.tonelaje_cilindraje_pasajeros}
              onChange={handleChange}
            />

            <label>Departamento/Municipio</label>
            <input
              name="departamento_municipio"
              disabled={isView}
              value={form.departamento_municipio}
              onChange={handleChange}
            />

            <label>Valor comercial</label>
            <input
              type="number"
              name="valor_comercial"
              disabled={isView}
              value={form.valor_comercial}
              onChange={handleChange}
            />

            <label>Valor accesorios</label>
            <input
              type="number"
              name="valor_accesorios"
              disabled={isView}
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
              disabled={isView}
              value={form.modelo}
              onChange={handleChange}
            />

            <label>Servicio</label>
            <input
              name="servicio"
              disabled={isView}
              value={form.servicio}
              onChange={handleChange}
            />

            <label>Tipo vehículo</label>
            <input
              name="tipo_vehiculo"
              disabled={isView}
              value={form.tipo_vehiculo}
              onChange={handleChange}
            />

            <label>No. Motor</label>
            <input
              name="numero_motor"
              disabled={isView}
              value={form.numero_motor}
              onChange={handleChange}
            />

            <label>No. Chasis</label>
            <input
              name="numero_chasis"
              disabled={isView}
              value={form.numero_chasis}
              onChange={handleChange}
            />

            <label>Beneficiario</label>
            <input
              name="beneficiario"
              disabled={isView}
              value={form.beneficiario}
              onChange={handleChange}
            />
          </>
        )}

        {!isView && <button type="submit">{isEdit ? "Actualizar" : "Crear"}</button>}
      </form>
    </div>
  );
}
