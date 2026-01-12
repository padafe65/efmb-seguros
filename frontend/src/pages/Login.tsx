import FlipFormCard from "../components/FlipFormCard";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axiosConfig";

const loginImg = "/img/login1.avif";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const { data } = await API.post("/auth/login", {
      email,
      user_password: password,
    });

    console.log("🔥 DATA LOGIN:", data);

    const token = data.token;
    localStorage.setItem("token", token);

    // Decodificar JWT
    const payload = JSON.parse(atob(token.split(".")[1]));
    console.log("🔥 PAYLOAD JWT:", payload);

    const rol = Array.isArray(payload.roles) ? payload.roles[0] : payload.roles;

    console.log("🔥 ROL DETECTADO:", rol);

    // GUARDAR ROL CON EL NOMBRE CORRECTO
    localStorage.setItem("rol", rol);
    // Guardar ID y Roles correctamente
localStorage.setItem("id_user", payload.id_user);
localStorage.setItem("rol", payload.roles[0]);

    localStorage.setItem("user_name", data.Details.UserDetails.name);
    localStorage.setItem("email", data.Details.UserDetails.email);

    if (rol === "user") {
      navigate("/dashboard-user", { replace: true });
    } else if (rol === "admin") {
      navigate("/dashboard-admin", { replace: true });
    } else if (rol === "super_user") {
      navigate("/dashboard-super", { replace: true });
    } else {
      setMensaje("Rol desconocido");
    }

  } catch (error: any) {
    console.error("❌ Error:", error.response?.data || error);
    setMensaje("❌ Credenciales incorrectas");
  }
};


  return (
    <div style={{ padding: "40px" }}>
      <FlipFormCard 
        frontImage={loginImg}
        title="Ingresar a su cuenta"
      >
        <form onSubmit={handleLogin}>
          <h2>Login</h2>

          <label>Correo</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Contraseña</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Ingresar</button>

          {mensaje && (
            <p style={{ color: "red", marginTop: "10px" }}>{mensaje}</p>
          )}

          <div style={{ marginTop: "15px", textAlign: "center" }}>
            <Link 
              to="/forgot-password" 
              style={{ 
                color: "#0984e3", 
                textDecoration: "none",
                fontSize: "14px"
              }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

        </form>
      </FlipFormCard>
    </div>
  );
}
