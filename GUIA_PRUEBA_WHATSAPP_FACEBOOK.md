# 🧪 Guía para Probar WhatsApp y Facebook

## 📋 Pasos para Probar los Botones

### Paso 1: Iniciar el Backend
Abre una terminal y ejecuta:
```bash
cd backend
npm run start:dev
```

Espera a ver: `Nest application successfully started on http://localhost:3000`

### Paso 2: Iniciar el Frontend
Abre OTRA terminal (deja la primera corriendo) y ejecuta:
```bash
cd frontend
npm run dev
```

Espera a ver: `Local: http://localhost:5173`

### Paso 3: Abrir en el Navegador
1. Abre tu navegador (Chrome, Firefox, Edge, etc.)
2. Ve a: **http://localhost:5173**
3. Verás la página Home de Seguros MAB

---

## 🧪 Cómo Probar los Botones

### Prueba 1: Botones en la Página Home

1. **En la página Home**, verás dos botones grandes:
   - **💬 WhatsApp** (botón verde)
   - **📘 Facebook** (botón azul)

2. **Haz clic en "💬 WhatsApp"**:
   - Se abrirá una nueva pestaña o ventana
   - Te llevará a WhatsApp Web o la app de WhatsApp
   - El mensaje prellenado será: "Hola, necesito información sobre seguros."
   - **Número configurado**: +57 302 660 3858

3. **Haz clic en "📘 Facebook"**:
   - Se abrirá una nueva pestaña o ventana
   - Te llevará a tu página de Facebook
   - URL configurada: https://web.facebook.com/

### Prueba 2: Botón Flotante

1. **Busca el botón flotante** en la esquina inferior derecha
   - Es un botón circular verde con ícono 💬

2. **Haz clic en el botón flotante**:
   - Se desplegará un menú con dos opciones:
     - WhatsApp
     - Facebook

3. **Selecciona una opción**:
   - Funciona igual que los botones grandes de Home

---

## ✅ Qué Deberías Ver

### Cuando Funciona Correctamente:

#### WhatsApp:
- Se abre WhatsApp Web (si estás en computadora)
- O se abre la app de WhatsApp (si estás en móvil)
- El número aparece: **+57 302 660 3858**
- El mensaje aparece prellenado: "Hola, necesito información sobre seguros."
- Puedes enviar el mensaje directamente

#### Facebook:
- Se abre una nueva pestaña con Facebook
- Te lleva a: https://web.facebook.com/
- Puedes navegar normalmente en Facebook

---

## 🎯 Prueba Real con Otra Persona

### Para Probar WhatsApp:

1. **Inicia los servidores** (backend y frontend)

2. **Abre la aplicación** en tu navegador: http://localhost:5173

3. **Haz clic en el botón de WhatsApp**

4. **Envía el mensaje** a tu número: +57 302 660 3858

5. **Verifica en tu teléfono**:
   - Deberías recibir el mensaje en WhatsApp
   - Puedes responder desde tu teléfono
   - La conversación funcionará normalmente

### Para Probar Facebook:

1. **Haz clic en el botón de Facebook**

2. **Comparte el link** de tu página de Facebook con otra persona

3. **Pueden chatear** a través de Messenger si tienes la página configurada

---

## 🔍 Verificar que Funciona

### Checklist de Prueba:

- [ ] Backend iniciado (puerto 3000)
- [ ] Frontend iniciado (puerto 5173)
- [ ] Página Home se carga correctamente
- [ ] Botones de WhatsApp y Facebook son visibles
- [ ] Botón flotante aparece en la esquina inferior derecha
- [ ] Clic en WhatsApp abre WhatsApp Web/App
- [ ] Clic en Facebook abre Facebook
- [ ] El número de WhatsApp es correcto (+57 302 660 3858)
- [ ] El mensaje aparece prellenado en WhatsApp

---

## 🐛 Solución de Problemas

### Los botones no aparecen:
- ✅ Verifica que el frontend esté corriendo
- ✅ Recarga la página (F5)
- ✅ Revisa la consola del navegador (F12)

### WhatsApp no abre:
- ✅ Verifica que tengas WhatsApp instalado o WhatsApp Web abierto
- ✅ Verifica que el número esté correcto en el código
- ✅ Prueba abriendo WhatsApp manualmente primero

### Facebook no abre:
- ✅ Verifica tu conexión a internet
- ✅ Verifica que la URL de Facebook sea correcta
- ✅ Prueba abriendo Facebook manualmente primero

### Los servidores no inician:
- ✅ Verifica que tengas Node.js instalado: `node --version`
- ✅ Instala dependencias: `npm install` en backend y frontend
- ✅ Verifica que el puerto 3000 y 5173 no estén en uso

---

## 📸 Capturas de Pantalla Esperadas

### Página Home:
```
┌─────────────────────────────────────┐
│   [Carrusel de imágenes]            │
│                                      │
│   BIENVENIDO A EFMB-SEGUROS...        │
│                                      │
│   Gestión moderna, rápida...        │
│                                      │
│  [Registrarse] [💬 WhatsApp] [📘 Facebook]  ← Botones aquí
│                                      │
│  💡 También puedes usar el botón    │
│     flotante en la esquina...       │
└─────────────────────────────────────┘
                                      [💬]  ← Botón flotante aquí
```

---

## 🎉 ¡Listo para Probar!

Sigue estos pasos y podrás probar los botones de WhatsApp y Facebook localmente. Una vez que funcione, puedes considerar desplegar la aplicación en un servidor web para que esté disponible en internet.

---

**Nota**: Los botones funcionan **inmediatamente** sin necesidad de configurar Twilio o Facebook Messenger. Solo abren WhatsApp y Facebook con tu número/URL configurados.
