-- Script para solucionar problemas de configuración
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Deshabilitar RLS temporalmente para la tabla de configuración
ALTER TABLE configuracion_sistema DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes que puedan causar conflictos
DROP POLICY IF EXISTS "Configuración solo autenticados" ON configuracion_sistema;
DROP POLICY IF EXISTS "Configuración lectura pública" ON configuracion_sistema;
DROP POLICY IF EXISTS "Configuración escritura pública" ON configuracion_sistema;

-- 3. Limpiar la tabla de configuración
DELETE FROM configuracion_sistema;

-- 4. Crear configuración inicial
INSERT INTO configuracion_sistema (
  id, 
  clickup_api_key, 
  clickup_workspace_id, 
  estados_por_defecto,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  NULL,
  NULL,
  '{
    "pendiente_revision": "Pendiente de Revisión",
    "aprobado": "Aprobado",
    "rechazado": "Rechazado"
  }',
  NOW(),
  NOW()
);

-- 5. Crear políticas más permisivas para desarrollo
CREATE POLICY "Configuración acceso total" ON configuracion_sistema
    FOR ALL USING (true);

-- 6. Habilitar RLS nuevamente
ALTER TABLE configuracion_sistema ENABLE ROW LEVEL SECURITY;

-- Verificar que se creó correctamente
SELECT * FROM configuracion_sistema; 