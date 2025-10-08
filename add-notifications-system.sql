-- Sistema de Notificaciones Agrupadas - GuindaVerify
-- Ejecuta este script en el SQL Editor de Supabase

-- Tabla para rastrear notificaciones pendientes
CREATE TABLE IF NOT EXISTS notificaciones_pendientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  tarea_id VARCHAR(255) NOT NULL,
  tipo_notificacion VARCHAR(50) NOT NULL CHECK (tipo_notificacion IN (
    'nueva_publicacion',
    'cambios_implementados', 
    'publicacion_actualizada'
  )),
  datos_publicacion JSONB NOT NULL,
  procesada BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla para rastrear el último estado conocido de publicaciones por cliente
CREATE TABLE IF NOT EXISTS snapshots_publicaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  tarea_ids TEXT[] NOT NULL, -- Array de IDs de tareas en estado "pendiente de revisión"
  last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para un snapshot por cliente
  UNIQUE(cliente_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_notificaciones_cliente_tipo ON notificaciones_pendientes(cliente_id, tipo_notificacion);
CREATE INDEX IF NOT EXISTS idx_notificaciones_procesada ON notificaciones_pendientes(procesada, created_at);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON notificaciones_pendientes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_cliente ON snapshots_publicaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_last_check ON snapshots_publicaciones(last_check);

-- Comentarios para documentar las tablas
COMMENT ON TABLE notificaciones_pendientes IS 'Cola de notificaciones pendientes de envío agrupado';
COMMENT ON COLUMN notificaciones_pendientes.tipo_notificacion IS 'Tipo de notificación: nueva_publicacion, cambios_implementados, etc.';
COMMENT ON COLUMN notificaciones_pendientes.datos_publicacion IS 'JSON con datos de la publicación (título, fecha, estado, etc.)';
COMMENT ON COLUMN notificaciones_pendientes.procesada IS 'Indica si la notificación ya fue enviada por email';

COMMENT ON TABLE snapshots_publicaciones IS 'Último estado conocido de publicaciones por cliente para detectar cambios';
COMMENT ON COLUMN snapshots_publicaciones.tarea_ids IS 'Array de IDs de tareas que estaban en "pendiente de revisión" en el último check';
