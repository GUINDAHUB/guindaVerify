-- Script de migración para convertir clientes existentes al sistema multi-usuario
-- Este script migra las contraseñas existentes de clientes a usuarios individuales

-- IMPORTANTE: Ejecutar este script DESPUÉS de multi-user-system.sql

-- 1. Crear usuarios predeterminados para clientes existentes que tengan contraseña
INSERT INTO usuarios_clientes (cliente_id, nombre, username, password_hash, es_admin_cliente, activo)
SELECT 
  id as cliente_id,
  COALESCE(nombre, 'Usuario Principal') as nombre,
  'admin' as username,
  password_hash,
  true as es_admin_cliente,
  true as activo
FROM clientes 
WHERE password_hash IS NOT NULL 
  AND password_hash != ''
  AND activo = true
ON CONFLICT (cliente_id, username) DO NOTHING;

-- 2. Crear log de migración
INSERT INTO logs_actividad (cliente_id, accion, detalles)
SELECT 
  id as cliente_id,
  'migracion_sistema' as accion,
  'Usuario principal creado automáticamente durante migración a sistema multi-usuario' as detalles
FROM clientes 
WHERE password_hash IS NOT NULL 
  AND password_hash != ''
  AND activo = true;

-- 3. Actualizar comentarios existentes para asociarlos con el usuario principal
UPDATE comentarios 
SET usuario_id = (
  SELECT uc.id 
  FROM usuarios_clientes uc 
  WHERE uc.cliente_id = comentarios.cliente_id 
    AND uc.username = 'admin' 
  LIMIT 1
)
WHERE usuario_id IS NULL 
  AND cliente_id IS NOT NULL;

-- 4. Actualizar acciones_tareas existentes para asociarlas con el usuario principal  
UPDATE acciones_tareas 
SET usuario_id = (
  SELECT uc.id 
  FROM usuarios_clientes uc 
  WHERE uc.cliente_id = acciones_tareas.cliente_id 
    AND uc.username = 'admin' 
  LIMIT 1
)
WHERE usuario_id IS NULL 
  AND cliente_id IS NOT NULL;

-- 5. Opcional: Limpiar contraseñas de la tabla clientes (ya no las necesitamos)
-- DESCOMENTA LA SIGUIENTE LÍNEA SI QUIERES ELIMINAR LAS CONTRASEÑAS ANTIGUAS:
-- UPDATE clientes SET password_hash = NULL WHERE password_hash IS NOT NULL;

-- Verificación de la migración
SELECT 
  c.codigo,
  c.nombre as cliente_nombre,
  COUNT(uc.id) as usuarios_creados
FROM clientes c
LEFT JOIN usuarios_clientes uc ON c.id = uc.cliente_id
GROUP BY c.id, c.codigo, c.nombre
ORDER BY c.codigo;
