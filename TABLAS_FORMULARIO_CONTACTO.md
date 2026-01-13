# 📊 Tablas Necesarias para el Formulario de Contacto

## Resumen

**NO se modificarán tablas existentes.** Solo se creará **UNA NUEVA TABLA**.

---

## Tablas Actuales en el Proyecto

1. **`users`** - Usuarios del sistema
2. **`policies`** - Pólizas de seguros

**Estas tablas NO se modificarán.**

---

## Nueva Tabla a Crear

### Tabla: `contact_messages` o `support_tickets`

Esta tabla almacenará los mensajes enviados desde el formulario de contacto.

---

## Esquema Propuesto de la Tabla

### Opción 1: Tabla Simple (Recomendada para empezar)

```sql
CREATE TABLE contact_messages (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  asunto VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  user_id INTEGER,  -- Opcional: si el usuario está logueado
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leido BOOLEAN DEFAULT FALSE,
  respondido BOOLEAN DEFAULT FALSE
);
```

**Campos:**
- `id` - ID único del mensaje
- `nombre` - Nombre del usuario que envía el mensaje
- `email` - Email del usuario
- `asunto` - Asunto del mensaje
- `mensaje` - Contenido del mensaje
- `user_id` - (Opcional) ID del usuario si está logueado
- `created_at` - Fecha y hora de creación
- `leido` - Si el administrador ya leyó el mensaje
- `respondido` - Si el administrador ya respondió

---

### Opción 2: Tabla con Relación a Usuarios (Más completa)

```sql
CREATE TABLE contact_messages (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  asunto VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- Relación opcional
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leido BOOLEAN DEFAULT FALSE,
  respondido BOOLEAN DEFAULT FALSE,
  respuesta TEXT,  -- Respuesta del administrador
  responded_at TIMESTAMP,  -- Fecha de respuesta
  responded_by INTEGER REFERENCES users(id)  -- Quién respondió
);
```

**Campos adicionales:**
- `user_id` - Relación con tabla `users` (si el usuario está logueado)
- `respuesta` - Respuesta del administrador
- `responded_at` - Fecha de respuesta
- `responded_by` - ID del administrador que respondió

---

## Estructura en TypeORM (Entity)

```typescript
@Entity({ name: 'contact_messages' })
export class ContactMessageEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text', { nullable: false })
  nombre: string;

  @Column('text', { nullable: false })
  email: string;

  @Column('text', { nullable: false })
  asunto: string;

  @Column('text', { nullable: false })
  mensaje: string;

  @ManyToOne(() => UsersEntity, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: UsersEntity;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column('boolean', { default: false })
  leido: boolean;

  @Column('boolean', { default: false })
  respondido: boolean;

  @Column('text', { nullable: true })
  respuesta?: string;

  @Column('timestamp', { nullable: true })
  responded_at?: Date;

  @ManyToOne(() => UsersEntity, { nullable: true })
  @JoinColumn({ name: 'responded_by' })
  responded_by_user?: UsersEntity;
}
```

---

## Resumen de Cambios

### ✅ Se Creará:
- **1 nueva tabla**: `contact_messages`

### ❌ NO Se Modificará:
- Tabla `users` - Sin cambios
- Tabla `policies` - Sin cambios
- Ninguna otra tabla existente

---

## Ventajas de Cada Opción

### Opción 1 (Simple):
- ✅ Más rápida de implementar
- ✅ No requiere relación con usuarios
- ✅ Funciona para usuarios no logueados
- ❌ No guarda quién respondió

### Opción 2 (Completa):
- ✅ Relación con usuarios
- ✅ Historial de respuestas
- ✅ Saber quién respondió
- ✅ Mejor para dashboard de administradores
- ❌ Un poco más compleja

---

## Recomendación

**Empezar con Opción 1** y luego, si es necesario, migrar a Opción 2.

---

## ¿Qué Prefieres?

1. **Opción 1 (Simple)** - Solo guardar mensajes básicos
2. **Opción 2 (Completa)** - Con relaciones y respuestas
3. **Solo Email** - No crear tabla, solo enviar email (más simple aún)

¿Cuál prefieres implementar?
