import { useEffect, useRef } from 'react';

/**
 * Hook para detectar inactividad del usuario y cerrar sesión automáticamente
 * @param timeoutMinutes - Tiempo de inactividad en minutos antes de cerrar sesión (default: 30)
 */
export const useInactivityTimeout = (timeoutMinutes: number = 30) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutMs = timeoutMinutes * 60 * 1000; // Convertir minutos a milisegundos

  const resetTimeout = () => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Solo activar si hay un token (usuario autenticado)
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // Crear nuevo timeout
    timeoutRef.current = setTimeout(() => {
      console.log(`⏰ Sesión cerrada por inactividad (${timeoutMinutes} minutos)`);
      
      // Limpiar datos de sesión
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirigir al home
      window.location.href = '/';
    }, timeoutMs);
  };

  useEffect(() => {
    // Eventos que indican actividad del usuario
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Resetear timeout cuando hay actividad
    events.forEach((event) => {
      window.addEventListener(event, resetTimeout, { passive: true });
    });

    // Inicializar timeout
    resetTimeout();

    // Limpiar al desmontar
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimeout);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeoutMinutes]);
};
