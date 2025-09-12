# Migración del Campo "Fecha de Publicación" a "Fecha Límite"

## Resumen de Cambios

Se ha actualizado la aplicación para usar el campo estándar **"Fecha Límite"** (due_date) de ClickUp en lugar del campo personalizado "Fecha de Publicación".

## Ventajas del Campo Estándar "Fecha Límite"

1. **Funcionalidad Nativa**: Es una característica estándar de ClickUp disponible en todos los planes
2. **Mejor Integración**: Funciona con todas las funcionalidades nativas de ClickUp
3. **Reprogramación Automática**: Las subtareas pueden reprogramarse automáticamente
4. **Visualización Mejorada**: Mejor integración con las vistas de calendario y lista
5. **Sin Dependencias**: No requiere configuración de campos personalizados

## Cambios Técnicos Realizados

### 1. Servicio ClickUp (`src/lib/clickup.ts`)

- **Método `updateTaskDueDate()`**: Actualizado para usar la API estándar de ClickUp (`PUT /task/{id}` con `due_date`)
- **Método `extractFechaProgramada()`**: Modificado para priorizar `due_date` sobre campos personalizados
- **Compatibilidad hacia atrás**: Mantiene soporte para campos personalizados como fallback

### 2. API de Actualización de Fecha (`src/app/api/cliente/[codigo]/actualizar-fecha/route.ts`)

- **Log de actividad**: Actualizado para mostrar "Fecha límite cambiada" en lugar de "Fecha de publicación cambiada"

## Compatibilidad

### ✅ Funcionamiento Actual

- **Nuevas fechas**: Se establecen usando el campo "Fecha Límite" estándar
- **Fechas existentes**: Se leen automáticamente desde campos personalizados (fallback)
- **Actualizaciones**: Todas las actualizaciones ahora usan el campo estándar

### 🔄 Migración Automática

El sistema funciona de forma híbrida:

1. **Lectura**: Prioriza `due_date`, pero lee campos personalizados si no existe
2. **Escritura**: Siempre usa `due_date` (campo estándar)
3. **Transición gradual**: Las tareas migran automáticamente al ser actualizadas

## Pasos para Completar la Migración

### Opción 1: Migración Gradual (Recomendada)
- No requiere acción adicional
- Las fechas migran automáticamente cuando los usuarios actualizan las tareas
- Mantiene compatibilidad total

### Opción 2: Migración Masiva
Si deseas migrar todas las fechas inmediatamente:

1. Usar la API de ClickUp para obtener todas las tareas
2. Para cada tarea con campo personalizado de fecha:
   - Leer el valor del campo personalizado
   - Establecer `due_date` con ese valor
   - Opcionalmente, limpiar el campo personalizado

## Verificación

Para verificar que todo funciona correctamente:

1. **Portal del Cliente**: Las fechas se muestran correctamente
2. **Drag & Drop**: Funciona para cambiar fechas en el calendario
3. **Filtros**: Los filtros por fecha funcionan normalmente
4. **ClickUp**: Las fechas aparecen en el campo "Fecha Límite" de ClickUp

## Notas Importantes

- **Sin pérdida de datos**: Las fechas existentes se mantienen visibles
- **Mejora progresiva**: El sistema mejora automáticamente con el uso
- **Logs detallados**: Los cambios se registran en los logs del sistema

## Rollback (si es necesario)

Si necesitas revertir los cambios:

1. Restaurar `updateTaskDueDate()` para usar campos personalizados
2. Cambiar la prioridad en `extractFechaProgramada()` 
3. Actualizar los mensajes de log

Los cambios son reversibles sin pérdida de datos.

