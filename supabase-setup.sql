-- GuindaVerify - Configuración de Base de Datos Supabase
-- Ejecuta este script en el SQL Editor de Supabase

-- Habilitar la extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  clickup_list_id VARCHAR(255) NOT NULL,
  estados_visibles TEXT[] DEFAULT '{}',
  estados_aprobacion TEXT[] DEFAULT '{}',
  estados_rechazo TEXT[] DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tarea_id VARCHAR(255) NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  autor_nombre VARCHAR(255),
  autor_email VARCHAR(255)
);

-- Tabla de acciones de tareas
CREATE TABLE IF NOT EXISTS acciones_tareas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tarea_id VARCHAR(255) NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  accion VARCHAR(50) NOT NULL CHECK (accion IN ('aprobar', 'rechazar', 'comentar')),
  comentario TEXT,
  fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS configuracion_sistema (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clickup_api_key VARCHAR(255),
  clickup_workspace_id VARCHAR(255),
  estados_por_defecto JSONB DEFAULT '{
    "pendiente_revision": "Pendiente de Revisión",
    "aprobado": "Aprobado",
    "rechazado": "Rechazado"
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de autenticación para administradores
CREATE TABLE IF NOT EXISTS auth_admin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar campo de contraseña a la tabla de clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_codigo ON clientes(codigo);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);
CREATE INDEX IF NOT EXISTS idx_comentarios_tarea_id ON comentarios(tarea_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_cliente_id ON comentarios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_acciones_tarea_id ON acciones_tareas(tarea_id);
CREATE INDEX IF NOT EXISTS idx_acciones_cliente_id ON acciones_tareas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_acciones_fecha ON acciones_tareas(fecha_accion);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON clientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracion_sistema_updated_at 
    BEFORE UPDATE ON configuracion_sistema 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_admin_updated_at 
    BEFORE UPDATE ON auth_admin 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE acciones_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_admin ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes (lectura pública, escritura solo para autenticados)
CREATE POLICY "Clientes lectura pública" ON clientes
    FOR SELECT USING (true);

CREATE POLICY "Clientes escritura autenticada" ON clientes
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para comentarios
CREATE POLICY "Comentarios lectura pública" ON comentarios
    FOR SELECT USING (true);

CREATE POLICY "Comentarios escritura autenticada" ON comentarios
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para acciones de tareas
CREATE POLICY "Acciones lectura pública" ON acciones_tareas
    FOR SELECT USING (true);

CREATE POLICY "Acciones escritura autenticada" ON acciones_tareas
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para configuración del sistema (lectura y escritura públicas para desarrollo)
CREATE POLICY "Configuración lectura pública" ON configuracion_sistema
    FOR SELECT USING (true);

CREATE POLICY "Configuración escritura pública" ON configuracion_sistema
    FOR ALL USING (true);

-- Políticas para autenticación de administradores (lectura y escritura públicas para la aplicación)
CREATE POLICY "Auth admin lectura pública" ON auth_admin
    FOR SELECT USING (true);

CREATE POLICY "Auth admin escritura pública" ON auth_admin
    FOR ALL USING (true);

-- Datos de ejemplo (opcional)
-- Descomenta las siguientes líneas si quieres insertar datos de prueba

/*
-- Insertar configuración por defecto
INSERT INTO configuracion_sistema (clickup_api_key, clickup_workspace_id) 
VALUES ('tu_api_key_aqui', 'tu_workspace_id_aqui')
ON CONFLICT DO NOTHING;

-- Insertar cliente de ejemplo
INSERT INTO clientes (
  codigo,
  nombre,
  email,
  clickup_list_id,
  estados_visibles,
  estados_aprobacion,
  estados_rechazo
) VALUES (
  'cliente-ejemplo',
  'Cliente Ejemplo',
  'cliente@ejemplo.com',
  '123456789',
  ARRAY['Pendiente de Revisión'],
  ARRAY['Aprobado'],
  ARRAY['Rechazado']
) ON CONFLICT (codigo) DO NOTHING;
*/

-- Crear configuración inicial vacía (requerido para que funcione el sistema)
-- Usar UPSERT para asegurar que siempre haya al menos una fila
INSERT INTO configuracion_sistema (id, clickup_api_key, clickup_workspace_id, estados_por_defecto) 
VALUES (
  '00000000-0000-0000-0000-000000000000',
  NULL, 
  NULL,
  '{
    "pendiente_revision": "Pendiente de Revisión",
    "aprobado": "Aprobado",
    "rechazado": "Rechazado"
  }'
) 
ON CONFLICT (id) DO UPDATE SET
  clickup_api_key = EXCLUDED.clickup_api_key,
  clickup_workspace_id = EXCLUDED.clickup_workspace_id,
  estados_por_defecto = EXCLUDED.estados_por_defecto,
  updated_at = NOW();

-- Comentarios sobre la configuración
COMMENT ON TABLE clientes IS 'Tabla principal de clientes con configuración de ClickUp';
COMMENT ON TABLE comentarios IS 'Comentarios de los clientes sobre las tareas';
COMMENT ON TABLE acciones_tareas IS 'Registro de acciones realizadas por los clientes';
COMMENT ON TABLE configuracion_sistema IS 'Configuración global del sistema';

COMMENT ON COLUMN clientes.codigo IS 'Código único para la URL del portal del cliente';
COMMENT ON COLUMN clientes.clickup_list_id IS 'ID de la lista de ClickUp asociada al cliente';
COMMENT ON COLUMN clientes.estados_visibles IS 'Estados de ClickUp que aparecen en el portal';
COMMENT ON COLUMN clientes.estados_aprobacion IS 'Estados a los que se mueve al aprobar';
COMMENT ON COLUMN clientes.estados_rechazo IS 'Estados a los que se mueve al rechazar';
COMMENT ON COLUMN clientes.password_hash IS 'Hash de la contraseña para acceso al portal del cliente';

-- Agregar columna para estado "Sin Empezar"
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS clickup_status_not_started VARCHAR(255);
COMMENT ON COLUMN clientes.clickup_status_not_started IS 'Estado de ClickUp para publicaciones sin empezar (visible en calendario, opcional en kanban)';

-- Insertar contraseña por defecto para administradores (contraseña: "admin123")
-- Cambiar esta contraseña después de la primera configuración
INSERT INTO auth_admin (password_hash) 
VALUES ('$2a$10$K5Z3z7VqZX2/9E8QQzX7U.FoVl9QiQYi4QHQ4d/Kv8QZR6d8Kv8QK')
ON CONFLICT DO NOTHING; 