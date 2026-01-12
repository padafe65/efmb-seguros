# ⚡ Acceso Rápido al Dashboard Super User

## 🚀 Método Más Rápido (2 minutos)

### Opción A: Crear Super User desde el Formulario (Si ya tienes un admin)

1. **Inicia sesión como admin** (o cualquier usuario existente)
2. **Ve a**: `http://localhost:5173/admin/users/create`
3. **Llena el formulario**:
   - Nombre: `Super Admin`
   - Email: `superadmin@segurosmab.com`
   - Contraseña: `admin123`
   - **Roles**: Selecciona `super_user` en el dropdown
   - Completa los demás campos requeridos
4. **Haz clic en "Crear Usuario"**
5. **Cierra sesión** y **inicia sesión** con el nuevo usuario
6. **Serás redirigido automáticamente** a `/dashboard-super`

---

### Opción B: Crear Super User directamente en la Base de Datos (1 minuto)

1. **Abre tu cliente de PostgreSQL** (pgAdmin, DBeaver, etc.)
2. **Conéctate a la base de datos**: `segurosmab`
3. **Ejecuta este SQL**:

```sql
INSERT INTO users (
  user_name, documento, email, user_password, direccion, ciudad, telefono, isactive, roles
) VALUES (
  'Super Admin',
  '1234567890',
  'superadmin@segurosmab.com',
  '$2b$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq',
  'Dirección',
  'Bogotá',
  '3026603858',
  true,
  ARRAY['super_user']::users_roles_enum[]
);
```

**Contraseña**: `admin123` (ya está hasheada en el SQL)

4. **Inicia sesión**:
   - Email: `superadmin@segurosmab.com`
   - Contraseña: `admin123`
5. **Serás redirigido** a `/dashboard-super`

---

### Opción C: Usar cURL o Postman

**POST** `http://localhost:3000/auth/register`

**Body**:
```json
{
  "user_name": "Super Admin",
  "documento": "1234567890",
  "email": "superadmin@segurosmab.com",
  "user_password": "admin123",
  "direccion": "Dirección",
  "ciudad": "Bogotá",
  "telefono": "3026603858",
  "roles": ["super_user"]
}
```

---

## 🔐 Iniciar Sesión

1. **Ve a**: `http://localhost:5173/login`
2. **Email**: `superadmin@segurosmab.com`
3. **Contraseña**: `admin123`
4. **Haz clic en "Ingresar"**
5. **Serás redirigido automáticamente** a:
   ```
   http://localhost:5173/dashboard-super
   ```

---

## 📊 Qué Verás

Una vez dentro del Dashboard Super User:

### Tabs disponibles:
- **👥 Usuarios**: Gestionar usuarios, editar roles
- **📋 Pólizas**: Gestionar pólizas
- **📊 Estadísticas**: Ver estadísticas del sistema

### Funcionalidades especiales:
- ✅ **Editar roles** de cualquier usuario
- ✅ **Ver todas las pólizas** de todos los usuarios
- ✅ **Crear, editar, eliminar** usuarios y pólizas
- ✅ **Ver estadísticas** completas del sistema

---

## ✅ Verificación

Después de iniciar sesión, deberías ver:
- ✅ URL: `http://localhost:5173/dashboard-super`
- ✅ Título: "Panel Super Usuario"
- ✅ 3 tabs: Usuarios, Pólizas, Estadísticas
- ✅ Botón "✏️ Editar Roles" en cada usuario

---

## 🐛 Si No Funciona

1. **Verifica que el backend esté corriendo**: `http://localhost:3000`
2. **Verifica que el frontend esté corriendo**: `http://localhost:5173`
3. **Revisa la consola del navegador** (F12) para errores
4. **Verifica el rol en la base de datos**:
   ```sql
   SELECT email, roles FROM users WHERE email = 'superadmin@segurosmab.com';
   ```
   Debe mostrar: `{super_user}`

---

## 🎯 Acceso Directo

Si ya estás logueado como super_user, puedes ir directamente a:
```
http://localhost:5173/dashboard-super
```

---

**¡Listo!** 🎉 Ahora tienes acceso completo al sistema como Super User.
