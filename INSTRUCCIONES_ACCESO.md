# 📍 Dónde Están los Botones de WhatsApp y Facebook

## 🎯 Ubicación de los Botones

### 1. **Botón Flotante (En TODAS las páginas)**
- **Ubicación**: Esquina inferior derecha de la pantalla
- **Apariencia**: Botón circular verde con ícono 💬
- **Funcionamiento**: 
  - Haz clic en el botón → Se despliegan opciones
  - Selecciona "WhatsApp" → Abre chat de WhatsApp
  - Selecciona "Facebook" → Abre tu página de Facebook

### 2. **Botones en la Página Home** (NUEVO - Agregado)
- **Ubicación**: En la sección "hero" (debajo del título principal)
- **Apariencia**: Botones grandes y visibles con colores distintivos
- **Funcionamiento**: 
  - Botón verde "💬 WhatsApp" → Abre WhatsApp directamente
  - Botón azul "📘 Facebook" → Abre Facebook directamente

---

## 🖥️ Cómo Acceder a la Aplicación

### ⚠️ IMPORTANTE: La aplicación NO está montada en la web

**La aplicación solo funciona localmente en tu computadora.** Para usarla:

### Paso 1: Iniciar el Backend
```bash
cd backend
npm install  # Solo la primera vez
npm run start:dev
```
El backend estará en: `http://localhost:3000`

### Paso 2: Iniciar el Frontend
```bash
cd frontend
npm install  # Solo la primera vez
npm run dev
```
El frontend estará en: `http://localhost:5173`

### Paso 3: Abrir en el Navegador
1. Abre tu navegador (Chrome, Firefox, Edge, etc.)
2. Ve a: `http://localhost:5173`
3. Verás la página Home con los botones de WhatsApp y Facebook

---

## 🔐 Cuentas y Acceso

### ⚠️ NO se crearon cuentas automáticamente

**Tú debes crear las cuentas:**

### 1. **Twilio (Para WhatsApp automático)**
- **Link**: https://www.twilio.com/try-twilio
- **Proceso**: 
  1. Crea cuenta gratuita
  2. Obtén Account SID y Auth Token
  3. Configura WhatsApp Sandbox
  4. Agrega credenciales al archivo `.env` del backend

**Ver**: `CONFIGURACION_WHATSAPP_FACEBOOK.md` para instrucciones detalladas

### 2. **Facebook (Para Messenger)**
- **Link**: https://www.facebook.com/
- **Proceso**:
  1. Crea o usa tu cuenta de Facebook
  2. Crea una página para tu negocio (opcional)
  3. Obtén el Page ID (opcional)
  4. Agrega al archivo `.env` del frontend (opcional)

**Nota**: El botón de Facebook funciona sin configuración, solo abre tu página.

---

## 📱 Cómo Probar los Botones

### Desde Home.tsx:
1. Inicia el servidor (backend y frontend)
2. Abre `http://localhost:5173` en tu navegador
3. Verás la página Home
4. **Opción 1**: Haz clic en los botones grandes de WhatsApp o Facebook
5. **Opción 2**: Haz clic en el botón flotante (esquina inferior derecha)

### Desde cualquier página:
1. El botón flotante está disponible en TODAS las páginas
2. Esquina inferior derecha → Botón verde 💬
3. Haz clic → Selecciona WhatsApp o Facebook

---

## 🎨 Visualización

### Botón Flotante:
```
                    [Página]
                         
                         
                         
                         
                         
                         
                         
                         
                         [💬]  ← Esquina inferior derecha
```

### Botones en Home:
```
┌─────────────────────────────────────┐
│   BIENVENIDO A EFMB-SEGUROS...        │
│                                      │
│   Gestión moderna, rápida...       │
│                                      │
│  [Registrarse] [💬 WhatsApp] [📘 Facebook]  ← Botones grandes
│                                      │
│  💡 También puedes usar el botón    │
│     flotante en la esquina...       │
└─────────────────────────────────────┘
```

---

## ✅ Resumen

1. **Botones disponibles en**:
   - ✅ Página Home (botones grandes y visibles)
   - ✅ Todas las páginas (botón flotante)

2. **Aplicación funciona en**:
   - ✅ Localmente en tu computadora
   - ❌ NO está en internet (no hay link público)

3. **Cuentas**:
   - ❌ NO se crearon automáticamente
   - ✅ Tú debes crear las cuentas de Twilio y Facebook

4. **Para usar**:
   - Inicia backend: `cd backend && npm run start:dev`
   - Inicia frontend: `cd frontend && npm run dev`
   - Abre: `http://localhost:5173`

---

## 🆘 ¿Problemas?

- **No veo los botones**: Verifica que el frontend esté corriendo
- **Los botones no funcionan**: Verifica la consola del navegador (F12)
- **WhatsApp no envía automáticamente**: Necesitas configurar Twilio (ver guía)
- **Facebook no abre**: Verifica que la URL esté correcta en el código

---

**¡Listo!** Ahora sabes dónde están los botones y cómo acceder a la aplicación. 🎉
