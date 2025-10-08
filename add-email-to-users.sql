-- Agregar campo email a la tabla usuarios_clientes
-- Ejecuta este script en el SQL Editor de Supabase

-- Agregar campo email a usuarios_clientes
ALTER TABLE usuarios_clientes 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN usuarios_clientes.email IS 'Email del usuario para notificaciones (opcional)';

-- Crear índice para búsquedas por email (opcional pero recomendado)
CREATE INDEX IF NOT EXISTS idx_usuarios_clientes_email ON usuarios_clientes(email) WHERE email IS NOT NULL;
