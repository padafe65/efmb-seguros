import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FlipFormCard.css";

interface FlipFormCardProps {
  frontImage: string;
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  initialFlipped?: boolean;
}

export default function FlipFormCard({
  frontImage,
  title,
  children,
  onClose,
  initialFlipped = false,
}: FlipFormCardProps) {
  const [flipped, setFlipped] = useState(initialFlipped);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = flipped ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [flipped]);

  // Si se cancela o sale completamente, redirige a Home '/' o ejecuta onClose
  const handleExit = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/");
    }
  };

  const handleFlipBack = () => {
    setFlipped(false);
  };

  return (
    <div className="flip-backdrop" onMouseDown={handleExit}>
      <div
        className="flip-form-wrapper"
        style={{ position: "relative" }}
        onMouseDown={(e) => e.stopPropagation()} /* evitar cerrar al cliquear el interior */
      >
        {/* Botón flotante para salir al inicio visible siempre */}
        <button
          onClick={handleExit}
          type="button"
          title="Salir al inicio"
          style={{
            position: "absolute",
            top: "-15px",
            right: "-15px",
            background: "#e74c3c",
            color: "white",
            border: "2px solid white",
            borderRadius: "50%",
            width: "35px",
            height: "35px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>

        <div className="flip-form-card">
          <div className={`flip-inner ${flipped ? "flipped" : ""}`}>
            {/* FRONT */}
            <div
              className="flip-front"
              onClick={() => setFlipped(true)}
              role="button"
              aria-pressed={flipped}
              style={{ cursor: "pointer" }}
            >
              <img src={frontImage} className="flip-image" alt={title} />
              <div className="flip-front-overlay">
                <h2>{title}</h2>
                <p>Haz clic para continuar</p>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExit();
                  }}
                  style={{
                    display: "inline-block",
                    marginTop: "12px",
                    fontSize: "13px",
                    textDecoration: "underline",
                    color: "#f1f2f6",
                    cursor: "pointer",
                  }}
                >
                  ✕ Cancelar y salir al inicio
                </span>
              </div>
            </div>

            {/* BACK */}
            <div className="flip-back">
              <div className="flip-form-container">
                {children}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                    marginTop: "15px",
                  }}
                >
                  <button
                    className="flip-back-btn"
                    onClick={handleFlipBack}
                    type="button"
                  >
                    Volver a portada
                  </button>

                  <button
                    onClick={handleExit}
                    type="button"
                    style={{
                      background: "#e2e8f0",
                      color: "#2d3748",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Salir al inicio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}