# 📧 Explicación del Formulario de Contacto

## Estado Actual

**El formulario de contacto actualmente NO está conectado al backend.** 

Cuando un usuario llena el formulario y hace clic en "Enviar Mensaje", solo muestra una alerta en el navegador pero **no envía el mensaje a ningún lugar**.

---

## Cómo Funciona Actualmente

1. Usuario llena el formulario en la sección "Contacto y Soporte"
2. Hace clic en "Enviar Mensaje"
3. Se muestra una alerta: "Mensaje enviado. Nos pondremos en contacto contigo pronto."
4. **El mensaje NO se guarda ni se envía a ningún correo**

---

## Cómo Debería Funcionar (Implementación Recomendada)

### Opción 1: Envío por Email (Recomendado)
- El mensaje se envía por email al administrador
- Se usa el servicio de notificaciones existente (`NotificationsService`)
- El administrador recibe el email con los datos del usuario

### Opción 2: Guardar en Base de Datos
- Crear una tabla `contact_messages` o `support_tickets`
- Guardar los mensajes en la base de datos
- Los administradores pueden verlos desde el dashboard

### Opción 3: Combinación (Ideal)
- Guardar en base de datos
- Enviar email de notificación al administrador
- Permitir que los administradores respondan desde el dashboard

---

## Implementación Sugerida

### Backend:
1. Crear endpoint `POST /contact/send-message`
2. Validar los datos del formulario
3. Guardar en base de datos (opcional)
4. Enviar email al administrador usando `NotificationsService`

### Frontend:
1. Conectar el formulario al endpoint
2. Mostrar mensaje de éxito/error real
3. Limpiar el formulario después de enviar

---

## ¿Quieres que lo implemente?

Puedo implementar cualquiera de estas opciones. La más simple sería:
- Enviar el mensaje por email al administrador
- Usar el email configurado en `EMAIL_USER` del backend

¿Quieres que lo implemente ahora?
