// src/pages/UpdatePolicy.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";

export default function UpdatePolicy(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [productType, setProductType] = useState<"productos" | "autos">("productos");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await API.get(`/policies/${id}`);
        const p = res.data;
        setForm({
          ...p,
          inicio_vigencia: p.inicio_vigencia ? p.inicio_vigencia.split("T")[0] : "",
          fin_vigencia: p.fin_vigencia ? p.fin_vigencia.split("T")[0] : "",
          user_id: p.user?.id ?? p.user_id,
        });
        // detect if vehicle fields used
        if (p.placa || p.numero_chasis) setProductType("autos");
      } catch (err) {
        console.error(err);
        alert("No se encontró la póliza");
        navigate("/dashboard-admin");
      }
    })();
  }, [id, navigate]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((s: any) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        user_id: Number(form.user_id),
      };

      Object.keys(payload).forEach((k) => {
        if (payload[k] === "" || payload[k] === undefined) {
          delete payload[k];
        }
      });

      delete payload.user;
      delete payload.id_policy;
      delete payload.notificada;


      await API.patch(`/policies/${id}`, payload);

      alert("Póliza actualizada");
      navigate("/dashboard-admin");
    } catch (err: any) {
      console.error(err);
      alert("Error al actualizar");
    }
  };

  if (!form) return <div>Cargando...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Editar Póliza</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 800 }}>
        <label>Tomador (user_id)</label>
        <input name="user_id" value={form.user_id} onChange={handleChange} />

        <label>No. Póliza</label>
        <input name="policy_number" value={form.policy_number} onChange={handleChange} />

        <label>Tipo de póliza</label>
        <input name="tipo_poliza" value={form.tipo_poliza} onChange={handleChange} />

        <label>Inicio vigencia</label>
        <input name="inicio_vigencia" type="date" value={form.inicio_vigencia} onChange={handleChange} />

        <label>Fin vigencia</label>
        <input name="fin_vigencia" type="date" value={form.fin_vigencia} onChange={handleChange} />

        <label>Tipo cliente</label>
        <select value={productType} onChange={(e) => setProductType(e.target.value as any)}>
          <option value="productos">CLIENTE PRODUCTOS</option>
          <option value="autos">CLIENTE AUTOS</option>
        </select>

        <label>Tipo riesgo</label>
        <input name="tipo_riesgo" value={form.tipo_riesgo} onChange={handleChange} />

        <label>Compañía seguros</label>
        <input name="compania_seguros" value={form.compania_seguros} onChange={handleChange} />

        <label>Teléfono asistencia</label>
        <input name="telefono_asistencia" value={form.telefono_asistencia} onChange={handleChange} />

        <label>Valor asegurado</label>
        <input name="valor_asegurado" type="number" value={form.valor_asegurado ?? ""} onChange={handleChange} />

        {productType === "autos" && (
          <>
            <h4>Campos Vehículos</h4>
            <label>Placa</label>
            <input name="placa" value={form.placa ?? ""} onChange={handleChange} />
            <label>Modelo</label>
            <input name="modelo" value={form.modelo ?? ""} onChange={handleChange} />
            <label>No. Motor</label>
            <input name="numero_motor" value={form.numero_motor ?? ""} onChange={handleChange} />
            <label>No. Chasis</label>
            <input name="numero_chasis" value={form.numero_chasis ?? ""} onChange={handleChange} />
            {/* otros campos... */}
          </>
        )}

        <button type="submit">Guardar</button>
      </form>
    </div>
  );
}
