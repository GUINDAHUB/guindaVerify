-- Script para agregar campo logo_url a la tabla clientes
-- Ejecuta este script en el SQL Editor de Supabase

-- Agregar campo logo_url a la tabla clientes
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Comentario explicativo
COMMENT ON COLUMN clientes.logo_url IS 'URL del logo del cliente para mostrar en el portal personalizado';

-- Verificar que el campo se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clientes' AND column_name = 'logo_url';
