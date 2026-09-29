-- GuindaVerify · MARCHA ATRÁS de 2026-09-29-cerrar-rls.sql
-- Deja la BD exactamente como estaba antes (políticas y permisos capturados del estado real el 2026-09-29).
-- ⚠️ Esto vuelve a abrir la BD a la anon key. Solo para emergencias.

BEGIN;

CREATE POLICY "Acciones escritura autenticada" ON public.acciones_tareas AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Acciones lectura pública" ON public.acciones_tareas AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Auth admin escritura pública" ON public.auth_admin AS PERMISSIVE FOR ALL TO public USING (true);
CREATE POLICY "Auth admin lectura pública" ON public.auth_admin AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Clientes acceso completo" ON public.clientes AS PERMISSIVE FOR ALL TO public USING (true);
CREATE POLICY "Comentarios escritura autenticada" ON public.comentarios AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Comentarios lectura pública" ON public.comentarios AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Configuración acceso total" ON public.configuracion_sistema AS PERMISSIVE FOR ALL TO public USING (true);
CREATE POLICY "Logs actividad escritura pública" ON public.logs_actividad AS PERMISSIVE FOR ALL TO public USING (true);
CREATE POLICY "Logs actividad lectura pública" ON public.logs_actividad AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Usuarios clientes escritura pública" ON public.usuarios_clientes AS PERMISSIVE FOR ALL TO public USING (true);
CREATE POLICY "Usuarios clientes lectura pública" ON public.usuarios_clientes AS PERMISSIVE FOR SELECT TO public USING (true);

GRANT ALL ON public.acciones_tareas, public.auth_admin, public.clientes, public.comentarios, public.configuracion_sistema, public.logs_actividad, public.notificaciones_pendientes, public.snapshots_publicaciones, public.usuarios_clientes, public.vista_logs_completa TO anon, authenticated;

ALTER TABLE public.notificaciones_pendientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots_publicaciones DISABLE ROW LEVEL SECURITY;

ALTER VIEW public.vista_logs_completa RESET (security_invoker);

GRANT EXECUTE ON FUNCTION public.crear_log_actividad(uuid, uuid, varchar, text, varchar, uuid, uuid, inet, text) TO PUBLIC, anon, authenticated;

COMMIT;
