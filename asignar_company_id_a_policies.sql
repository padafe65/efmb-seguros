-- Script para asignar company_id a las pólizas en la tabla policies
-- Basado en el company_id del usuario propietario de cada póliza

-- ============================================
-- 1. VERIFICACIÓN PREVIA
-- ============================================
-- Ver cuántas pólizas tienen company_id NULL y cuántas ya tienen asignado
SELECT 
    COUNT(*) AS total_policies,
    COUNT(CASE WHEN company_id IS NULL THEN 1 END) AS sin_company_id,
    COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) AS con_company_id,
    COUNT(CASE WHEN company_id = 1 THEN 1 END) AS con_efmb_seguros
FROM policies;

-- Ver pólizas que necesitan company_id asignado
SELECT 
    p.id_policy,
    p.policy_number,
    p.tipo_poliza,
    p.user_id,
    u.user_name,
    u.email,
    u.company_id AS user_company_id,
    p.company_id AS policy_company_id,
    CASE 
        WHEN u.company_id IS NULL THEN '⚠️ Usuario sin compañía'
        WHEN p.company_id IS NULL THEN '📝 Necesita asignación'
        ELSE '✅ Ya asignada'
    END AS estado
FROM policies p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.company_id IS NULL
ORDER BY p.id_policy;

-- ============================================
-- 2. ACTUALIZACIÓN DE PÓLIZAS
-- ============================================
-- Opción A: Asignar company_id basado en el company_id del usuario propietario
-- Si el usuario tiene company_id, usar ese. Si no, usar company_id = 1 (EFMB Seguros)
UPDATE policies p
SET company_id = COALESCE(
    (SELECT company_id FROM users WHERE id = p.user_id),
    1  -- Si el usuario no tiene company_id, asignar EFMB Seguros (id = 1)
)
WHERE p.company_id IS NULL;

-- ============================================
-- 3. VERIFICACIÓN POSTERIOR
-- ============================================
-- Verificar los resultados después de la actualización
SELECT 
    p.id_policy,
    p.policy_number,
    p.tipo_poliza,
    u.user_name AS usuario,
    u.company_id AS user_company_id,
    p.company_id AS policy_company_id,
    CASE 
        WHEN p.company_id = u.company_id THEN '✅ Coincide con usuario'
        WHEN p.company_id = 1 AND u.company_id IS NULL THEN '✅ Asignada por defecto (EFMB Seguros)'
        WHEN p.company_id IS NULL THEN '⚠️ Sin compañía asignada'
        ELSE 'ℹ️ Asignada manualmente'
    END AS estado
FROM policies p
LEFT JOIN users u ON p.user_id = u.id
ORDER BY p.id_policy;

-- ============================================
-- 4. RESUMEN ESTADÍSTICO
-- ============================================
-- Contar pólizas por compañía
SELECT 
    COALESCE(c.nombre, 'Sin compañía') AS compania,
    COUNT(p.id_policy) AS total_policies,
    COUNT(DISTINCT p.user_id) AS usuarios_unicos
FROM policies p
LEFT JOIN companies c ON p.company_id = c.id
GROUP BY c.id, c.nombre
ORDER BY total_policies DESC;

-- Resumen por estado
SELECT 
    CASE 
        WHEN p.company_id IS NULL THEN 'Sin compañía asignada'
        WHEN p.company_id = 1 THEN 'EFMB Seguros'
        ELSE 'Otra compañía'
    END AS estado,
    COUNT(*) AS total_policies,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM policies), 2) AS porcentaje
FROM policies p
GROUP BY 
    CASE 
        WHEN p.company_id IS NULL THEN 'Sin compañía asignada'
        WHEN p.company_id = 1 THEN 'EFMB Seguros'
        ELSE 'Otra compañía'
    END
ORDER BY total_policies DESC;

-- ============================================
-- 5. VERIFICACIÓN DE INTEGRIDAD
-- ============================================
-- Verificar que todas las pólizas tengan company_id asignado
SELECT 
    CASE 
        WHEN COUNT(CASE WHEN company_id IS NULL THEN 1 END) = 0 
        THEN '✅ Todas las pólizas tienen company_id asignado'
        ELSE CONCAT('⚠️ Aún hay ', COUNT(CASE WHEN company_id IS NULL THEN 1 END), ' pólizas sin company_id')
    END AS resultado_verificacion
FROM policies;

-- Verificar pólizas de usuarios que no tienen company_id
-- (Estas pólizas deberían tener company_id = 1 después del script)
SELECT 
    p.id_policy,
    p.policy_number,
    u.user_name,
    u.company_id AS user_company_id,
    p.company_id AS policy_company_id
FROM policies p
INNER JOIN users u ON p.user_id = u.id
WHERE u.company_id IS NULL
ORDER BY p.id_policy;
