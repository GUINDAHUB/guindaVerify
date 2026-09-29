-- GuindaVerify · Cierre de la base de datos al rol público (anon/authenticated)
-- Fecha: 2026-09-29
--
-- Requisito: la app ya usa SUPABASE_SERVICE_ROLE_KEY en el servidor (src/lib/supabase.ts).
-- service_role ignora RLS, así que la app sigue funcionando; la anon key deja de tener acceso a nada.
-- Marcha atrás: 2026-09-29-cerrar-rls.ROLLBACK.sql

BEGIN;

-- 1. Quitar las políticas que abrían las tablas a cualquiera
DROP POLICY IF EXISTS "Acciones escritura autenticada" ON public.acciones_tareas;
DROP POLICY IF EXISTS "Acciones lectura pública" ON public.acciones_tareas;
DROP POLICY IF EXISTS "Auth admin escritura pública" ON public.auth_admin;
DROP POLICY IF EXISTS "Auth admin lectura pública" ON public.auth_admin;
DROP POLICY IF EXISTS "Clientes acceso completo" ON public.clientes;
DROP POLICY IF EXISTS "Comentarios escritura autenticada" ON public.comentarios;
DROP POLICY IF EXISTS "Comentarios lectura pública" ON public.comentarios;
DROP POLICY IF EXISTS "Configuración acceso total" ON public.configuracion_sistema;
DROP POLICY IF EXISTS "Logs actividad escritura pública" ON public.logs_actividad;
DROP POLICY IF EXISTS "Logs actividad lectura pública" ON public.logs_actividad;
DROP POLICY IF EXISTS "Usuarios clientes escritura pública" ON public.usuarios_clientes;
DROP POLICY IF EXISTS "Usuarios clientes lectura pública" ON public.usuarios_clientes;

-- 2. RLS activado en todas las tablas y sin políticas = denegado para anon/authenticated
ALTER TABLE public.acciones_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_actividad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_pendientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots_publicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_clientes ENABLE ROW LEVEL SECURITY;

-- 3. Retirar permisos a nivel de tabla (defensa adicional, y cubre la vista, que no tiene RLS)
REVOKE ALL ON public.acciones_tareas, public.auth_admin, public.clientes, public.comentarios, public.configuracion_sistema, public.logs_actividad, public.notificaciones_pendientes, public.snapshots_publicaciones, public.usuarios_clientes, public.vista_logs_completa FROM anon, authenticated;

-- 4. La vista aplica los permisos de quien consulta, no los del propietario
ALTER VIEW public.vista_logs_completa SET (security_invoker = true);

-- 5. La función de logs solo para el servidor
REVOKE EXECUTE ON FUNCTION public.crear_log_actividad(uuid, uuid, varchar, text, varchar, uuid, uuid, inet, text) FROM PUBLIC, anon, authenticated;

COMMIT;
