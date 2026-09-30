# GuindaVerify — contexto para Claude

App **interna de producción** de la agencia Guinda: portal donde cada cliente revisa las publicaciones de redes sociales que el equipo prepara en ClickUp, y las **aprueba** o **pide cambios**. El panel admin (equipo Guinda) da de alta clientes y los enlaza a una lista de ClickUp.

> ⚠️ Hay un `SAAS-PLAN.md` en la raíz: es el plan para convertir esto en SaaS multi-tenant **en otro repo y otra Supabase**. **No aplica a este repo.** Aquí solo se hacen mejoras visuales/funcionales sobre lo que ya usa la agencia.

## Despliegue e infraestructura

| Qué | Dónde |
|---|---|
| Repo | `github.com/GUINDAHUB/guindaVerify` — rama `main` |
| Hosting | Vercel, proyecto `guinda-verify` (cuenta personal "javier-montero-martinezs-projects"), plan Hobby, Node 22 |
| Dominio prod | https://verify.somosguinda.com (alias `guinda-verify.vercel.app`) |
| Deploy | Integración Git: **push a `main` = deploy a producción**. No hay staging. |
| BD | Supabase proyecto `GuindaVerify`, ref `iswoztcvibdqnyqrzisg` (eu-west-1) |
| Proyecto Vercel `guinda-verify-v0` | Antiguo, no es el de producción |

Variables de entorno (Vercel y `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`: clave **secreta** de Supabase (`sb_secret_…`), solo en el servidor. Nunca con prefijo `NEXT_PUBLIC_`.
- `SESSION_SECRET`: firma las cookies de sesión (JWT HS256, mínimo 32 caracteres). Si se cambia, se cierran todas las sesiones.
- `NEXT_PUBLIC_APP_URL`: se usa en los links de los emails.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: ya no la usa el código (la BD está cerrada a anon). `CRON_SECRET`: definida pero no se usa. La API key de ClickUp y el SMTP **no** están en env: se guardan en la tabla `configuracion_sistema` y se editan desde `/admin/configuracion`.

## Stack

Next.js 16 (App Router, Turbopack en dev) · React 19 · TypeScript · Tailwind v4 (`@tailwindcss/postcss`) · shadcn/ui (new-york) + Radix · lucide-react · sonner · Supabase JS (solo anon key) · axios contra la API v2 de ClickUp · nodemailer · bcryptjs.

```bash
npm run dev      # localhost:3000
npm run build    # ignora errores de TS y ESLint (next.config.ts)
npx tsc --noEmit # ~26 errores preexistentes (request.ip eliminado en Next 15, tipos de .next obsoletos)
```

No hay tests. Verifica los cambios arrancando la app y probándolos en el navegador.

## Arquitectura

```
src/
  app/
    page.tsx                         Landing: logo que enlaza a /admin
    admin/                           Panel del equipo Guinda
      page.tsx + client.tsx          Clientes y sus usuarios (CRUD), selector de lista/estados de ClickUp
      configuracion/                 API key ClickUp, workspace, SMTP, estado de conexiones
      logs/                          Auditoría (vista_logs_completa), exportación CSV
      login/
    cliente/[codigo]/                Portal del cliente (codigo = slug de la tabla clientes)
      page.tsx + client.tsx          2.200 líneas: Kanban + Calendario (desktop y móvil), filtros, drag & drop de fechas
      login/                         Login solo con contraseña
    api/
      admin/...                      CRUD clientes/usuarios, config, status, test-email, check-review-publications
      cliente/[codigo]/...           publicaciones, acciones, actualizar-fecha, refresh-task, comentarios/[tareaId]
      cliente/auth/...               login, logout, me
  components/                        admin-layout, comentarios-modal, publicacion-detail-modal, wiki-modal,
                                     simple-password-login, login-form; ui/ = primitivas shadcn
  lib/
    supabase.ts                      Cliente Supabase + SupabaseService (clientes, comentarios, acciones, config). Mapea snake_case ↔ camelCase
    clickup.ts                       ClickUpService: lectura de tareas y comentarios, cambio de estado, fecha; convertToTareaPublicacion()
    auth.ts                          bcrypt, cookies de sesión, usuarios de cliente, logActivity()
    notifications.ts                 Detecta publicaciones nuevas "en revisión" (snapshots) y manda emails agrupados
    email.ts                         Singleton nodemailer; config SMTP leída de la BD
  types/index.ts                     Cliente, TareaPublicacion, ClickUpTask, etc.
```

No hay `middleware.ts`/`proxy.ts`. La protección de las páginas se hace en cada `page.tsx` (server), y la de las APIs en cada ruta, **de forma incompleta** (ver Seguridad).

### Flujo principal

1. **ClickUp es la fuente de verdad** de las publicaciones. No se guardan en Supabase; cada carga del portal llama a `GET /list/{clickup_list_id}/task`.
2. `publicaciones/route.ts` reparte las tareas en columnas según la config del cliente:
   - `clickup_status_not_started` → "Sin empezar" (opcional)
   - `estados_visibles` → **"Por revisar"** (la única columna en la que se puede actuar)
   - `estados_rechazo` (cambios visuales) + `estado_cambios_copy` (si está configurado) → "Pendientes de cambios"
   - `estados_aprobacion` → "Aprobadas"
3. **Aprobar** → mueve la tarea a `estados_aprobacion[0]` y comenta `✅ [Nombre]: Aprobado`.
   **Hay cambios** tiene dos modos según el cliente:
   - **Sin `estado_cambios_copy`**: funciona como siempre. Pasa a `estados_rechazo[0]` y comenta `🔄 [Nombre]: texto`.
   - **Con `estado_cambios_copy`**: el cliente elige entre copy, visual o ambos (`components/solicitar-cambios-form.tsx`).
     - `copy` → pasa a `estado_cambios_copy`.
     - `visual` → pasa a `estados_rechazo[0]`.
     - `ambos` → pasa a `estados_rechazo[0]`, con los dos textos separados en un solo comentario (`🔄 [Nombre]: (Copy + visual)\n✍️ Copy: …\n🎨 Visual: …`).
     - El tipo se guarda en `acciones_tareas.tipo_cambio`. `/publicaciones` lo devuelve como `tipoCambio` y las tarjetas lo muestran con `TipoCambioBadge`. "Ambos" solo se distingue de "visual" por esa tabla.
   - Las acciones se registran también en `logs_actividad`. **Los comentarios del cliente deben empezar por `[Nombre]: `** (con emoji delante o sin él): así los reconoce el filtro de privacidad.
4. **Arrastrar una tarjeta en el calendario** (`drag_drop_enabled`) actualiza el custom field "Fecha de publicacion" de ClickUp. Si la tarea no lo tiene, actualiza `due_date`.
5. **Privacidad de comentarios** (`comentarios/[tareaId]/route.ts`):
   - Los comentarios con el patrón `[Nombre]: ` se consideran del cliente y siempre se muestran.
   - Los comentarios del equipo posteriores al **21-ene-2026 18:00 CET** solo se muestran si contienen `///` (las barras se quitan al mostrarlos).
6. **Campos de ClickUp**: `clickup.ts` los busca por nombre, sin distinguir mayúsculas: "Tipo de publicación", "plataforma", "Fecha de publicacion", "drive/enlace", "copy/descripción", "stories", etc. Si se renombra un campo en ClickUp, puede dejar de mostrarse en el portal.

### Notificaciones por email

`/api/admin/check-review-publications` (GET/POST, sin autenticación) recorre los clientes activos y compara las tareas "por revisar" con `snapshots_publicaciones`. Por cada tarea nueva crea una fila en `notificaciones_pendientes`, y a los usuarios con email de los clientes con `notify_new_publications = true` les envía un email agrupado con el branding de Guinda. El cron de Vercel se quitó (plan Hobby): **lo dispara algo externo** (hay ejecuciones de hoy).

## Base de datos (Supabase)

`supabase-setup.sql` está **desactualizado**: solo tiene 5 tablas. La BD real tiene 9 tablas y 1 vista (conteos del 2026-09-29):

| Tabla | Filas | Notas |
|---|---|---|
| `clientes` | 16 | `codigo` (slug de la URL), `clickup_list_id`, arrays de estados, `logo_url`, `drag_drop_enabled`, `notify_new_publications`, `notify_new_comments` |
| `usuarios_clientes` | 34 | `cliente_id`, `username`, `password_hash` (bcrypt), `email`, `es_admin_cliente`, `activo` |
| `logs_actividad` | 2.524 | login/logout, aprobar, hay_cambios, cambio_fecha, refresh_task, notificacion_email_enviada |
| `vista_logs_completa` | — | Vista con los joins de los logs; la usa `/admin/logs` |
| `notificaciones_pendientes` | 756 | `tipo_notificacion`, `datos_publicacion` jsonb, `procesada` |
| `snapshots_publicaciones` | 15 | Último conjunto de `tarea_ids` en revisión por cliente |
| `configuracion_sistema` | 1 | Fila singleton `id = 0000…0000`: API key de ClickUp, workspace, SMTP |
| `auth_admin` | 1 | Hash de la contraseña única del admin |
| `acciones_tareas` | — | Aprobaciones y peticiones de cambios, con `tipo_cambio` (copy/visual/ambos). Hasta el 2026-09-30 no guardaba nada (inserts en camelCase + CHECK que rechazaba `hay_cambios`) |
| `comentarios` | 0 | **No se usa a propósito.** Si se escribiera en ella, cada comentario del cliente saldría duplicado en el modal (`/comentarios` combina ClickUp + esta tabla) |

Consulta de solo lectura rápida (la anon key ya no tiene acceso; usa la clave secreta de `.env.local`):
```bash
set -a; source .env.local; set +a
curl -s -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/clientes?select=codigo,nombre"
```
Para SQL arbitrario (DDL, políticas): Management API `POST https://api.supabase.com/v1/projects/iswoztcvibdqnyqrzisg/database/query` con el token de la Supabase CLI (guardado en el llavero de macOS, "Supabase CLI").
La Supabase CLI tiene acceso a la cuenta (`supabase projects list`). **No escribas en la BD de producción sin confirmarlo antes.**

## UI y estilos

- Tailwind v4 con `@import "tailwindcss"` en `globals.css`. **`tailwind.config.ts` (estilo v3) no se carga** (no hay `@config`/`@theme`), así que tokens como `bg-primary` o `text-muted-foreground` probablemente no generen nada. En la práctica la UI usa colores de la paleta de Tailwind escritos a mano (amber = por revisar, orange/red = cambios, emerald = aprobado, gray = sin empezar).
- La fuente es Inter (`layout.tsx`). No hay dark mode real. Los iconos son de lucide y se usan muchos emojis para tipos y plataformas.
- **La UI no usa el branding de Guinda**: las variables CSS son el azul por defecto de shadcn. Solo los emails llevan el branding de Guinda. Si se aplica la marca, usar la skill `guinda-brand`.
- Mapa de `src/app/cliente/[codigo]/client.tsx`:
  - helpers de color/emoji L221-330
  - filtros L338-575
  - helpers de calendario L578-689
  - drag & drop L691-818
  - tarjetas L821-1231
  - header L1262-1347
  - toolbar L1350-1469
  - panel de filtros L1472-1629
  - calendario desktop L1645-1807
  - calendario móvil L1810-2040
  - kanban L2044-2199
  - modales L2204-2235
- **Configuración de estados del cliente** (`components/estados-mapping.tsx`): es una tabla con cada estado de la lista de ClickUp y su función en el Verify (Oculto / Sin empezar / Por revisar / Cambios visuales / Cambios de copy / Aprobado). Se traduce a las columnas de `clientes` con `configDesdeMapping`, respetando el orden de ClickUp.
  - En clientes nuevos o al cambiar de lista, se autocompleta por nombre (`sugerirRol`).
  - En clientes existentes se respeta lo guardado; las sugerencias solo aparecen como enlace.
  - Estados internos de producción ("falta contenido", "falta copy") = Oculto.
  - La función copy/visual está activada solo en `plantilla` (2026-09-30); en el resto se activa desde el admin.
- `multi-user-login-form.tsx` no se usa en ningún sitio. El enlace "Debug ClickUp" del admin lleva a una página que no existe (404).

## Seguridad (endurecida el 2026-09-29)

- **BD cerrada**: RLS activado en las 9 tablas sin ninguna política, y permisos revocados a `anon`/`authenticated` (también en la vista y en `crear_log_actividad`). Solo entra la clave secreta desde `src/lib/supabase.ts`. Script: `supabase/migraciones/2026-09-29-cerrar-rls.sql` (marcha atrás en `.ROLLBACK.sql`).
  - **Tabla nueva = `ALTER TABLE … ENABLE ROW LEVEL SECURITY` + `REVOKE ALL … FROM anon, authenticated`.** Supabase da permisos a anon por defecto en las tablas nuevas.
  - `lib/supabase.ts` nunca se importa desde un componente `"use client"`.
- **Sesiones firmadas** (`lib/auth.ts`, con `jose`):
  - `guinda-auth` = JWT `{role:'admin'}`, 7 días.
  - `guinda-client-auth` = JWT `{role:'client', codigo, user}`, 30 días.
  - La cookie antigua `guinda-client-user` ya no se usa.
- **API de admin**: cada ruta empieza con `const noAuth = await requireAdmin(); if (noAuth) return noAuth;`. Solo quedan abiertas `auth/login`, `auth/logout` y `check-review-publications` (la llama un cron externo).
- **API de cliente**:
  - Se usa `getClientUserForCodigo(codigo)`, que exige que la sesión sea de **ese** cliente. `getCurrentClientUser()` no lo comprueba: úsala solo en `/api/cliente/auth/*`.
  - Toda ruta que reciba un `tareaId` comprueba `taskBelongsToList(tarea, cliente.clickupListId)`.
  - `GET /api/cliente/[codigo]` sigue siendo pública (nombre y logo para la pantalla de login).
- **Secretos de configuración**: `GET /api/admin/configuracion` devuelve `clickupApiKey`/`smtpPass` vacíos, más `clickupApiKeySet`/`smtpPassSet`. Si se guardan vacíos, se conserva el valor actual. `get-lists`/`get-list-statuses` usan la key del servidor.

Pendiente:
- El login no tiene límite de intentos.
- `check-review-publications` no tiene secreto.
- El login del cliente es solo con contraseña: la contraseña identifica al usuario, por eso tiene que ser única dentro de cada cliente.

## Problemas conocidos (funcionales)

- **Los emails de notificación no se envían desde el 11-sep-2026**: el SMTP de `configuracion_sistema` está vacío (la fila se modificó por última vez el 22-sep). Desde el 11-sep se han creado 59 notificaciones que se marcan como procesadas sin enviarse. `updateConfiguracionSistema` pone a `null` cualquier campo SMTP que no venga en el POST.
- Portal (según la revisión del código):
  - Los separadores del kanban quedan mal colocados con 4 columnas.
  - Hay `console.log` dentro del render del calendario.
  - (Arreglado el 2026-09-29: "Solicitar cambios" desde el modal de detalle, el texto de "Hay cambios" compartido entre tarjetas, que ahora está en `comentariosCambios[tareaId]`, y el calendario móvil desplazado un día.)
- Fechas en el calendario: para comparar días usa `toFechaKey(fecha)` de `lib/utils.ts`, nunca `toISOString().split('T')[0]`, que pasa a UTC y resta un día en España.
- `EmailService` es un singleton de módulo: un cambio de SMTP no se aplica hasta que se reinicia la instancia (salvo `reinitialize()`). `getClickUpService()` sí lee la key en cada llamada.

## Convenciones

- El código, los comentarios, la UI y los mensajes de commit van en **español**. Commits con prefijo tipo `feat:`/`fix:`/`style:`/`chore:`.
- Las rutas API devuelven `NextResponse.json({ error })` con el status adecuado. Los `params` de rutas dinámicas son `Promise` (Next 15+): `const { codigo } = await params`.
- La BD usa snake_case y el frontend camelCase: convierte en `SupabaseService` (`convertClienteFromDB`) y añade las columnas nuevas en los dos sentidos.
- Si añades un campo a `clientes`: tipo en `types/index.ts` → `createCliente`/`updateCliente`/`convertClienteFromDB` → formulario en `admin/client.tsx` → migración SQL en Supabase.
- Registra en `logActivity()` las acciones nuevas del cliente.
- Antes de hacer push a `main`, recuerda que se despliega directamente en producción y que la usan clientes reales.
