-- Script SQL para crear un usuario Super User
-- Ejecuta este script en tu base de datos PostgreSQL (segurosmab)

-- Opción 1: Insertar nuevo usuario Super User
-- NOTA: La contraseña "admin123" está hasheada con bcrypt
-- Si quieres otra contraseña, necesitas generar el hash primero

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
  '$2b$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq',  -- Contraseña: "admin123"
  'Dirección de prueba',
  'Bogotá',
  '3026603858',
  true,
  ARRAY['super_user']::users_roles_enum[]
)
ON CONFLICT (email) DO NOTHING;  -- Evita duplicados

-- Opción 2: Actualizar un usuario existente a Super User
-- Descomenta y ajusta el email:
-- UPDATE users 
-- SET roles = ARRAY['super_user']::users_roles_enum[]
-- WHERE email = 'tu_email@ejemplo.com';

-- Verificar que se creó correctamente:
SELECT id, user_name, email, roles, isactive 
FROM users 
WHERE roles @> ARRAY['super_user']::users_roles_enum[];
