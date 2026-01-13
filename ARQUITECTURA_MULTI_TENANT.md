# 🏢 Arquitectura Multi-Tenant para Múltiples Aseguradoras

## 📋 Resumen de la Necesidad

Necesitas que el sistema soporte múltiples aseguradoras donde:
- Cada **admin** es dueño de una aseguradora/empresa
- Cada **admin** solo ve sus propios clientes y pólizas
- Cada **usuario** ve el nombre de su aseguradora
- El **super_user** puede ver todo y saber a qué aseguradora pertenece cada cosa
- Los PDFs muestran los datos de la aseguradora correspondiente

---

## 🏗️ Arquitectura Propuesta

### 1. Nueva Tabla: `companies` o `aseguradoras`

```sql
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,  -- Nombre de la aseguradora
  nit VARCHAR(50),                -- NIT o identificación
  direccion TEXT,
  telefono VARCHAR(50),
  email VARCHAR(255),
  logo_url VARCHAR(500),          -- URL del logo (opcional)
  color_primario VARCHAR(7),      -- Color principal (#631025)
  color_secundario VARCHAR(7),    -- Color secundario (#4c55d3)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isactive BOOLEAN DEFAULT TRUE
);
```

**Campos importantes:**
- `nombre` - Nombre de la aseguradora (ej: "Seguros ABC", "Aseguradora XYZ")
- `nit` - Identificación fiscal
- `direccion`, `telefono`, `email` - Datos de contacto
- `logo_url` - Logo de la empresa (para PDFs)
- `color_primario`, `color_secundario` - Colores de marca

---

### 2. Modificar Tabla `users`

**Agregar campo:**
```sql
ALTER TABLE users ADD COLUMN company_id INTEGER REFERENCES companies(id);
```

**Lógica:**
- **Admin/Super_user**: Tiene `company_id` (es dueño de esa empresa)
- **User**: Tiene `company_id` (pertenece a esa aseguradora)
- **Super_user**: Puede tener `company_id = NULL` (ve todas las empresas)

---

### 3. Modificar Tabla `policies`

**Agregar campo:**
```sql
ALTER TABLE policies ADD COLUMN company_id INTEGER REFERENCES companies(id) NOT NULL;
```

**Lógica:**
- Cada póliza pertenece a una empresa
- Se hereda del usuario que la crea

---

### 4. Modificar Tabla `contact_messages`

**Agregar campo:**
```sql
ALTER TABLE contact_messages ADD COLUMN company_id INTEGER REFERENCES companies(id);
```

**Lógica:**
- Los mensajes de contacto pertenecen a una empresa
- Se filtra según el admin que los ve

---

## 🔄 Flujo de Datos

### Cuando un Admin crea un Usuario:
1. El admin tiene `company_id = X`
2. Al crear usuario, se asigna automáticamente `company_id = X`
3. El usuario queda vinculado a esa aseguradora

### Cuando un Admin crea una Póliza:
1. Se asigna automáticamente `company_id` del admin
2. La póliza pertenece a esa aseguradora

### Cuando un Usuario ve su Dashboard:
1. Se obtiene su `company_id`
2. Se carga la información de la empresa (nombre, logo, colores)
3. Se muestran solo sus pólizas (filtradas por `company_id`)

### Cuando un Admin ve su Dashboard:
1. Se obtiene su `company_id`
2. Se filtran usuarios: `WHERE company_id = admin.company_id`
3. Se filtran pólizas: `WHERE company_id = admin.company_id`
4. Se muestran datos de su empresa

### Cuando el Super_user ve su Dashboard:
1. Ve todas las empresas
2. Ve todos los usuarios (con su `company_id`)
3. Ve todas las pólizas (con su `company_id`)
4. Puede filtrar por empresa

---

## 📄 Cambios en el PDF

### Ubicación Actual:
`frontend/src/pages/CreatePolicy.tsx` - Función `generatePDF()`

### Cambios Necesarios:

**Antes:**
```typescript
const generatePDF = (policyData: any, userData: any) => {
  // Hardcodeado:
  <h1>SEGUROS MAB</h1>
}
```

**Después:**
```typescript
const generatePDF = (policyData: any, userData: any, companyData: any) => {
  // Dinámico:
  <h1>{companyData.nombre}</h1>
  <p>NIT: {companyData.nit}</p>
  <p>Dirección: {companyData.direccion}</p>
  // Usar companyData.color_primario y color_secundario para estilos
}
```

**Dónde obtener `companyData`:**
- Desde el backend: Agregar endpoint `GET /companies/:id`
- O incluir en la respuesta de la póliza: `policy.company`
- O cargar desde el usuario: `user.company`

---

## 🔧 Cambios en Backend

### 1. Nueva Entidad: `CompanyEntity`
```typescript
// backend/src/companies/entities/company.entity.ts
@Entity({ name: 'companies' })
export class CompanyEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text', { nullable: false })
  nombre: string;

  @Column('text', { nullable: true })
  nit: string;

  @Column('text', { nullable: true })
  direccion: string;

  @Column('text', { nullable: true })
  telefono: string;

  @Column('text', { nullable: true })
  email: string;

  @Column('text', { nullable: true, name: 'logo_url' })
  logo_url: string;

  @Column('text', { nullable: true, name: 'color_primario' })
  color_primario: string;

  @Column('text', { nullable: true, name: 'color_secundario' })
  color_secundario: string;

  @Column('boolean', { default: true })
  isactive: boolean;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
```

### 2. Modificar `UsersEntity`
```typescript
// Agregar relación:
@ManyToOne(() => CompanyEntity, { nullable: true })
@JoinColumn({ name: 'company_id' })
company?: CompanyEntity;
```

### 3. Modificar `PolicyEntity`
```typescript
// Agregar relación:
@ManyToOne(() => CompanyEntity, { nullable: false })
@JoinColumn({ name: 'company_id' })
company: CompanyEntity;
```

### 4. Modificar Servicios

**AuthService - Crear Usuario:**
```typescript
async createUser(createUserDto: CreateUserDTO, adminCompanyId: number) {
  // Si el que crea es admin, asignar su company_id
  const user = this.UsersRepository.create({
    ...createUserDto,
    company: { id: adminCompanyId } as any
  });
}
```

**PoliciesService - Crear Póliza:**
```typescript
async create(dto: CreatePolicyDto, adminCompanyId: number) {
  const policy = this.policyRepository.create({
    ...dto,
    company: { id: adminCompanyId } as any
  });
}
```

**PoliciesService - Filtrar por Company:**
```typescript
async findByUser(userId: number) {
  return await this.policyRepository.find({
    where: { 
      user: { id: userId },
      company: { id: userCompanyId } // Filtrar por company del usuario
    },
    relations: ['user', 'company'],
  });
}
```

### 5. Middleware/Guard para Filtrar por Company

```typescript
// Decorador personalizado
export const GetCompany = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return user.company_id; // O user.company?.id
  },
);
```

---

## 🎨 Cambios en Frontend

### 1. Dashboard Admin - Filtrar Datos

**Antes:**
```typescript
const loadUsers = async () => {
  const res = await API.get('/auth/users');
  setUsers(res.data);
};
```

**Después:**
```typescript
const loadUsers = async () => {
  // El backend ya filtra por company_id del admin
  const res = await API.get('/auth/users'); // Backend filtra automáticamente
  setUsers(res.data);
};
```

### 2. Dashboard User - Mostrar Nombre de Aseguradora

**Agregar:**
```typescript
const [company, setCompany] = useState(null);

useEffect(() => {
  // Cargar datos de la empresa del usuario
  const loadCompany = async () => {
    const res = await API.get(`/companies/${user.company_id}`);
    setCompany(res.data);
  };
  if (user?.company_id) {
    loadCompany();
  }
}, [user]);

// Mostrar en el dashboard:
{company && (
  <div>
    <h3>Aseguradora: {company.nombre}</h3>
    <p>NIT: {company.nit}</p>
  </div>
)}
```

### 3. PDF - Usar Datos de la Empresa

**Modificar `generatePDF`:**
```typescript
const generatePDF = async (policyData: any, userData: any) => {
  // Cargar datos de la empresa
  const companyRes = await API.get(`/companies/${policyData.company_id}`);
  const companyData = companyRes.data;

  // Usar companyData en lugar de valores hardcodeados
  const htmlContent = `
    <h1>${companyData.nombre}</h1>
    <p>NIT: ${companyData.nit}</p>
    <p>Dirección: ${companyData.direccion}</p>
    // ... resto del PDF con datos dinámicos
  `;
};
```

---

## 🔐 Sistema de Permisos

### Admin:
- Solo ve usuarios con su `company_id`
- Solo ve pólizas con su `company_id`
- Solo crea usuarios/pólizas con su `company_id`
- Ve datos de su empresa

### User:
- Solo ve sus propias pólizas (ya filtradas por `company_id`)
- Ve el nombre de su aseguradora
- No puede cambiar su `company_id`

### Super_user:
- Ve todas las empresas
- Ve todos los usuarios (con su `company_id` visible)
- Ve todas las pólizas (con su `company_id` visible)
- Puede crear/editar empresas
- Puede asignar `company_id` a usuarios
- Puede filtrar por empresa en el dashboard

---

## 📊 Dashboard Super_user - Mejoras

### Agregar Filtro por Empresa:
```typescript
const [filterCompany, setFilterCompany] = useState<number | null>(null);

// Al cargar usuarios:
const loadUsers = async () => {
  const params = filterCompany ? { company_id: filterCompany } : {};
  const res = await API.get('/auth/users', { params });
  setUsers(res.data);
};

// En la tabla, mostrar columna:
<th>Empresa</th>
<td>{user.company?.nombre || 'Sin empresa'}</td>
```

---

## 🗂️ Estructura de Archivos a Crear

```
backend/src/
  companies/
    entities/
      company.entity.ts
    dto/
      create-company.dto.ts
      update-company.dto.ts
    companies.service.ts
    companies.controller.ts
    companies.module.ts
```

---

## 📝 Pasos de Implementación

### Fase 1: Base de Datos
1. Crear tabla `companies`
2. Agregar `company_id` a `users`
3. Agregar `company_id` a `policies`
4. Agregar `company_id` a `contact_messages`

### Fase 2: Backend
1. Crear módulo `CompaniesModule`
2. Modificar `AuthService` para asignar `company_id`
3. Modificar `PoliciesService` para filtrar por `company_id`
4. Agregar filtros en todos los endpoints

### Fase 3: Frontend
1. Crear componente para mostrar datos de empresa
2. Modificar PDF para usar datos dinámicos
3. Agregar filtros en dashboard de super_user
4. Mostrar nombre de aseguradora en dashboard de usuario

### Fase 4: Super_user
1. CRUD de empresas
2. Asignar empresas a usuarios
3. Vista de todas las empresas

---

## 🎯 Dónde Cambiar Datos de Aseguradora

### Opción 1: Base de Datos Directa
```sql
UPDATE companies 
SET nombre = 'Nueva Aseguradora',
    nit = '123456789',
    direccion = 'Nueva Dirección'
WHERE id = 1;
```

### Opción 2: Dashboard Super_user (Futuro)
- Crear/Editar empresas desde el dashboard
- Cambiar nombre, NIT, dirección, colores, logo

### Opción 3: Perfil de Admin
- Cada admin puede editar los datos de su empresa
- Solo puede editar su propia empresa

---

## 💡 Recomendaciones

1. **Empezar Simple:**
   - Crear tabla `companies`
   - Asignar `company_id` manualmente al principio
   - Luego automatizar

2. **Datos por Defecto:**
   - Crear una empresa "Seguros MAB" por defecto
   - Asignar a usuarios existentes

3. **Migración de Datos:**
   - Script SQL para asignar `company_id` a datos existentes
   - Asignar todos a una empresa por defecto

4. **Validaciones:**
   - Un admin solo puede crear usuarios en su empresa
   - Un usuario no puede cambiar su `company_id`
   - Las pólizas heredan el `company_id` del creador

---

## ❓ Preguntas para Decidir

1. **¿Cada admin puede editar su empresa?**
   - Sí → Agregar endpoint para editar empresa propia
   - No → Solo super_user puede editar empresas

2. **¿Los usuarios pueden cambiar de aseguradora?**
   - Sí → Permitir cambio (con aprobación)
   - No → Solo super_user puede cambiar

3. **¿Cada empresa tiene su propio dominio?**
   - Sí → Sistema más complejo (subdominios)
   - No → Mismo dominio, filtrado por `company_id`

---

## 📌 Resumen

**Para implementar multi-tenant necesitas:**

1. ✅ Crear tabla `companies`
2. ✅ Agregar `company_id` a `users`, `policies`, `contact_messages`
3. ✅ Modificar servicios para filtrar por `company_id`
4. ✅ Modificar PDF para usar datos de la empresa
5. ✅ Agregar vista de empresa en dashboards
6. ✅ CRUD de empresas para super_user

**¿Quieres que lo implemente paso a paso?**
