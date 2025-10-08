-- Agregar configuración SMTP a la tabla configuracion_sistema
-- Ejecuta este script en el SQL Editor de Supabase

-- Agregar campos SMTP a la tabla de configuración
ALTER TABLE configuracion_sistema 
ADD COLUMN IF NOT EXISTS smtp_host VARCHAR(255),
ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587,
ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS smtp_user VARCHAR(255),
ADD COLUMN IF NOT EXISTS smtp_pass VARCHAR(255),
ADD COLUMN IF NOT EXISTS smtp_from_name VARCHAR(255) DEFAULT 'GuindaVerify',
ADD COLUMN IF NOT EXISTS smtp_from_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS smtp_enabled BOOLEAN DEFAULT false;

-- Comentarios para documentar los campos
COMMENT ON COLUMN configuracion_sistema.smtp_host IS 'Servidor SMTP (ej: smtp.gmail.com)';
COMMENT ON COLUMN configuracion_sistema.smtp_port IS 'Puerto SMTP (587 para TLS, 465 para SSL)';
COMMENT ON COLUMN configuracion_sistema.smtp_secure IS 'true para SSL (puerto 465), false para TLS (puerto 587)';
COMMENT ON COLUMN configuracion_sistema.smtp_user IS 'Usuario/email para autenticación SMTP';
COMMENT ON COLUMN configuracion_sistema.smtp_pass IS 'Contraseña o app password para SMTP';
COMMENT ON COLUMN configuracion_sistema.smtp_from_name IS 'Nombre que aparecerá como remitente';
COMMENT ON COLUMN configuracion_sistema.smtp_from_email IS 'Email que aparecerá como remitente';
COMMENT ON COLUMN configuracion_sistema.smtp_enabled IS 'Habilitar/deshabilitar envío de emails';

