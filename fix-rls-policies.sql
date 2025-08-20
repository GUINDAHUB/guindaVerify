-- Script para arreglar las políticas RLS que están bloqueando la creación de usuarios
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar las políticas restrictivas actuales
DROP POLICY IF EXISTS "Usuarios clientes escritura autenticada" ON usuarios_clientes;
DROP POLICY IF EXISTS "Logs actividad escritura autenticada" ON logs_actividad;

-- 2. Crear políticas más permisivas para desarrollo
-- Estas políticas permiten operaciones desde la aplicación usando service role

-- Política para usuarios_clientes - permitir todas las operaciones
CREATE POLICY "Usuarios clientes escritura pública" ON usuarios_clientes
    FOR ALL USING (true);

-- Política para logs_actividad - permitir todas las operaciones  
CREATE POLICY "Logs actividad escritura pública" ON logs_actividad
    FOR ALL USING (true);

-- 3. Verificar que RLS sigue habilitado pero con políticas permisivas
-- (Las políticas de lectura ya existían y funcionan bien)

-- Opcional: Si quieres ser más restrictivo en producción, puedes usar estas políticas alternativas:
/*
-- Políticas más restrictivas (comentadas por ahora):

DROP POLICY IF EXISTS "Usuarios clientes escritura pública" ON usuarios_clientes;
DROP POLICY IF EXISTS "Logs actividad escritura pública" ON logs_actividad;

-- Solo permitir operaciones con service role key o authenticated users
CREATE POLICY "Usuarios clientes escritura service" ON usuarios_clientes
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role' OR 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Logs actividad escritura service" ON logs_actividad
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role' OR 
        auth.role() = 'authenticated'
    );
*/
