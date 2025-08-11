# 🚀 Guía Rápida - GuindaVerify

## Configuración Inicial (5 minutos)

### 1. Configurar Supabase
1. Ve a [supabase.com](https://supabase.com) y crea un proyecto
2. En el SQL Editor, ejecuta el contenido de `supabase-setup.sql`
3. Copia la URL y Anon Key de tu proyecto
4. **Importante**: El script creará automáticamente una configuración inicial vacía

### 2. Configurar ClickUp
1. Ve a [clickup.com](https://clickup.com) y obtén tu API Key
2. Identifica tu Workspace ID
3. Crea una lista para cada cliente

### 3. Configurar Variables de Entorno
Edita `.env.local` con tus credenciales:
```env
CLICKUP_API_KEY=tu_api_key_de_clickup
CLICKUP_WORKSPACE_ID=tu_workspace_id
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Ejecutar la Aplicación
```bash
npm run dev
```

### 5. Configurar el Sistema
1. Accede al panel de administración: `http://localhost:3000/admin`
2. Ve a "Configuración" para configurar ClickUp
3. Prueba las conexiones con Supabase y ClickUp
4. ¡Listo para crear clientes!

## Crear un Cliente (2 minutos)

### Opción 1: Panel de Administración (Recomendado)
1. Accede al panel de administración: `http://localhost:3000/admin`
2. Haz clic en "Nuevo Cliente"
3. Completa la información del cliente
4. El cliente accede a: `http://localhost:3000/cliente/[codigo]`

### Opción 2: Manual en Supabase (Solo para desarrollo)
```sql
INSERT INTO clientes (
  codigo,
  nombre,
  email,
  clickup_list_id,
  estados_visibles,
  estados_aprobacion,
  estados_rechazo
) VALUES (
  'mi-cliente',
  'Mi Cliente',
  'cliente@ejemplo.com',
  '123456789',
  ARRAY['Pendiente de Revisión'],
  ARRAY['Aprobado'],
  ARRAY['Rechazado']
);
```

## Flujo de Trabajo

### Para tu Equipo:
1. **Crear tarea en ClickUp** con el contenido de la publicación
2. **Mover a estado "Pendiente de Revisión"**
3. **Enviar enlace al cliente**
4. **Recibir notificación cuando apruebe/rechace**

### Para el Cliente:
1. **Acceder al enlace personalizado**
2. **Ver publicaciones pendientes**
3. **Aprobar, rechazar o comentar**
4. **Los cambios se sincronizan automáticamente**

## Estados Recomendados en ClickUp

Configura estos estados en tu lista:
- **📝 En Creación** - Tu equipo está creando el contenido
- **👀 Pendiente de Revisión** - Listo para que el cliente revise
- **✅ Aprobado** - Cliente aprobó la publicación
- **❌ Rechazado** - Cliente rechazó la publicación
- **📤 Publicado** - Ya se publicó en redes sociales

## Campos Personalizados en ClickUp (Opcional)

Para mejor integración, crea estos campos personalizados:
- **Tipo de Red Social** (Dropdown): Instagram, Facebook, Twitter, etc.
- **Texto de Publicación** (Text): El copy de la publicación
- **Imagen Preview** (URL): Enlace a la imagen
- **Fecha Programada** (Date): Cuándo se publicará

## Despliegue en Producción

### Vercel (Recomendado):
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. ¡Listo! Se despliega automáticamente

### Variables de Entorno en Producción:
- `CLICKUP_API_KEY`
- `CLICKUP_WORKSPACE_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (URL de tu dominio)

## Solución de Problemas

### La aplicación no carga:
- Verifica que las variables de entorno estén correctas
- Ejecuta `npm run check-setup` para diagnosticar

### No aparecen publicaciones:
- Verifica que el `clickup_list_id` sea correcto
- Asegúrate de que las tareas estén en el estado configurado
- Revisa que el cliente esté activo en la base de datos

### Error de API:
- Verifica que la API Key de ClickUp sea válida
- Asegúrate de que el Workspace ID sea correcto

### Error "Could not find the 'clickupApiKey' column":
- **Solución**: Ejecuta nuevamente el script `supabase-setup.sql` en Supabase
- Este error ocurre cuando la tabla `configuracion_sistema` no se creó correctamente
- El script creará automáticamente una configuración inicial vacía

### Error "Cannot coerce the result to a single JSON object" o "violates row-level security policy":
- **Solución rápida**: Ejecuta el script `fix-config.sql` en Supabase
- Este script solucionará los problemas de RLS y configuración inicial
- Después de ejecutarlo, ve a `/admin/configuracion` y configura tus credenciales

### Error de conexión con ClickUp:
- **Paso 1**: Ve a `/admin/configuracion` y configura las credenciales
- **Paso 2**: Haz clic en "Probar Conexión" para verificar
- **Paso 3**: Si falla, verifica que la API Key y Workspace ID sean correctos

### Error 404 en Workspace ID:
- **Cómo obtener el Workspace ID correcto**:
  1. Ve a ClickUp y accede a tu workspace
  2. En la URL verás algo como: `https://app.clickup.com/123456/v/li/789012`
  3. El número `123456` es tu Workspace ID
  4. También puedes verlo en Settings → Workspace → General
- **Verificar acceso**: Asegúrate de que tu API Key tenga acceso al workspace

## Comandos Útiles

```bash
# Verificar configuración
npm run check-setup

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar en producción
npm run start
```

## Soporte

- 📖 [Documentación completa](README.md)
- 🐛 [Reportar problemas](https://github.com/tu-usuario/guinda-verify/issues)
- 💬 [Soporte técnico](mailto:soporte@tuempresa.com)

---

**¡Listo! Tu portal de revisión de publicaciones está funcionando.** 🎉 