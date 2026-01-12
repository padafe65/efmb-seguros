import { useState, useEffect } from "react";
import "../App.css"; // 👈 IMPORTA TU CSS GLOBAL

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

        <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap", marginBottom: "20px" }}>
          <a href="/registrar" className="nav-button">
            <h2>Registrarse</h2>
          </a>
          
          {/* Botones de contacto directo */}
          <button
            onClick={() => {
              const mensaje = encodeURIComponent("Hola, necesito información sobre seguros.");
              window.open(`https://wa.me/573026603858?text=${mensaje}`, '_blank');
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
              window.open("https://web.facebook.com/", '_blank');
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
