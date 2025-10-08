# 📧 Sistema de Notificaciones por Email - GuindaVerify

## 🎯 Resumen

Se ha implementado un sistema inteligente de notificaciones por email que **agrupa las notificaciones** para evitar spam y mejorar la experiencia del usuario.

## ✨ Características Implementadas

### 🔔 **Detección Automática**
- Detecta nuevas publicaciones cuando los clientes consultan su portal
- Compara con un "snapshot" del estado anterior
- Solo notifica publicaciones realmente nuevas

### 📦 **Agrupación Inteligente**
- Acumula notificaciones durante un período de tiempo
- Un solo email por cliente con todas las publicaciones nuevas
- Evita spam de múltiples emails

### 🎨 **Email Profesional**
- Template HTML responsive y moderno
- Información detallada de cada publicación
- Botón directo al portal del cliente
- Branding consistente con GuindaVerify

### 👥 **Envío Múltiple**
- Se envía a todos los usuarios del cliente que tengan email configurado
- Solo usuarios activos reciben notificaciones
- Respeta la configuración de email opcional

## 🗄️ **Estructura de Base de Datos**

### Tabla: `notificaciones_pendientes`
```sql
- id: UUID (PK)
- cliente_id: UUID (FK)
- tarea_id: VARCHAR(255)
- tipo_notificacion: VARCHAR(50) -- 'nueva_publicacion', etc.
- datos_publicacion: JSONB -- Título, fecha, estado, etc.
- procesada: BOOLEAN
- created_at: TIMESTAMP
- processed_at: TIMESTAMP
```

### Tabla: `snapshots_publicaciones`
```sql
- id: UUID (PK)
- cliente_id: UUID (FK) UNIQUE
- tarea_ids: TEXT[] -- Array de IDs de publicaciones
- last_check: TIMESTAMP
```

## 🚀 **Configuración y Uso**

### 1. **Ejecutar Scripts SQL**
```sql
-- 1. Primero ejecutar (si no lo has hecho):
-- Contenido de: add-email-to-users.sql

-- 2. Luego ejecutar:
-- Contenido de: add-notifications-system.sql
```

### 2. **Variables de Entorno**
Agregar a tu `.env.local`:
```env
# Notifications Configuration
CRON_SECRET=guinda-cron-secret-2024
```

### 3. **Configurar Cron Job**

#### **Opción A: Vercel Cron (Recomendado)**
Crear `vercel.json` en la raíz del proyecto:
```json
{
  "crons": [
    {
      "path": "/api/admin/send-notifications",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

#### **Opción B: Cron Job Manual**
```bash
# Cada 30 minutos
*/30 * * * * curl -X POST https://tu-dominio.com/api/admin/send-notifications \
  -H "Authorization: Bearer guinda-cron-secret-2024"
```

#### **Opción C: GitHub Actions**
```yaml
name: Send Notifications
on:
  schedule:
    - cron: '*/30 * * * *'  # Cada 30 minutos
jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Send notifications
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/admin/send-notifications \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## 🧪 **Pruebas y Debugging**

### **Endpoint de Prueba (Solo Admin)**
```
GET /api/admin/test-notifications
```
- Muestra estadísticas de notificaciones pendientes
- Requiere autenticación de administrador

```
POST /api/admin/test-notifications  
```
- Envía manualmente todas las notificaciones pendientes
- Útil para pruebas

### **Logs de Debugging**
El sistema genera logs detallados:
```
🔍 Detectando nuevas publicaciones para cliente: xxx
📸 Snapshot inicial creado para cliente xxx
🆕 Detectadas 2 nuevas publicaciones: [id1, id2]
✅ Notificación creada: nueva_publicacion para tarea xxx
📧 Enviando notificaciones a cliente xxx: 2 notificaciones
✅ Email de nuevas publicaciones enviado a 3 usuarios de Cliente
```

## 🎯 **Flujo de Funcionamiento**

1. **Cliente consulta publicaciones** → `GET /api/cliente/[codigo]/publicaciones`
2. **Sistema detecta nuevas** → Compara con snapshot anterior
3. **Crea notificaciones pendientes** → Guarda en base de datos
4. **Cron job ejecuta** → Cada 30 minutos
5. **Agrupa por cliente** → Un email por cliente
6. **Envía emails** → A todos los usuarios con email
7. **Marca como procesadas** → Evita duplicados

## 📧 **Ejemplo de Email**

```
🎨 2 Nuevas Publicaciones Listas para Revisión - Cliente ABC

Hola,

Tu equipo ha preparado 2 nuevas publicaciones que necesitan tu revisión:

📋 [Publicación Instagram Stories] - Programada para: lunes, 15 de enero de 2024
📋 [Post Facebook Promocional] - Programada para: martes, 16 de enero de 2024

👆 Revisar y Aprobar Publicaciones
[Botón que lleva al portal]
```

## ⚙️ **Configuraciones Futuras**

### **Próximas Mejoras Planificadas:**
- ⏰ Configurar frecuencia por cliente (15min, 30min, 1h, 2h)
- 🕐 Horarios de envío (solo horario laboral)
- 📊 Límites diarios (máximo 1 email por día)
- 🎛️ Tipos de notificación por cliente
- 📱 Integración con webhooks de ClickUp
- 📈 Dashboard de estadísticas de notificaciones

### **Tipos de Notificación Futuros:**
- ✅ `nueva_publicacion` (Implementado)
- 🔄 `cambios_implementados` (Planificado)
- 📝 `publicacion_actualizada` (Planificado)
- ⏰ `recordatorio_pendientes` (Planificado)
- 📊 `resumen_semanal` (Planificado)

## 🔧 **Solución de Problemas**

### **No se envían emails:**
1. Verificar configuración SMTP en `/admin/configuracion`
2. Verificar que los usuarios tengan email configurado
3. Revisar logs del servidor para errores
4. Probar con `/api/admin/test-notifications`

### **Se envían muchos emails:**
1. Verificar que el cron job no se ejecute muy frecuentemente
2. Revisar que las notificaciones se marquen como procesadas
3. Verificar la lógica de detección de nuevas publicaciones

### **No se detectan nuevas publicaciones:**
1. Verificar que el cliente esté consultando su portal
2. Revisar que las publicaciones estén en estado "pendiente de revisión"
3. Verificar los snapshots en la base de datos

## 📊 **Monitoreo**

### **Métricas Importantes:**
- Número de notificaciones pendientes
- Tiempo promedio entre creación y envío
- Tasa de apertura de emails (futuro)
- Número de usuarios notificados por cliente

### **Consultas SQL Útiles:**
```sql
-- Notificaciones pendientes por cliente
SELECT c.nombre, COUNT(*) as pendientes
FROM notificaciones_pendientes np
JOIN clientes c ON np.cliente_id = c.id
WHERE np.procesada = false
GROUP BY c.nombre;

-- Estadísticas de envío
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as total_notificaciones,
  COUNT(CASE WHEN procesada THEN 1 END) as enviadas
FROM notificaciones_pendientes
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```
