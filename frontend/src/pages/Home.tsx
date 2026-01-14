import { useState, useEffect } from "react";
import "../App.css"; // 👈 IMPORTA TU CSS GLOBAL
import API from "../api/axiosConfig";

export default function Home() {
  const images = [
    "/img/seguros1.webp",
    "/img/seguros2.jpg",
    "/img/seguros3.jpg",
    "/img/seguros4.jpg",
    "/img/seguros5.jpg",
    "/img/seguros6.jpg",
  ];

  const [current, setCurrent] = useState(0);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  // Cargar compañías activas
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await API.get("/companies/public/active");
        setCompanies(res.data || []);
        
        // Si hay compañías, seleccionar la primera por defecto
        if (res.data && res.data.length > 0) {
          const defaultCompany = res.data[0];
          setSelectedCompany(defaultCompany);
          // Guardar en localStorage para que ChatWidget lo use
          localStorage.setItem("selectedCompany", JSON.stringify(defaultCompany));
        }
      } catch (error) {
        console.error("Error cargando compañías", error);
      }
    };
    loadCompanies();
  }, []);

  // Cargar compañía seleccionada desde localStorage al iniciar
  useEffect(() => {
    const savedCompany = localStorage.getItem("selectedCompany");
    if (savedCompany) {
      try {
        setSelectedCompany(JSON.parse(savedCompany));
      } catch (error) {
        console.error("Error parseando compañía guardada", error);
      }
    }
  }, []);

  // Actualizar localStorage cuando cambia la compañía seleccionada
  const handleCompanyChange = (companyId: string) => {
    const company = companies.find(c => c.id === Number(companyId));
    if (company) {
      setSelectedCompany(company);
      localStorage.setItem("selectedCompany", JSON.stringify(company));
      // Disparar evento personalizado para que ChatWidget se actualice
      window.dispatchEvent(new CustomEvent("companyChanged", { detail: company }));
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <>
      <div className="carousel-container">
        <div
          className="carousel-track"
          style={{
            transform: `translateX(-${current * 100}%)`,
          }}
        >
          {images.map((img, i) => (
            <img key={i} src={img} alt={`slide-${i}`} className="carousel-image" />
          ))}
        </div>
      </div>

      <div className="hero text-center p-10">
        <h1 className="text-4xl font-bold mb-4">
          BIENVENIDO A SEGUROSMAB LA EMPRESA QUE CON CARIÑO ASEGURA TU PRESENTE Y FUTURO
        </h1>

        <p className="text-lg mb-6">
          Gestión moderna, rápida y diseñada para nuestros usuarios.
        </p>

        {/* Selector de compañía de seguros */}
        {companies.length > 0 && (
          <div style={{ 
            marginBottom: "20px", 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            gap: "10px",
            flexWrap: "wrap"
          }}>
            <label style={{ 
              fontSize: "16px", 
              fontWeight: "bold",
              color: "#2d3436"
            }}>
              Selecciona tu compañía de seguros:
            </label>
            <select
              value={selectedCompany?.id || ""}
              onChange={(e) => handleCompanyChange(e.target.value)}
              style={{
                padding: "10px 15px",
                borderRadius: "8px",
                border: "2px solid #0984e3",
                fontSize: "16px",
                minWidth: "250px",
                cursor: "pointer",
                background: "white"
              }}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap", marginBottom: "20px" }}>
          <a href="/registrar" className="nav-button">
            <h2>Registrarse</h2>
          </a>
          
          {/* Botones de contacto directo */}
          <button
            onClick={() => {
              const whatsappNumber = selectedCompany?.whatsapp_number || "573026603858";
              const mensaje = encodeURIComponent("Hola, necesito información sobre seguros.");
              window.open(`https://wa.me/${whatsappNumber}?text=${mensaje}`, '_blank');
            }}
            style={{
              background: "linear-gradient(135deg, #25D366, #128C7E)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(37, 211, 102, 0.4)",
            }}
            title="Chatear por WhatsApp"
          >
            💬 WhatsApp
          </button>

          <button
            onClick={() => {
              const facebookUrl = selectedCompany?.facebook_url || "https://web.facebook.com/";
              window.open(facebookUrl, '_blank');
            }}
            style={{
              background: "linear-gradient(135deg, #1877F2, #0C63D4)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(24, 119, 242, 0.4)",
            }}
            title="Visitar Facebook"
          >
            📘 Facebook
          </button>
        </div>

        <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
          💡 También puedes usar el botón flotante de chat en la esquina inferior derecha
        </p>
      </div>
    </>
  );
}
