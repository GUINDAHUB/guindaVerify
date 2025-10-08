# 🧪 Guía de Prueba del Sistema de Notificaciones

## 📋 Pasos para Probar el Sistema

### 1. **Preparación de Base de Datos**
```sql
-- Ejecutar en Supabase SQL Editor:
-- 1. add-email-to-users.sql (si no lo has hecho)
-- 2. add-notifications-system.sql
```

### 2. **Verificar Configuración SMTP**
- Ir a: `http://localhost:3000/admin/configuracion`
- Verificar que SMTP esté configurado y habilitado
- Probar envío de email de prueba

### 3. **Crear Usuario con Email**
- Ir a: `http://localhost:3000/admin`
- Seleccionar un cliente
- Hacer clic en botón verde "Usuarios"
- Crear o editar usuario para agregar email
- Verificar que aparezca en la tabla

### 4. **Simular Nueva Publicación**
**Opción A: Desde ClickUp**
- Crear nueva tarea en la lista del cliente
- Mover a estado "Pendiente de Revisión"

**Opción B: Desde el Portal**
- Ir al portal del cliente: `http://localhost:3000/cliente/[codigo]`
- Hacer refresh para que detecte cambios

### 5. **Verificar Detección**
- Consultar endpoint de prueba: `GET /api/admin/test-notifications`
- Debería mostrar notificaciones pendientes

### 6. **Probar Envío Manual**
- Ejecutar: `POST /api/admin/test-notifications`
- Verificar que se envíe el email
- Revisar bandeja de entrada del usuario

### 7. **Verificar Cron Job**
- El cron se ejecutará automáticamente cada 30 minutos
- Para prueba inmediata, usar el endpoint manual

## 🔍 Endpoints de Debugging

### **Ver Estadísticas**
```bash
curl -H "Cookie: guinda-auth=tu-cookie" \
  http://localhost:3000/api/admin/test-notifications
```

### **Envío Manual**
```bash
curl -X POST \
  -H "Cookie: guinda-auth=tu-cookie" \
  http://localhost:3000/api/admin/test-notifications
```

### **Cron Job (Producción)**
```bash
curl -X POST \
  -H "Authorization: Bearer guinda-cron-secret-2024" \
  https://tu-dominio.vercel.app/api/admin/send-notifications
```

## 📊 Consultas SQL de Verificación

### **Ver Notificaciones Pendientes**
```sql
SELECT 
  np.*,
  c.nombre as cliente_nombre
FROM notificaciones_pendientes np
JOIN clientes c ON np.cliente_id = c.id
WHERE np.procesada = false
ORDER BY np.created_at DESC;
```

### **Ver Snapshots**
```sql
SELECT 
  sp.*,
  c.nombre as cliente_nombre,
  array_length(sp.tarea_ids, 1) as num_tareas
FROM snapshots_publicaciones sp
JOIN clientes c ON sp.cliente_id = c.id
ORDER BY sp.last_check DESC;
```

### **Estadísticas de Envío**
```sql
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as total,
  COUNT(CASE WHEN procesada THEN 1 END) as enviadas,
  COUNT(CASE WHEN NOT procesada THEN 1 END) as pendientes
FROM notificaciones_pendientes
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```

## ✅ Checklist de Verificación

- [ ] Scripts SQL ejecutados en Supabase
- [ ] Variable CRON_SECRET agregada a .env.local
- [ ] SMTP configurado y funcionando
- [ ] Usuario con email creado
- [ ] Nueva publicación detectada
- [ ] Notificación creada en base de datos
- [ ] Email enviado correctamente
- [ ] Notificación marcada como procesada
- [ ] vercel.json creado para cron job

## 🚨 Solución de Problemas

### **No se detectan nuevas publicaciones**
- Verificar que el cliente consulte su portal
- Revisar logs del servidor
- Verificar estados de ClickUp configurados

### **No se envían emails**
- Verificar configuración SMTP
- Verificar que usuarios tengan email
- Revisar logs de errores

### **Emails duplicados**
- Verificar que notificaciones se marquen como procesadas
- Revisar frecuencia del cron job

### **Cron job no funciona**
- Verificar vercel.json en la raíz
- Verificar variable CRON_SECRET en producción
- Revisar logs de Vercel Functions
