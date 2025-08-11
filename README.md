# GuindaVerify - Portal de Revisión de Publicaciones

Una aplicación web moderna para que los clientes puedan revisar y aprobar publicaciones de redes sociales de forma sencilla, con integración automática con ClickUp.

## 🚀 Características Principales

- **Panel de Administración**: Gestiona clientes desde una interfaz web intuitiva
- **Integración con ClickUp**: Sincronización automática de tareas y estados
- **Portales Personalizados**: URL única para cada cliente
- **Configuración Centralizada**: Gestión de configuraciones desde el panel admin
- **Escalable**: Fácil gestión de múltiples clientes sin acceso manual a la base de datos
- **Interfaz moderna**: Diseño limpio y responsive
- **Acciones simples**: Aprobar, rechazar o comentar publicaciones
- **Seguro**: Autenticación por URL única

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS, Lucide Icons
- **Base de datos**: Supabase (PostgreSQL)
- **API**: ClickUp API
- **Notificaciones**: Sonner (Toast notifications)
- **Despliegue**: Vercel (recomendado)

## 📋 Requisitos Previos

- Node.js 18+ 
- Cuenta de ClickUp con API Key
- Proyecto de Supabase

## 🔧 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd guinda-verify
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env.local
   ```
   
   Edita `.env.local` con tus credenciales:
   ```env
   # ClickUp Configuration
   CLICKUP_API_KEY=tu_api_key_de_clickup
   CLICKUP_WORKSPACE_ID=tu_workspace_id
   
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
   
   # Application Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Configurar Supabase**
   
   Ejecuta el script `supabase-setup.sql` en el SQL Editor de Supabase para crear todas las tablas necesarias.

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

6. **Configurar el Sistema**
   1. Accede al panel de administración: `http://localhost:3000/admin`
   2. Ve a "Configuración" para configurar ClickUp
   3. Prueba las conexiones con Supabase y ClickUp
   4. ¡Listo para crear clientes!

## 📖 Uso

### Panel de Administración

Accede al panel de administración en `http://localhost:3000/admin` para:

- **Dashboard**: Vista general de clientes y estadísticas
- **Gestión de Clientes**: Crear, editar y eliminar clientes
- **Configuración**: Gestionar credenciales y estados por defecto

### Crear un Cliente (Recomendado)

1. **Desde el Panel de Administración**:
   1. Accede a `http://localhost:3000/admin`
   2. Haz clic en "Nuevo Cliente"
   3. Completa la información:
      - **Código**: Identificador único para la URL (ej: `mi-cliente`)
      - **Nombre**: Nombre del cliente
      - **Email**: Email de contacto (opcional)
      - **ID Lista ClickUp**: ID de la lista de ClickUp asociada
      - **Estados Visibles**: Estados que aparecen en el portal (separados por comas)
      - **Estados Aprobación**: Estados cuando aprueba (separados por comas)
      - **Estados Rechazo**: Estados cuando rechaza (separados por comas)

2. **El cliente accede a**: `http://localhost:3000/cliente/[codigo]`

### Flujo de Trabajo

1. **Tu equipo crea tareas en ClickUp** con el contenido de las publicaciones
2. **Mueve las tareas al estado configurado** (ej: "Pendiente de Revisión")
3. **El cliente accede a su portal**: `https://tuapp.com/cliente/cliente-ejemplo`
4. **El cliente revisa y actúa** sobre las publicaciones
5. **Los cambios se sincronizan automáticamente** con ClickUp

### Estados de ClickUp

Configura estos estados en tu lista de ClickUp:
- **Pendiente de Revisión**: Las tareas que aparecen en el portal
- **Aprobado**: Estado al que se mueve cuando el cliente aprueba
- **Rechazado**: Estado al que se mueve cuando el cliente rechaza

## 🔗 URLs Importantes

- **Página Principal**: `http://localhost:3000`
- **Panel de Administración**: `http://localhost:3000/admin`
- **Configuración**: `http://localhost:3000/admin/configuracion`
- **Portal de Cliente**: `http://localhost:3000/cliente/[codigo]`

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel
3. Despliega automáticamente

### Variables de Entorno en Producción

Asegúrate de configurar estas variables en tu plataforma de despliegue:
- `CLICKUP_API_KEY`
- `CLICKUP_WORKSPACE_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

## 🔧 Configuración Avanzada

### Campos Personalizados en ClickUp

Para mejor integración, puedes usar campos personalizados en ClickUp:

- **Tipo de Red Social**: Para identificar Instagram, Facebook, etc.
- **Texto de Publicación**: Para el copy de la publicación
- **Imagen Preview**: URL de la imagen de la publicación
- **Fecha Programada**: Cuándo se publicará

### Personalización de Estados

Puedes configurar múltiples estados para diferentes flujos de trabajo desde el panel de administración o manualmente:

```sql
UPDATE clientes 
SET estados_visibles = ARRAY['Pendiente Revisión', 'En Revisión'],
    estados_aprobacion = ARRAY['Aprobado', 'Listo para Publicar'],
    estados_rechazo = ARRAY['Rechazado', 'Necesita Cambios']
WHERE codigo = 'cliente-ejemplo';
```

## 📚 Documentación Adicional

- [Guía Rápida](GUIA_RAPIDA.md) - Configuración paso a paso
- [Scripts de Configuración](scripts/) - Herramientas de configuración
- [Tipos TypeScript](src/types/) - Definiciones de tipos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación de [ClickUp API](https://clickup.com/api)
2. Consulta la documentación de [Supabase](https://supabase.com/docs)
3. Abre un issue en este repositorio

## 🔮 Roadmap

- [x] Panel de administración para gestionar clientes
- [x] Configuración centralizada del sistema
- [x] Verificación de conexiones
- [ ] Notificaciones por email
- [ ] Historial de acciones
- [ ] Estadísticas de aprobación
- [ ] Integración con más plataformas de gestión de proyectos
- [ ] App móvil

---

**¡Listo! Tu portal de revisión de publicaciones está funcionando.** 🎉
