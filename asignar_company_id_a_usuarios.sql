-- Script para asignar company_id = 1 (EFMB Seguros) a todos los usuarios
-- excepto super_user que no tengan company_id asignado

-- Verificar primero cuántos usuarios se van a actualizar
SELECT 
    id,
    user_name,
    email,
    roles,
    company_id
FROM users
WHERE 
    company_id IS NULL
    AND NOT ('super_user' = ANY(roles))
ORDER BY id;

-- Actualizar todos los usuarios (user y admin) que no sean super_user
-- y que tengan company_id NULL
UPDATE users
SET company_id = 1
WHERE 
    company_id IS NULL
    AND NOT ('super_user' = ANY(roles));

-- Verificar los resultados después de la actualización
SELECT 
    id,
    user_name,
    email,
    roles,
    company_id,
    CASE 
        WHEN company_id = 1 THEN '✅ Asignado a EFMB Seguros'
        WHEN company_id IS NULL THEN '⚠️ Sin compañía asignada'
        ELSE 'ℹ️ Otra compañía'
    END AS estado
FROM users
ORDER BY 
    CASE 
        WHEN 'super_user' = ANY(roles) THEN 1
        ELSE 2
    END,
    id;

-- Contar usuarios por tipo y compañía
SELECT 
    CASE 
        WHEN 'super_user' = ANY(roles) THEN 'super_user'
        WHEN 'admin' = ANY(roles) THEN 'admin'
        ELSE 'user'
    END AS tipo_usuario,
    COUNT(*) AS total,
    COUNT(CASE WHEN company_id = 1 THEN 1 END) AS con_efmb_seguros,
    COUNT(CASE WHEN company_id IS NULL THEN 1 END) AS sin_compania
FROM users
GROUP BY 
    CASE 
        WHEN 'super_user' = ANY(roles) THEN 'super_user'
        WHEN 'admin' = ANY(roles) THEN 'admin'
        ELSE 'user'
    END
ORDER BY tipo_usuario;
