-- Script SQL para agregar campos de restablecimiento de contraseña a la tabla users
-- Ejecuta este script en pgAdmin 4 si TypeORM no lo hace automáticamente

-- Agregar campo para el token de restablecimiento
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS reset_password_token text;

-- Agregar campo para la fecha de expiración del token
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS reset_password_expires timestamp without time zone;

-- Verificar que los campos se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
    AND table_schema = 'public'
    AND column_name IN ('reset_password_token', 'reset_password_expires');
