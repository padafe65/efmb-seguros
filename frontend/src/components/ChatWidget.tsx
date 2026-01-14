// src/components/ChatWidget.tsx
import React, { useState, useEffect } from 'react';
import '../App.css';

// Configuración por defecto - Puedes cambiar estos valores o usar variables de entorno
const DEFAULT_WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '573026603858';
const DEFAULT_FACEBOOK_PAGE_URL = import.meta.env.VITE_FACEBOOK_PAGE_URL || 'https://web.facebook.com/';
const DEFAULT_FACEBOOK_PAGE_ID = import.meta.env.VITE_FACEBOOK_PAGE_ID || '';
const DEFAULT_FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '';

interface ChatWidgetProps {
  whatsappNumber?: string;
  facebookPageUrl?: string;
  facebookPageId?: string;
  facebookAppId?: string;
}

export default function ChatWidget({
  whatsappNumber: propWhatsappNumber,
  facebookPageUrl: propFacebookPageUrl,
  facebookPageId: propFacebookPageId,
  facebookAppId: propFacebookAppId,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  // Cargar compañía seleccionada desde localStorage
  useEffect(() => {
    const loadCompany = () => {
      const savedCompany = localStorage.getItem("selectedCompany");
      if (savedCompany) {
        try {
          setSelectedCompany(JSON.parse(savedCompany));
        } catch (error) {
          console.error("Error parseando compañía guardada", error);
        }
      }
    };

    loadCompany();

    // Escuchar cambios en la compañía seleccionada
    const handleCompanyChange = (event: CustomEvent) => {
      setSelectedCompany(event.detail);
    };

    window.addEventListener("companyChanged" as any, handleCompanyChange as EventListener);
    return () => {
      window.removeEventListener("companyChanged" as any, handleCompanyChange as EventListener);
    };
  }, []);

  // Usar compañía seleccionada o props o valores por defecto
  const whatsappNumber = selectedCompany?.whatsapp_number || propWhatsappNumber || DEFAULT_WHATSAPP_NUMBER;
  const facebookPageUrl = selectedCompany?.facebook_url || propFacebookPageUrl || DEFAULT_FACEBOOK_PAGE_URL;
  const facebookPageId = propFacebookPageId || DEFAULT_FACEBOOK_PAGE_ID;
  const facebookAppId = propFacebookAppId || DEFAULT_FACEBOOK_APP_ID;

  const openWhatsApp = (mensajeInicial = 'Hola, necesito información sobre seguros.') => {
    const mensajeCodificado = encodeURIComponent(mensajeInicial);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${mensajeCodificado}`;
    window.open(whatsappUrl, '_blank');
  };

  const openFacebook = () => {
    window.open(facebookPageUrl, '_blank');
  };

  useEffect(() => {
    // Cargar script de Facebook Messenger solo si hay Page ID configurado
    if (facebookPageId && facebookAppId && !window.fbAsyncInit) {
      window.fbAsyncInit = function() {
        if (window.FB) {
          window.FB.init({
            xfbml: true,
            version: 'v18.0',
            appId: facebookAppId,
          });
        }
      };

      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = 'https://connect.facebook.net/es_ES/sdk/xfbml.customerchat.js';
        if (fjs && fjs.parentNode) {
          fjs.parentNode.insertBefore(js, fjs);
        }
      }(document, 'script', 'facebook-jssdk'));
    }
  }, [facebookPageId, facebookAppId]);

  return (
    <>
      {/* Botones flotantes */}
      <div className="chat-widget-container">
        {isOpen && (
          <div className="chat-widget-menu">
            <button
              className="chat-option whatsapp"
              onClick={() => {
                openWhatsApp();
                setIsOpen(false);
              }}
              title="Abrir WhatsApp"
            >
              <span className="chat-icon">💬</span>
              WhatsApp
            </button>
            <button
              className="chat-option facebook"
              onClick={() => {
                openFacebook();
                setIsOpen(false);
              }}
              title="Abrir Facebook"
            >
              <span className="chat-icon">📘</span>
              Facebook
            </button>
          </div>
        )}
        <button
          className="chat-widget-toggle"
          onClick={() => setIsOpen(!isOpen)}
          title="Abrir opciones de chat"
        >
          {isOpen ? '✕' : '💬'}
        </button>
      </div>

      {/* Plugin de Facebook Messenger (solo se muestra si está configurado) */}
      {facebookPageId && (
        <div
          className="fb-customerchat"
          page_id={facebookPageId}
          theme_color="#0084ff"
          logged_in_greeting="¡Hola! ¿En qué podemos ayudarte con Seguros MAB?"
          logged_out_greeting="¡Hola! ¿En qué podemos ayudarte con Seguros MAB?"
        ></div>
      )}
    </>
  );
}

// Extender Window interface para TypeScript
declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: any;
  }
}
