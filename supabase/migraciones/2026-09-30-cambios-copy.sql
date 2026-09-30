-- GuindaVerify · Cambios de copy vs. visuales
-- Fecha: 2026-09-30
-- Solo añade columnas/constraints; compatible con el código anterior.

BEGIN;

-- Estado de ClickUp al que va una petición de "cambios de copy".
-- NULL = el cliente no tiene esta función: "Hay cambios" funciona como siempre.
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS estado_cambios_copy VARCHAR(255);
COMMENT ON COLUMN public.clientes.estado_cambios_copy IS 'Estado de ClickUp para cambios de copy (opcional). estados_rechazo = cambios visuales';

-- acciones_tareas: admitir 'hay_cambios' (antes el CHECK lo rechazaba y no se guardaba nada)
-- y guardar el tipo de cambio pedido
ALTER TABLE public.acciones_tareas DROP CONSTRAINT IF EXISTS acciones_tareas_accion_check;
ALTER TABLE public.acciones_tareas ADD CONSTRAINT acciones_tareas_accion_check
  CHECK (accion IN ('aprobar', 'hay_cambios', 'rechazar', 'comentar'));

ALTER TABLE public.acciones_tareas ADD COLUMN IF NOT EXISTS tipo_cambio VARCHAR(10);
ALTER TABLE public.acciones_tareas DROP CONSTRAINT IF EXISTS acciones_tareas_tipo_cambio_check;
ALTER TABLE public.acciones_tareas ADD CONSTRAINT acciones_tareas_tipo_cambio_check
  CHECK (tipo_cambio IS NULL OR tipo_cambio IN ('copy', 'visual', 'ambos'));

CREATE INDEX IF NOT EXISTS idx_acciones_cliente_tarea_fecha
  ON public.acciones_tareas (cliente_id, tarea_id, fecha_accion DESC);

COMMIT;
