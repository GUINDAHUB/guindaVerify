-- Script para agregar autenticación a la base de datos existente
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Crear tabla de autenticación de administradores (solo si no existe)
CREATE TABLE IF NOT EXISTS auth_admin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Agregar campo de contraseña a clientes (solo si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clientes' AND column_name = 'password_hash') THEN
        ALTER TABLE clientes ADD COLUMN password_hash VARCHAR(255);
    END IF;
END $$;

-- 3. Crear trigger para auth_admin (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_auth_admin_updated_at') THEN
        CREATE TRIGGER update_auth_admin_updated_at 
            BEFORE UPDATE ON auth_admin 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 4. Habilitar RLS para auth_admin (solo si no está habilitado)
ALTER TABLE auth_admin ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas para auth_admin (DROP e CREATE para sobrescribir)
DROP POLICY IF EXISTS "Auth admin lectura pública" ON auth_admin;
DROP POLICY IF EXISTS "Auth admin escritura pública" ON auth_admin;

CREATE POLICY "Auth admin lectura pública" ON auth_admin
    FOR SELECT USING (true);

CREATE POLICY "Auth admin escritura pública" ON auth_admin
    FOR ALL USING (true);

-- 6. Insertar contraseña por defecto para administradores (contraseña: "admin123")
-- Solo si no existe ya un registro
INSERT INTO auth_admin (id, password_hash) 
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '$2b$10$emtPXVzlPGz9Sw2J6YtBge6.n7.2HB7yoeLiSwiPjrzqMv2N3FYbW'
)
ON CONFLICT (id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- 7. Verificar que todo se creó correctamente
SELECT 'Tabla auth_admin creada correctamente' as mensaje
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auth_admin');

SELECT 'Campo password_hash agregado a clientes' as mensaje
WHERE EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'clientes' AND column_name = 'password_hash');

SELECT 'Contraseña de admin configurada' as mensaje
WHERE EXISTS (SELECT 1 FROM auth_admin WHERE id = '00000000-0000-0000-0000-000000000000');

-- 8. Mostrar el hash de la contraseña para verificar
SELECT 'Contraseña admin hash:', password_hash 
FROM auth_admin 
WHERE id = '00000000-0000-0000-0000-000000000000';
