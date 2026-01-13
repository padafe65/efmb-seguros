# 🏢 Instrucciones de Migración Multi-Tenant

## ✅ Implementación Completada

Se ha implementado completamente el sistema multi-tenant que permite:
- Múltiples aseguradoras/empresas
- Cada admin ve solo sus clientes y pólizas
- Cada usuario ve el nombre de su aseguradora
- El super_user puede ver todo y filtrar por empresa
- Los PDFs muestran datos dinámicos de la empresa

---

## 📋 Pasos para Activar el Sistema

### 1. Ejecutar Script SQL de Migración

1. Abre **pgAdmin 4**
2. Conecta a tu base de datos `segurosmab`
3. Abre el archivo `migracion_multi_tenant.sql`
4. Ejecuta todo el script (F5 o botón "Execute")

**Este script:**
- Crea la tabla `companies`
- Crea una empresa por defecto "Seguros MAB"
- Agrega `company_id` a `users`, `policies`, `contact_messages`
- Asigna todos los datos existentes a "Seguros MAB"

---

### 2. Reiniciar el Backend

```bash
cd backend
npm run start:dev
```

El backend ahora:
- Sincronizará las nuevas relaciones con TypeORM
- Cargará el módulo `CompaniesModule`
- Filtrará automáticamente por `company_id` según el rol

---

### 3. Reiniciar el Frontend

```bash
cd frontend
npm run dev
```

El frontend ahora:
- Mostrará el nombre de la aseguradora en el dashboard del usuario
- Permitirá filtrar por empresa en el dashboard super_user
- Generará PDFs con datos dinámicos de la empresa

---

## 🎯 Funcionalidades Implementadas

### Para Usuarios (role: user)
- ✅ Ven el nombre de su aseguradora en el dashboard
- ✅ Solo ven sus propias pólizas (filtradas por `company_id`)
- ✅ Los PDFs muestran datos de su aseguradora

### Para Admins (role: admin)
- ✅ Solo ven usuarios de su empresa
- ✅ Solo ven pólizas de su empresa
- ✅ Al crear usuarios/pólizas, se asignan automáticamente a su empresa
- ✅ Solo ven mensajes de contacto de su empresa

### Para Super User (role: super_user)
- ✅ Ven todas las empresas
- ✅ Pueden crear/editar empresas
- ✅ Pueden filtrar usuarios/pólizas por empresa
- ✅ Ven columna "Empresa" en todas las tablas
- ✅ Pueden asignar empresas a usuarios

---

## 📝 Cambios en la Base de Datos

### Nueva Tabla: `companies`
```sql
- id (SERIAL PRIMARY KEY)
- nombre (VARCHAR)
- nit (VARCHAR)
- direccion (TEXT)
- telefono (VARCHAR)
- email (VARCHAR)
- logo_url (VARCHAR)
- color_primario (VARCHAR) - Para PDFs y UI
- color_secundario (VARCHAR) - Para PDFs y UI
- isactive (BOOLEAN)
- created_at (TIMESTAMP)
```

### Modificaciones:
- `users.company_id` → Foreign Key a `companies.id`
- `policies.company_id` → Foreign Key a `companies.id` (NOT NULL)
- `contact_messages.company_id` → Foreign Key a `companies.id`

---

## 🔧 Endpoints Nuevos

### Companies (Solo Super User)
- `POST /companies` - Crear empresa
- `GET /companies` - Listar empresas
- `GET /companies/:id` - Obtener empresa
- `PATCH /companies/:id` - Actualizar empresa
- `DELETE /companies/:id` - Desactivar empresa

---

## 🎨 Cambios en Frontend

### Dashboard User
- Muestra banner con nombre de aseguradora
- Carga datos de empresa automáticamente

### Dashboard Super User
- Filtro por empresa en usuarios y pólizas
- Columna "Empresa" en tablas
- Dropdown para seleccionar empresa

### PDF de Pólizas
- Usa `companyData.nombre` en lugar de "SEGUROS MAB"
- Usa `companyData.nit`, `direccion`, `telefono`, `email`
- Usa `companyData.color_primario` y `color_secundario` para estilos

---

## 🚀 Próximos Pasos (Opcional)

### 1. Crear más empresas desde Super User Dashboard
1. Inicia sesión como `super_user`
2. Ve al dashboard super_user
3. Crea nuevas empresas usando el endpoint `/companies`

### 2. Asignar usuarios a diferentes empresas
- Desde el dashboard super_user, puedes editar usuarios y asignarles `company_id`
- O crear nuevos usuarios desde un admin específico (se asignan automáticamente)

### 3. Personalizar datos de empresa
- Edita la empresa desde el dashboard super_user
- Cambia nombre, NIT, dirección, colores, logo
- Los cambios se reflejan en PDFs y dashboards

---

## ⚠️ Notas Importantes

1. **Datos Existentes**: Todos los datos existentes se asignan a "Seguros MAB" por defecto
2. **Nuevos Usuarios**: Si un admin crea un usuario, se asigna automáticamente a su empresa
3. **Nuevas Pólizas**: Se asignan a la empresa del admin que las crea
4. **Super User**: Puede ver y gestionar todas las empresas
5. **PDFs**: Si no hay datos de empresa, usa valores por defecto

---

## 🐛 Solución de Problemas

### Error: "No se puede crear póliza sin empresa asignada"
- **Causa**: El usuario no tiene `company_id` asignado
- **Solución**: Asignar `company_id` al usuario desde super_user dashboard

### Error: "Foreign key constraint fails"
- **Causa**: Intentas asignar un `company_id` que no existe
- **Solución**: Verificar que la empresa existe en la tabla `companies`

### Los PDFs muestran "SEGUROS MAB" en lugar del nombre de la empresa
- **Causa**: No se cargaron los datos de la empresa
- **Solución**: Verificar que la póliza tiene `company_id` y que el endpoint `/companies/:id` funciona

---

## 📞 Soporte

Si encuentras algún problema:
1. Verifica que el script SQL se ejecutó correctamente
2. Verifica que el backend se reinició después de los cambios
3. Revisa los logs del backend para errores
4. Verifica que las relaciones en TypeORM están correctas

---

¡Listo! El sistema multi-tenant está completamente implementado y listo para usar. 🎉
