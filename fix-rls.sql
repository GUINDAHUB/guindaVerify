-- Script para arreglar las políticas RLS de la tabla clientes
-- Ejecuta este script en el SQL Editor de Supabase

-- Deshabilitar RLS temporalmente
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Clientes lectura pública" ON clientes;
DROP POLICY IF EXISTS "Clientes escritura autenticada" ON clientes;

-- Crear políticas más permisivas para desarrollo
CREATE POLICY "Clientes acceso completo" ON clientes
    FOR ALL USING (true);

-- Rehabilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Verificar que las políticas se aplicaron correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clientes'; 