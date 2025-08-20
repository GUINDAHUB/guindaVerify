import { NextRequest, NextResponse } from 'next/server';
import { getClickUpService } from '@/lib/clickup';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación de administrador
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID es requerido' }, { status: 400 });
    }

    console.log(`🔍 DEBUG: Obteniendo tarea ${taskId} desde ClickUp...`);

    // Obtener la tarea directamente desde ClickUp
    const clickUpService = await getClickUpService();
    const task = await clickUpService.getTask(taskId, true);

    console.log(`📋 DEBUG: Tarea completa obtenida:`, JSON.stringify(task, null, 2));

    // Extraer información relevante para debugging
    const debugInfo = {
      taskId: task.id,
      taskName: task.name,
      status: task.status,
      dates: {
        due_date: task.due_date,
        start_date: task.start_date,
        date_created: task.date_created,
        date_updated: task.date_updated,
        date_closed: task.date_closed
      },
      custom_fields: task.custom_fields.map(field => ({
        id: field.id,
        name: field.name,
        type: field.type,
        value: field.value,
        type_config: field.type_config,
        hide_from_guests: field.hide_from_guests,
        date_created: field.date_created
      })),
      custom_fields_raw: task.custom_fields,
      priority: task.priority,
      tags: task.tags,
      assignees: task.assignees.map(a => ({
        id: a.id,
        username: a.username,
        email: a.email
      })),
      creator: {
        id: task.creator.id,
        username: task.creator.username,
        email: task.creator.email
      },
      url: task.url
    };

    // También convertir usando nuestro método actual para comparar
    const publicacionConvertida = clickUpService.convertToTareaPublicacion(task);

    console.log(`🔄 DEBUG: Publicación convertida:`, JSON.stringify(publicacionConvertida, null, 2));

    return NextResponse.json({
      success: true,
      debugInfo,
      publicacionConvertida,
      rawTask: task
    });

  } catch (error) {
    console.error('Error en debug ClickUp task:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
