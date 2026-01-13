import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import API from "../api/axiosConfig";
import FlipFormCard from "../components/FlipFormCard";

const forgotPasswordImg = "/img/login1.avif";

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  // Estado para solicitar restablecimiento
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Estado para cambiar contraseña con token
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenEmail, setTokenEmail] = useState("");
  
  const navigate = useNavigate();

  // Si hay token, validarlo al cargar
  useEffect(() => {
    if (token) {
      validateToken();
    }
    // eslint-disable-next-line
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await API.get(`/auth/validate-reset-token/${token}`);
      if (res.data.valid) {
        setTokenValid(true);
        setTokenEmail(res.data.email);
      } else {
        setTokenValid(false);
        setMensaje("❌ Token inválido o expirado");
      }
    } catch (error: any) {
      setTokenValid(false);
      setMensaje("❌ Token inválido o expirado");
    }
  };

  // Solicitar restablecimiento (Paso 1)
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setLoading(true);

    if (!email) {
      setMensaje("❌ Por favor ingresa tu correo electrónico");
      setLoading(false);
      return;
    }

    try {
      await API.post("/auth/forgot-password", { email });
      setEmailSent(true);
      setMensaje("✅ Si el email existe, recibirás un correo con las instrucciones para restablecer tu contraseña.");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Error al solicitar restablecimiento";
      setMensaje(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar contraseña con token (Paso 2)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setLoading(true);

    if (!newPassword || !confirmPassword) {
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
        token,
        newPassword,
      });

      setMensaje("✅ Contraseña restablecida correctamente. Redirigiendo al login...");
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Error al restablecer la contraseña";
      setMensaje(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Si hay token, mostrar formulario de cambio de contraseña
  if (token) {
    if (tokenValid === null) {
      return (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <p>Validando token...</p>
        </div>
      );
    }

    if (tokenValid === false) {
      return (
        <div style={{ padding: "40px" }}>
          <FlipFormCard 
            frontImage={forgotPasswordImg}
            title="Token Inválido"
          >
            <div style={{ textAlign: "center" }}>
              <h2>Token Inválido o Expirado</h2>
              <p style={{ color: "red", margin: "20px 0" }}>
                El enlace de restablecimiento no es válido o ha expirado.
              </p>
              <Link to="/forgot-password" style={{ color: "#0984e3", textDecoration: "none" }}>
                Solicitar nuevo restablecimiento
              </Link>
              <br />
              {localStorage.getItem("token") ? (
                <Link to="/dashboard-user" style={{ color: "#0984e3", textDecoration: "none", marginTop: "10px", display: "block" }}>
                  ← Volver al Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/" style={{ color: "#0984e3", textDecoration: "none", marginTop: "10px", display: "block" }}>
                    ← Volver al Inicio
                  </Link>
                  <Link to="/login" style={{ color: "#0984e3", textDecoration: "none", marginTop: "10px", display: "block" }}>
                    Volver al Login
                  </Link>
                </>
              )}
            </div>
          </FlipFormCard>
        </div>
      );
    }

    return (
      <div style={{ padding: "40px" }}>
        <FlipFormCard 
          frontImage={forgotPasswordImg}
          title="Restablecer Contraseña"
        >
          <form onSubmit={handleResetPassword} style={{ display: "grid", gap: 12 }}>
            <h2>Nueva Contraseña</h2>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
              Ingresa tu nueva contraseña para {tokenEmail}
            </p>

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
              {loading ? "Procesando..." : "Restablecer Contraseña"}
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
              {localStorage.getItem("token") ? (
                <Link to="/dashboard-user" style={{ color: "#0984e3", textDecoration: "none", marginRight: "10px" }}>
                  ← Volver al Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/" style={{ color: "#0984e3", textDecoration: "none", marginRight: "10px" }}>
                    ← Volver al Inicio
                  </Link>
                  <Link to="/login" style={{ color: "#0984e3", textDecoration: "none" }}>
                    Volver al Login
                  </Link>
                </>
              )}
            </div>
          </form>
        </FlipFormCard>
      </div>
    );
  }

  // Formulario para solicitar restablecimiento (sin token)
  return (
    <div style={{ padding: "40px" }}>
      <FlipFormCard 
        frontImage={forgotPasswordImg}
        title="Restablecer Contraseña"
      >
        {!emailSent ? (
          <form onSubmit={handleRequestReset} style={{ display: "grid", gap: 12 }}>
            <h2>¿Olvidaste tu contraseña?</h2>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
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

            <button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Enlace de Restablecimiento"}
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
              {localStorage.getItem("token") ? (
                <Link to="/dashboard-user" style={{ color: "#0984e3", textDecoration: "none", marginRight: "10px" }}>
                  ← Volver al Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/" style={{ color: "#0984e3", textDecoration: "none", marginRight: "10px" }}>
                    ← Volver al Inicio
                  </Link>
                  <Link to="/login" style={{ color: "#0984e3", textDecoration: "none" }}>
                    Volver al Login
                  </Link>
                </>
              )}
            </div>
          </form>
        ) : (
          <div style={{ textAlign: "center" }}>
            <h2>✅ Correo Enviado</h2>
            <p style={{ margin: "20px 0", color: "#666" }}>
              Si el email <strong>{email}</strong> existe en nuestro sistema, recibirás un correo con las instrucciones para restablecer tu contraseña.
            </p>
            <p style={{ margin: "20px 0", color: "#666", fontSize: "14px" }}>
              Revisa tu bandeja de entrada y la carpeta de spam. El enlace expirará en 1 hora.
            </p>
            <div style={{ marginTop: "20px" }}>
              <button 
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                  setMensaje("");
                }}
                style={{
                  background: "#0984e3",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Enviar otro correo
              </button>
            </div>
            <div style={{ marginTop: "15px" }}>
              <Link to="/login" style={{ color: "#0984e3", textDecoration: "none" }}>
                ← Volver al Login
              </Link>
            </div>
          </div>
        )}
      </FlipFormCard>
    </div>
  );
}
