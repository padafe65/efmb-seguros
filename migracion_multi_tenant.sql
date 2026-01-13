-- Script SQL para migración a sistema multi-tenant
-- Ejecutar en pgAdmin 4 después de reiniciar el backend

-- ============================================
-- 1. CREAR TABLA COMPANIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.companies (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  nit VARCHAR(50),
  direccion TEXT,
  telefono VARCHAR(50),
  email VARCHAR(255),
  logo_url VARCHAR(500),
  color_primario VARCHAR(7) DEFAULT '#631025',
  color_secundario VARCHAR(7) DEFAULT '#4c55d3',
  isactive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. CREAR EMPRESA POR DEFECTO
-- ============================================
INSERT INTO public.companies (nombre, nit, direccion, telefono, email, color_primario, color_secundario)
VALUES (
  'Seguros MAB',
  NULL,
  NULL,
  NULL,
  NULL,
  '#631025',
  '#4c55d3'
)
ON CONFLICT DO NOTHING;

-- Obtener el ID de la empresa por defecto (asumimos que es 1)
-- Si necesitas obtener el ID dinámicamente, usa:
-- SELECT id FROM companies WHERE nombre = 'Seguros MAB' LIMIT 1;

-- ============================================
-- 3. AGREGAR company_id A USERS
-- ============================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS company_id INTEGER;

-- Asignar empresa por defecto a usuarios existentes
UPDATE public.users 
SET company_id = (SELECT id FROM public.companies WHERE nombre = 'Seguros MAB' LIMIT 1)
WHERE company_id IS NULL;

-- Agregar foreign key (después de asignar valores)
ALTER TABLE public.users
ADD CONSTRAINT fk_users_company 
FOREIGN KEY (company_id) 
REFERENCES public.companies(id) 
ON DELETE SET NULL;

-- ============================================
-- 4. AGREGAR company_id A POLICIES
-- ============================================
ALTER TABLE public.policies 
ADD COLUMN IF NOT EXISTS company_id INTEGER;

-- Asignar empresa por defecto a pólizas existentes
-- Basado en el company_id del usuario
UPDATE public.policies p
SET company_id = (
  SELECT u.company_id 
  FROM public.users u 
  WHERE u.id = p.user_id 
  LIMIT 1
)
WHERE company_id IS NULL;

-- Si aún hay pólizas sin company_id, asignar empresa por defecto
UPDATE public.policies 
SET company_id = (SELECT id FROM public.companies WHERE nombre = 'Seguros MAB' LIMIT 1)
WHERE company_id IS NULL;

-- Hacer company_id NOT NULL después de asignar valores
ALTER TABLE public.policies
ALTER COLUMN company_id SET NOT NULL;

-- Agregar foreign key
ALTER TABLE public.policies
ADD CONSTRAINT fk_policies_company 
FOREIGN KEY (company_id) 
REFERENCES public.companies(id) 
ON DELETE RESTRICT;

-- ============================================
-- 5. AGREGAR company_id A CONTACT_MESSAGES
-- ============================================
ALTER TABLE public.contact_messages 
ADD COLUMN IF NOT EXISTS company_id INTEGER;

-- Asignar empresa por defecto a mensajes existentes
-- Basado en el company_id del usuario si existe
UPDATE public.contact_messages cm
SET company_id = (
  SELECT u.company_id 
  FROM public.users u 
  WHERE u.id = cm.user_id 
  LIMIT 1
)
WHERE company_id IS NULL AND user_id IS NOT NULL;

-- Si aún hay mensajes sin company_id, asignar empresa por defecto
UPDATE public.contact_messages 
SET company_id = (SELECT id FROM public.companies WHERE nombre = 'Seguros MAB' LIMIT 1)
WHERE company_id IS NULL;

-- Agregar foreign key
ALTER TABLE public.contact_messages
ADD CONSTRAINT fk_contact_messages_company 
FOREIGN KEY (company_id) 
REFERENCES public.companies(id) 
ON DELETE SET NULL;

-- ============================================
-- 6. VERIFICACIÓN
-- ============================================
-- Verificar que todas las tablas tienen company_id
SELECT 
  'users' as tabla,
  COUNT(*) as total,
  COUNT(company_id) as con_company_id,
  COUNT(*) - COUNT(company_id) as sin_company_id
FROM public.users
UNION ALL
SELECT 
  'policies' as tabla,
  COUNT(*) as total,
  COUNT(company_id) as con_company_id,
  COUNT(*) - COUNT(company_id) as sin_company_id
FROM public.policies
UNION ALL
SELECT 
  'contact_messages' as tabla,
  COUNT(*) as total,
  COUNT(company_id) as con_company_id,
  COUNT(*) - COUNT(company_id) as sin_company_id
FROM public.contact_messages;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Este script asigna todos los datos existentes a "Seguros MAB"
-- 2. Después de ejecutar, puedes crear más empresas desde el dashboard super_user
-- 3. Los nuevos usuarios/pólizas se asignarán automáticamente según el admin que los cree
-- 4. Si necesitas cambiar la empresa de usuarios/pólizas existentes, hazlo manualmente o desde el dashboard
