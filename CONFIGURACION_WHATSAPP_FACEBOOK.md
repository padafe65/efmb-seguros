# 📱 Configuración de WhatsApp y Facebook Messenger

Esta guía te ayudará a configurar WhatsApp (Twilio) y Facebook Messenger para tu aplicación Seguros MAB.

## 🔵 Configuración de WhatsApp con Twilio

### Paso 1: Crear cuenta en Twilio
1. Ve a [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Crea una cuenta gratuita (incluye $15.50 de crédito para pruebas)
3. Verifica tu número de teléfono

### Paso 2: Obtener credenciales de Twilio
1. Una vez en el Dashboard de Twilio, verás:
   - **Account SID**: Se muestra en el dashboard principal
   - **Auth Token**: Haz clic en "Show" para verlo (solo se muestra una vez)

### Paso 3: Configurar WhatsApp Sandbox
1. En el Dashboard de Twilio, ve a **Messaging** > **Try it out** > **Send a WhatsApp message**
2. O ve directamente a: [https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
3. Verás un número de WhatsApp de prueba (formato: `whatsapp:+14155238886`)
4. Para enviar mensajes, el destinatario debe enviar primero un mensaje con el código que Twilio te proporciona
   - Ejemplo: Si el código es `join example-code`, el usuario debe enviar ese mensaje primero

### Paso 4: Agregar variables al archivo `.env` del backend

Abre `backend/.env` y agrega:

```env
# WhatsApp - Twilio Configuration
USE_TWILIO=true
TWILIO_ACCOUNT_SID=tu_account_sid_aqui
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  # El número que Twilio te da en el sandbox

# WhatsApp - Número de negocio (para enlaces directos como fallback)
WHATSAPP_NUMBER=573026603858

# Admin phone para notificaciones
ADMIN_PHONE=573026603858
```

### Paso 5: Probar WhatsApp
1. Reinicia el servidor backend: `npm run start:dev`
2. El sistema intentará enviar con Twilio primero
3. Si Twilio falla o no está configurado, usará enlaces directos automáticamente

### ⚠️ Nota importante sobre Twilio Sandbox
- En el **sandbox (modo prueba)**, solo puedes enviar mensajes a números que hayan enviado primero el código de unión
- Para producción, necesitarás:
  - Solicitar un número de WhatsApp Business verificado
  - Completar el proceso de verificación de negocio con Meta

---

## 📘 Configuración de Facebook Messenger

### Opción 1: Solo botón de enlace (Simple - Ya configurado)
El widget ya tiene un botón que abre tu página de Facebook. Solo necesitas:
- Tu URL de Facebook (ya está configurada: `https://web.facebook.com/`)

### Opción 2: Plugin oficial de Facebook Messenger (Recomendado)

#### Paso 1: Crear una página de Facebook
1. Ve a [https://www.facebook.com/pages/create](https://www.facebook.com/pages/create)
2. Crea una página para "Negocio o marca"
3. Completa la información de tu negocio

#### Paso 2: Obtener el Page ID
1. Ve a tu página de Facebook
2. Haz clic en "Acerca de" en el menú lateral
3. Desplázate hasta encontrar "ID de página" o "Page ID"
4. Copia ese número (ejemplo: `123456789012345`)

#### Paso 3: Crear una App de Facebook (Opcional, para Messenger avanzado)
1. Ve a [https://developers.facebook.com/apps/](https://developers.facebook.com/apps/)
2. Haz clic en "Crear app"
3. Selecciona "Negocio" como tipo de app
4. Completa la información
5. En el dashboard de la app, ve a **Configuración** > **Básica**
6. Copia el **App ID**

#### Paso 4: Configurar variables en el frontend

Crea o edita `frontend/.env` (o `frontend/.env.local`):

```env
VITE_WHATSAPP_NUMBER=573026603858
VITE_FACEBOOK_PAGE_URL=https://web.facebook.com/tu-pagina
VITE_FACEBOOK_PAGE_ID=tu_page_id_aqui
VITE_FACEBOOK_APP_ID=tu_app_id_aqui
```

**Nota**: Si no configuras `VITE_FACEBOOK_PAGE_ID` y `VITE_FACEBOOK_APP_ID`, el widget funcionará pero solo mostrará el botón de enlace (no el plugin de Messenger).

#### Paso 5: Reiniciar el frontend
```bash
cd frontend
npm run dev
```

---

## 🧪 Cómo probar

### Probar WhatsApp:
1. **Con Twilio (si está configurado)**:
   - El sistema enviará mensajes automáticamente cuando una póliza esté por vencer
   - Verifica los logs del backend para ver si se envió correctamente

2. **Sin Twilio (modo enlaces directos)**:
   - Los usuarios recibirán notificaciones por email con el enlace de WhatsApp
   - O pueden hacer clic en el botón flotante del widget

### Probar Facebook Messenger:
1. Haz clic en el botón flotante de chat
2. Selecciona "Facebook"
3. Debería abrir tu página de Facebook
4. Si configuraste el plugin, también verás el widget de Messenger en la esquina

---

## 🔧 Modo de desarrollo vs producción

### Desarrollo (Pruebas):
- **WhatsApp**: Usa Twilio Sandbox (gratis, limitado a números verificados)
- **Facebook**: Botón de enlace simple

### Producción:
- **WhatsApp**: Necesitas un número de WhatsApp Business verificado
- **Facebook**: Plugin de Messenger completamente funcional

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del backend: `npm run start:dev` en la carpeta `backend`
2. Revisa la consola del navegador (F12) para errores de Facebook
3. Verifica que las variables de entorno estén correctamente configuradas

---

## ✅ Checklist de configuración

- [ ] Cuenta de Twilio creada
- [ ] Credenciales de Twilio agregadas al `.env` del backend
- [ ] Número de WhatsApp Sandbox configurado
- [ ] Página de Facebook creada
- [ ] Page ID de Facebook obtenido
- [ ] Variables de entorno del frontend configuradas
- [ ] Backend reiniciado
- [ ] Frontend reiniciado
- [ ] Pruebas realizadas

---

**¡Listo!** 🎉 Ahora tu aplicación puede enviar notificaciones por WhatsApp y los usuarios pueden chatear contigo desde WhatsApp y Facebook.
