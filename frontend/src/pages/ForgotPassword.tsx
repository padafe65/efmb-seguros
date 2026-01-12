import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axiosConfig";
import FlipFormCard from "../components/FlipFormCard";

const forgotPasswordImg = "/img/login1.avif";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setLoading(true);

    // Validaciones
    if (!email || !newPassword || !confirmPassword) {
      setMensaje("❌ Por favor completa todos los campos");
      setLoading(false);
      return;
    }

    if (newPassword.length < 4) {
      setMensaje("❌ La contraseña debe tener al menos 4 caracteres");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMensaje("❌ Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      await API.patch("/auth/reset-password", {
        email,
        newPassword,
      });

      setMensaje("✅ Contraseña actualizada correctamente. Ya puedes iniciar sesión.");
      
      // Limpiar formulario
      setEmail("");
      setNewPassword("");
      setConfirmPassword("");

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Error al actualizar la contraseña";
      setMensaje(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <FlipFormCard 
        frontImage={forgotPasswordImg}
        title="Restablecer Contraseña"
      >
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <h2>Cambiar Contraseña</h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
            Ingresa tu correo electrónico y tu nueva contraseña
          </p>

          <label>Correo Electrónico</label>
          <input
            type="email"
            placeholder="Ingresa tu correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <label>Nueva Contraseña</label>
          <input
            type="password"
            placeholder="Mínimo 4 caracteres"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={4}
            disabled={loading}
          />

          <label>Confirmar Nueva Contraseña</label>
          <input
            type="password"
            placeholder="Confirma tu nueva contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={4}
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Procesando..." : "Cambiar Contraseña"}
          </button>

          {mensaje && (
            <p style={{ 
              color: mensaje.includes("✅") ? "green" : "red", 
              marginTop: "10px",
              textAlign: "center",
              fontWeight: "bold"
            }}>
              {mensaje}
            </p>
          )}

          <div style={{ marginTop: "10px", textAlign: "center" }}>
            <Link to="/login" style={{ color: "#0984e3", textDecoration: "none" }}>
              ← Volver al Login
            </Link>
          </div>
        </form>
      </FlipFormCard>
    </div>
  );
}
