import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';
import { getClickUpService, taskBelongsToList } from '@/lib/clickup';
import { getClientUserForCodigo, logActivity } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    console.log('🚀 INICIO - Endpoint actualizar-fecha llamado');
    const { codigo } = await params;
    const body = await request.json();
    const { tareaId, nuevaFecha } = body;
    
    console.log('📥 DATOS RECIBIDOS:', { codigo, tareaId, nuevaFecha, body });

    if (!tareaId || !nuevaFecha) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    // Obtener información del cliente
    const supabaseService = getSupabaseService();
    const cliente = await supabaseService.getClienteByCodigo(codigo);

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    if (!cliente.activo) {
      return NextResponse.json({ error: 'Cliente inactivo' }, { status: 403 });
    }

    // Obtener información del usuario actual
    const currentUser = await getClientUserForCodigo(codigo);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    // Convertir la nueva fecha a timestamp (en milisegundos)
    // ClickUp espera timestamps en UTC, usar medianoche UTC para fechas
    const fechaTimestamp = new Date(nuevaFecha + 'T00:00:00.000Z').getTime();

    console.log('🔄 DEBUG - Actualizando fecha:', {
      tareaId,
      nuevaFecha,
      fechaTimestamp,
      fechaComprensible: new Date(fechaTimestamp).toISOString(),
      clienteCodigo: codigo
    });

    // Actualizar la fecha en ClickUp usando el servicio
    // Verificar si necesitamos usar la API key específica del cliente
    const clickUpService = await getClickUpService();

    // La tarea tiene que ser de la lista de ClickUp de este cliente
    const tarea = await clickUpService.getTask(tareaId);
    if (!taskBelongsToList(tarea, cliente.clickupListId)) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }
    
    try {
      // Actualizar la fecha de vencimiento de la tarea
      const resultado = await clickUpService.updateTaskDueDate(tareaId, fechaTimestamp);
      console.log('✅ ClickUp actualizado correctamente:', resultado);
    } catch (clickupError) {
      console.error('❌ Error actualizando ClickUp:', clickupError);
      return NextResponse.json({ 
        error: 'Error actualizando la fecha en ClickUp',
        details: clickupError instanceof Error ? clickupError.message : 'Error desconocido'
      }, { status: 500 });
    }

    // Registrar la actividad en el log
    const ipAddress = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || null;
    const userAgent = request.headers.get('user-agent') || null;
    
    await logActivity(
      currentUser.id,
      cliente.id,
      'cambio_fecha',
      `Fecha límite cambiada a ${nuevaFecha}`,
      tareaId,
      null,
      null,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      mensaje: 'Fecha actualizada correctamente',
      nuevaFecha: nuevaFecha
    });

  } catch (error) {
    console.error('Error en actualizar-fecha:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
