-- Script para implementar sistema de múltiples usuarios por cliente
-- Ejecutar en Supabase SQL Editor

-- 1. Tabla de usuarios de clientes
CREATE TABLE IF NOT EXISTS usuarios_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT true,
  es_admin_cliente BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para username único por cliente
  UNIQUE(cliente_id, username)
);

-- 2. Tabla de logs de actividad
CREATE TABLE IF NOT EXISTS logs_actividad (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios_clientes(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  accion VARCHAR(100) NOT NULL,
  detalles TEXT,
  tarea_id VARCHAR(255),
  comentario_id UUID REFERENCES comentarios(id) ON DELETE SET NULL,
  accion_tarea_id UUID REFERENCES acciones_tareas(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_clientes_cliente_id ON usuarios_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_clientes_username ON usuarios_clientes(cliente_id, username);
CREATE INDEX IF NOT EXISTS idx_usuarios_clientes_activo ON usuarios_clientes(activo);

CREATE INDEX IF NOT EXISTS idx_logs_usuario_id ON logs_actividad(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_cliente_id ON logs_actividad(cliente_id);
CREATE INDEX IF NOT EXISTS idx_logs_fecha ON logs_actividad(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_logs_accion ON logs_actividad(accion);
CREATE INDEX IF NOT EXISTS idx_logs_tarea_id ON logs_actividad(tarea_id);

-- 4. Triggers para updated_at
CREATE TRIGGER update_usuarios_clientes_updated_at 
    BEFORE UPDATE ON usuarios_clientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Habilitar RLS
ALTER TABLE usuarios_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_actividad ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de seguridad
CREATE POLICY "Usuarios clientes lectura pública" ON usuarios_clientes
    FOR SELECT USING (true);

CREATE POLICY "Usuarios clientes escritura autenticada" ON usuarios_clientes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Logs actividad lectura pública" ON logs_actividad
    FOR SELECT USING (true);

CREATE POLICY "Logs actividad escritura autenticada" ON logs_actividad
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Agregar campo usuario_id a tablas existentes para trazabilidad
ALTER TABLE comentarios ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios_clientes(id) ON DELETE SET NULL;
ALTER TABLE acciones_tareas ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios_clientes(id) ON DELETE SET NULL;

-- 8. Comentarios para documentación
COMMENT ON TABLE usuarios_clientes IS 'Usuarios individuales por cliente con autenticación propia';
COMMENT ON TABLE logs_actividad IS 'Log completo de todas las actividades realizadas por los usuarios';

COMMENT ON COLUMN usuarios_clientes.username IS 'Nombre de usuario único dentro del cliente';
COMMENT ON COLUMN usuarios_clientes.es_admin_cliente IS 'Si es administrador del cliente (puede gestionar otros usuarios)';
COMMENT ON COLUMN logs_actividad.accion IS 'Tipo de acción: login, logout, comentar, aprobar, rechazar, etc.';
COMMENT ON COLUMN logs_actividad.detalles IS 'Detalles adicionales de la acción en formato JSON';

-- 9. Función para crear log de actividad automáticamente
CREATE OR REPLACE FUNCTION crear_log_actividad(
  p_usuario_id UUID,
  p_cliente_id UUID,
  p_accion VARCHAR(100),
  p_detalles TEXT DEFAULT NULL,
  p_tarea_id VARCHAR(255) DEFAULT NULL,
  p_comentario_id UUID DEFAULT NULL,
  p_accion_tarea_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO logs_actividad (
    usuario_id, cliente_id, accion, detalles, tarea_id, 
    comentario_id, accion_tarea_id, ip_address, user_agent
  ) VALUES (
    p_usuario_id, p_cliente_id, p_accion, p_detalles, p_tarea_id,
    p_comentario_id, p_accion_tarea_id, p_ip_address, p_user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Vista para logs con información completa
CREATE OR REPLACE VIEW vista_logs_completa AS
SELECT 
  l.id,
  l.fecha,
  l.accion,
  l.detalles,
  l.tarea_id,
  u.nombre as usuario_nombre,
  u.username as usuario_username,
  c.nombre as cliente_nombre,
  c.codigo as cliente_codigo,
  l.ip_address,
  l.user_agent
FROM logs_actividad l
LEFT JOIN usuarios_clientes u ON l.usuario_id = u.id
LEFT JOIN clientes c ON l.cliente_id = c.id
ORDER BY l.fecha DESC;

COMMENT ON VIEW vista_logs_completa IS 'Vista completa de logs con información de usuario y cliente';
