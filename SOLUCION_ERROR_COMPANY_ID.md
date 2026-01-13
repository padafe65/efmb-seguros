# 🔧 Solución al Error: "company_id contiene valores null"

## ❌ Error
```
QueryFailedError: la columna «company_id» de la relación «policies» contiene valores null
```

## 🔍 Causa
TypeORM está intentando agregar la columna `company_id` como `NOT NULL` a la tabla `policies`, pero la tabla ya tiene registros existentes. PostgreSQL no permite hacer una columna `NOT NULL` si hay filas con valores `NULL`.

## ✅ Solución (2 Opciones)

### Opción 1: Ejecutar Script SQL Primero (RECOMENDADO)

**Paso 1:** Ejecuta el script SQL de migración ANTES de reiniciar el backend:

1. Abre pgAdmin 4
2. Conecta a la base de datos `segurosmab`
3. Ejecuta el archivo `migracion_multi_tenant.sql`
4. Esto asignará valores a todas las columnas `company_id`
5. Reinicia el backend

**Paso 2:** Después de ejecutar el script, vuelve a hacer la relación NOT NULL:

Edita `backend/src/policy/entities/policy.entity.ts`:

```typescript
// Cambiar de nullable: true a nullable: false
@ManyToOne(() => CompanyEntity, { nullable: false, eager: false })
@JoinColumn({ name: 'company_id' })
company: CompanyEntity;
```

Y en `backend/src/policy/policies.service.ts`:

```typescript
// Volver a hacer obligatorio
if (!companyId) {
  throw new BadRequestException('No se puede crear póliza sin empresa asignada');
}
```

---

### Opción 2: Hacer Nullable Temporalmente (YA APLICADO)

Ya he hecho la relación nullable temporalmente para que el backend pueda iniciar. 

**Pasos:**
1. ✅ La relación ya es `nullable: true` (hecho)
2. ✅ El servicio ya permite crear sin company_id (hecho)
3. 🔄 **Ejecuta el script SQL** `migracion_multi_tenant.sql` en pgAdmin
4. 🔄 **Después de ejecutar el script**, vuelve a hacer la relación NOT NULL (ver Opción 1)

---

## 📋 Orden Correcto de Ejecución

### Si aún NO has ejecutado el script SQL:

1. **Primero**: Ejecuta `migracion_multi_tenant.sql` en pgAdmin
2. **Segundo**: Reinicia el backend (debería arrancar correctamente)
3. **Tercero** (opcional): Vuelve a hacer `company_id` NOT NULL en la entidad

### Si YA ejecutaste el script SQL:

1. El backend debería arrancar correctamente ahora
2. Si aún da error, verifica que el script se ejecutó completamente
3. Puedes verificar con esta consulta en pgAdmin:

```sql
SELECT 
  COUNT(*) as total_policies,
  COUNT(company_id) as con_company_id,
  COUNT(*) - COUNT(company_id) as sin_company_id
FROM policies;
```

Si `sin_company_id` es mayor que 0, ejecuta de nuevo la parte del script que asigna valores:

```sql
-- Asignar empresa por defecto a pólizas sin company_id
UPDATE policies p
SET company_id = (
  SELECT u.company_id 
  FROM users u 
  WHERE u.id = p.user_id 
  LIMIT 1
)
WHERE company_id IS NULL;

-- Si aún hay pólizas sin company_id, asignar empresa por defecto
UPDATE policies 
SET company_id = (SELECT id FROM companies WHERE nombre = 'Seguros MAB' LIMIT 1)
WHERE company_id IS NULL;
```

---

## 🎯 Resumen

- ✅ **Ya aplicado**: La relación es nullable temporalmente
- 🔄 **Pendiente**: Ejecutar script SQL en pgAdmin
- 🔄 **Pendiente** (opcional): Volver a hacer NOT NULL después del script

El backend debería arrancar ahora. Una vez que ejecutes el script SQL y asignes valores a todas las `company_id`, puedes volver a hacer la relación NOT NULL para mayor seguridad.
