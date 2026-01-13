# 🔐 Guía de Restablecimiento de Contraseña con Email

## ✅ Implementación Completada

Se ha implementado un sistema seguro de restablecimiento de contraseña que envía un email con un token único al usuario.

---

## 🔄 Cómo Funciona

### Paso 1: Usuario Solicita Restablecimiento
1. El usuario va a la página de Login
2. Hace clic en "¿Olvidaste tu contraseña?"
3. Ingresa su correo electrónico
4. El sistema genera un token único y lo guarda en la base de datos
5. Se envía un email con un enlace que contiene el token

### Paso 2: Usuario Recibe el Email
- El email contiene un enlace como: `http://localhost:5173/reset-password?token=abc123...`
- El enlace expira en **1 hora**

### Paso 3: Usuario Cambia la Contraseña
1. El usuario hace clic en el enlace del email
2. Se valida el token automáticamente
3. Si es válido, se muestra el formulario para nueva contraseña
4. El usuario ingresa su nueva contraseña
5. La contraseña se actualiza y el token se elimina

---

## 🛠️ Configuración Necesaria

### Backend (.env)
Agrega esta variable para que el enlace del email sea correcto:

```env
# URL del frontend (para enlaces en emails)
FRONTEND_URL=http://localhost:5173

# Configuración de email (ya debería estar)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
```

**Nota**: En producción, cambia `FRONTEND_URL` a tu dominio real (ej: `https://segurosmab.com`)

---

## 📧 Formato del Email

El email incluye:
- ✅ Diseño HTML profesional
- ✅ Botón grande para hacer clic
- ✅ Enlace de respaldo (por si el botón no funciona)
- ✅ Información de expiración (1 hora)
- ✅ Mensaje de seguridad

---

## 🔒 Seguridad

### Características de Seguridad:
- ✅ Token único y aleatorio (64 caracteres hexadecimales)
- ✅ Expiración de 1 hora
- ✅ Token se elimina después de usar
- ✅ Token se elimina si expira
- ✅ No se revela si el email existe o no (por seguridad)

### Validaciones:
- ✅ Email debe existir en la base de datos
- ✅ Token debe ser válido y no expirado
- ✅ Nueva contraseña mínimo 4 caracteres
- ✅ Confirmación de contraseña debe coincidir

---

## 🧪 Cómo Probar

### 1. Solicitar Restablecimiento:
```
1. Ve a: http://localhost:5173/login
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa un email que exista en la base de datos
4. Haz clic en "Enviar Enlace de Restablecimiento"
5. Deberías ver: "Si el email existe, recibirás un correo..."
```

### 2. Revisar Email:
```
1. Revisa tu bandeja de entrada
2. Busca el email de "Seguros MAB"
3. Deberías ver un email con el asunto: "Restablecer Contraseña - Seguros MAB"
4. Haz clic en el botón o enlace
```

### 3. Cambiar Contraseña:
```
1. Se abrirá: http://localhost:5173/reset-password?token=...
2. Verás el formulario para nueva contraseña
3. Ingresa tu nueva contraseña
4. Confirma la contraseña
5. Haz clic en "Restablecer Contraseña"
6. Serás redirigido al login
7. Inicia sesión con tu nueva contraseña
```

---

## 🔧 Endpoints del Backend

### 1. Solicitar Restablecimiento
**POST** `/auth/forgot-password`
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta:**
```json
{
  "message": "Si el email existe, recibirás un correo con las instrucciones"
}
```

### 2. Validar Token
**GET** `/auth/validate-reset-token/:token`

**Respuesta (válido):**
```json
{
  "valid": true,
  "email": "usuario@ejemplo.com"
}
```

**Respuesta (inválido):**
```json
{
  "valid": false,
  "message": "Token inválido"
}
```

### 3. Restablecer Contraseña
**PATCH** `/auth/reset-password`
```json
{
  "token": "abc123...",
  "newPassword": "nueva123"
}
```

**Respuesta:**
```json
{
  "message": "Contraseña restablecida correctamente",
  "email": "usuario@ejemplo.com"
}
```

---

## 📊 Cambios en la Base de Datos

Se agregaron dos nuevos campos a la tabla `users`:
- `reset_password_token` (text, nullable) - Token único para restablecimiento
- `reset_password_expires` (timestamp, nullable) - Fecha de expiración del token

**Nota**: Estos campos se crean automáticamente cuando el servidor se reinicia (synchronize: true)

---

## 🎨 Interfaz de Usuario

### Página 1: Solicitar Restablecimiento
- Campo para ingresar email
- Botón "Enviar Enlace de Restablecimiento"
- Mensaje de confirmación después de enviar

### Página 2: Cambiar Contraseña (con token)
- Se muestra automáticamente cuando hay token en la URL
- Validación automática del token
- Formulario para nueva contraseña
- Confirmación de contraseña
- Redirección automática al login después de cambiar

---

## ⚠️ Notas Importantes

1. **Configuración de Email**: Asegúrate de tener configurado `EMAIL_USER` y `EMAIL_PASS` en el `.env` del backend

2. **URL del Frontend**: Configura `FRONTEND_URL` en el `.env` del backend para que los enlaces funcionen correctamente

3. **Expiración**: Los tokens expiran en 1 hora. Si el usuario no cambia la contraseña en ese tiempo, debe solicitar un nuevo restablecimiento

4. **Seguridad**: Por seguridad, el sistema no revela si un email existe o no. Siempre muestra el mismo mensaje

5. **Tokens Únicos**: Cada token es único y solo puede usarse una vez

---

## 🐛 Solución de Problemas

### El email no llega:
- ✅ Verifica que `EMAIL_USER` y `EMAIL_PASS` estén configurados
- ✅ Verifica la carpeta de spam
- ✅ Revisa los logs del backend para errores

### El token no funciona:
- ✅ Verifica que el token no haya expirado (1 hora)
- ✅ Verifica que el token no se haya usado ya
- ✅ Revisa la consola del navegador para errores

### Error al cambiar contraseña:
- ✅ Verifica que la contraseña tenga al menos 4 caracteres
- ✅ Verifica que ambas contraseñas coincidan
- ✅ Revisa los logs del backend

---

## ✅ Checklist de Configuración

- [ ] Variable `FRONTEND_URL` agregada al `.env` del backend
- [ ] Variables `EMAIL_USER` y `EMAIL_PASS` configuradas
- [ ] Backend reiniciado (para crear los nuevos campos)
- [ ] Prueba de solicitud de restablecimiento realizada
- [ ] Email recibido correctamente
- [ ] Token validado correctamente
- [ ] Contraseña cambiada exitosamente

---

**¡Implementación Completada!** 🎉

El sistema de restablecimiento de contraseña con email está completamente funcional y listo para usar.
