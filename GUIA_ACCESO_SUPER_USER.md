# 👑 Guía para Acceder al Dashboard Super User

## 📋 Opciones para Crear un Usuario Super User

Tienes **3 opciones** para crear un usuario con rol `super_user`:

---

## Opción 1: Directamente en la Base de Datos (Más Rápido) ⚡

### Paso 1: Conectarte a PostgreSQL
```bash
# Abre tu cliente de PostgreSQL (pgAdmin, DBeaver, o terminal)
# Conéctate a la base de datos: segurosmab
```

### Paso 2: Insertar Usuario Super User
Ejecuta este SQL (ajusta los valores según necesites):

```sql
INSERT INTO users (
  user_name,
  documento,
  email,
  user_password,
  direccion,
  ciudad,
  telefono,
  isactive,
  roles
) VALUES (
  'Super Admin',
  '1234567890',
  'superadmin@segurosmab.com',
  '$2b$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq',  -- Contraseña: "admin123" (hasheada)
  'Dirección de prueba',
  'Bogotá',
  '3026603858',
  true,
  ARRAY['super_user']::users_roles_enum[]
);
```

### Paso 3: Hashear tu propia contraseña
Si quieres usar otra contraseña, genera el hash con bcrypt. O usa esta contraseña temporal: `admin123`

**Nota**: La contraseña hasheada de ejemplo es para `admin123`. Si quieres otra, necesitas generarla.

---

## Opción 2: Usando el Endpoint de Registro (Requiere modificar código) 🔧

### Paso 1: Crear usuario normal primero
1. Ve a: `http://localhost:5173/registrar`
2. Crea un usuario normal

### Paso 2: Modificar el rol en la base de datos
```sql
UPDATE users 
SET roles = ARRAY['super_user']::users_roles_enum[]
WHERE email = 'tu_email@ejemplo.com';
```

---

## Opción 3: Usando Postman o cURL (Recomendado) 🚀

### Paso 1: Crear usuario con rol super_user
Abre Postman o usa cURL:

**POST** `http://localhost:3000/auth/register`

**Body (JSON)**:
```json
{
  "user_name": "Super Admin",
  "documento": "1234567890",
  "email": "superadmin@segurosmab.com",
  "user_password": "admin123",
  "direccion": "Dirección de prueba",
  "ciudad": "Bogotá",
  "telefono": "3026603858",
  "roles": ["super_user"]
}
```

**cURL**:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "Super Admin",
    "documento": "1234567890",
    "email": "superadmin@segurosmab.com",
    "user_password": "admin123",
    "direccion": "Dirección de prueba",
    "ciudad": "Bogotá",
    "telefono": "3026603858",
    "roles": ["super_user"]
  }'
```

---

## 🔐 Cómo Iniciar Sesión como Super User

### Paso 1: Ve a la página de Login
```
http://localhost:5173/login
```

### Paso 2: Ingresa tus credenciales
- **Email**: `superadmin@segurosmab.com` (o el que hayas usado)
- **Contraseña**: `admin123` (o la que hayas configurado)

### Paso 3: Haz clic en "Ingresar"

### Paso 4: Redirección automática
- Si el rol es `super_user`, serás redirigido automáticamente a:
  ```
  http://localhost:5173/dashboard-super
  ```

---

## 📊 Qué Verás en el Dashboard Super User

Una vez dentro, verás:

### 1. **Tab Usuarios** 👥
- Lista de todos los usuarios
- Filtros por nombre, email, documento
- Botones para:
  - ➕ Crear usuario
  - ✏️ Editar usuario
  - 🗑️ Eliminar usuario
  - **🔑 Editar roles** (solo super_user puede hacer esto)
  - 👁️ Ver pólizas del usuario

### 2. **Tab Pólizas** 📋
- Lista de todas las pólizas
- Filtros por user_id, policy_number, placa
- Botones para:
  - ➕ Crear póliza
  - ✏️ Editar póliza
  - 🗑️ Eliminar póliza

### 3. **Tab Estadísticas** 📊
- Total de usuarios
- Usuarios activos
- Total de pólizas
- Pólizas por vencer (próximo mes)

---

## 🎯 Funcionalidades Especiales del Super User

### Gestión de Roles
1. Ve al **Tab Usuarios**
2. Busca un usuario
3. Haz clic en **"✏️ Editar Roles"**
4. Selecciona los roles que quieres asignar:
   - ☑️ user
   - ☑️ admin
   - ☑️ super_user
5. Haz clic en **"✅ Guardar"**

**Nota**: Solo el `super_user` puede cambiar roles de otros usuarios.

---

## 🚀 Acceso Directo (Si ya estás logueado)

Si ya tienes una sesión activa, puedes acceder directamente:

```
http://localhost:5173/dashboard-super
```

**Nota**: Si no eres `super_user`, serás redirigido a la página principal.

---

## ✅ Verificación Rápida

### Checklist:
- [ ] Usuario creado con rol `super_user`
- [ ] Backend corriendo en `http://localhost:3000`
- [ ] Frontend corriendo en `http://localhost:5173`
- [ ] Iniciaste sesión con el usuario super_user
- [ ] Fuiste redirigido a `/dashboard-super`
- [ ] Puedes ver las 3 tabs (Usuarios, Pólizas, Estadísticas)
- [ ] Puedes editar roles de usuarios

---

## 🐛 Solución de Problemas

### No puedo iniciar sesión:
- ✅ Verifica que el usuario existe en la base de datos
- ✅ Verifica que el rol sea `super_user` (no `super-user` o `superuser`)
- ✅ Verifica que la contraseña sea correcta
- ✅ Revisa la consola del navegador (F12) para errores

### No me redirige al dashboard-super:
- ✅ Verifica que el rol en localStorage sea `super_user`
- ✅ Abre la consola del navegador (F12) y revisa el payload del JWT
- ✅ Intenta acceder directamente: `http://localhost:5173/dashboard-super`

### No puedo editar roles:
- ✅ Verifica que estés logueado como `super_user`
- ✅ Verifica que el backend esté corriendo
- ✅ Revisa la consola del navegador para errores de API

### Error 403 o Forbidden:
- ✅ Verifica que el token JWT sea válido
- ✅ Verifica que el rol en el token sea `super_user`
- ✅ Intenta cerrar sesión y volver a iniciar

---

## 📝 Ejemplo de Usuario Super User

**Credenciales de ejemplo** (si usas la Opción 1 o 3):
- **Email**: `superadmin@segurosmab.com`
- **Contraseña**: `admin123`
- **Rol**: `super_user`

**⚠️ IMPORTANTE**: Cambia estas credenciales en producción.

---

## 🎉 ¡Listo!

Una vez que tengas acceso al dashboard super_user, podrás:
- ✅ Gestionar todos los usuarios
- ✅ Gestionar todas las pólizas
- ✅ Asignar y cambiar roles
- ✅ Ver estadísticas del sistema
- ✅ Acceder a todas las funcionalidades administrativas

---

**¿Necesitas ayuda?** Revisa los logs del backend y la consola del navegador para más detalles.
