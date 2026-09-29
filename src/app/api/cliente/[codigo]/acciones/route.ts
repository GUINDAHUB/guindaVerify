import { NextRequest, NextResponse } from 'next/server';
import { getClickUpService, taskBelongsToList } from '@/lib/clickup';
import { getSupabaseService } from '@/lib/supabase';
import { getClientUserForCodigo, logActivity } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    const body = await request.json();
    const { tareaId, accion, comentario } = body;

    // Validar datos requeridos
    if (!tareaId || !accion) {
      return NextResponse.json(
        { error: 'Tarea ID y acción son requeridos' },
        { status: 400 }
      );
    }

    if (!['aprobar', 'hay_cambios'].includes(accion)) {
      return NextResponse.json(
        { error: 'Acción no válida' },
        { status: 400 }
      );
    }

    // Obtener información del cliente
    const supabaseService = getSupabaseService();
    const cliente = await supabaseService.getClienteByCodigo(codigo);

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    if (!cliente.activo) {
      return NextResponse.json(
        { error: 'Cliente inactivo' },
        { status: 403 }
      );
    }

    // Obtener información del usuario actual
    const currentUser = await getClientUserForCodigo(codigo);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const clickUpService = await getClickUpService();

    // La tarea tiene que ser de la lista de ClickUp de este cliente
    const tarea = await clickUpService.getTask(tareaId);
    if (!taskBelongsToList(tarea, cliente.clickupListId)) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    // Determinar el nuevo estado según la acción
    let nuevoEstado: string;
    let mensajeComentario: string;

    switch (accion) {
      case 'aprobar':
        nuevoEstado = cliente.estadosAprobacion[0] || 'Aprobado';
        mensajeComentario = `✅ [${currentUser.nombre}]: Aprobado`;
        break;
      case 'hay_cambios':
        if (!comentario) {
          return NextResponse.json(
            { error: 'Comentario es requerido para solicitar cambios' },
            { status: 400 }
          );
        }
        nuevoEstado = cliente.estadosRechazo[0] || 'Hay cambios';
        mensajeComentario = `🔄 [${currentUser.nombre}]: ${comentario}`;
        break;
      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

    // Actualizar estado en ClickUp si es necesario
    if (nuevoEstado) {
      await clickUpService.updateTaskStatus(tareaId, nuevoEstado);
    }

    // Agregar comentario en ClickUp
    await clickUpService.addComment(tareaId, mensajeComentario);

    // Registrar acción en nuestra base de datos con información del usuario
    const accionCreada = await supabaseService.createAccionTarea({
      tareaId,
      clienteId: cliente.id,
      usuarioId: currentUser.id,
      accion,
      comentario: comentario || mensajeComentario,
    });

    // Si hay cambios solicitados, también guardarlo en la tabla de comentarios
    let comentarioCreado = null;
    if (accion === 'hay_cambios' && comentario) {
      comentarioCreado = await supabaseService.createComentario({
        tareaId,
        clienteId: cliente.id,
        usuarioId: currentUser.id,
        contenido: `[${currentUser.nombre}]: ${comentario}`,
        autor: {
          nombre: currentUser.nombre,
          email: currentUser.email || '',
        },
      });
    }

    // Registrar la actividad en el log
    const ipAddress = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || null;
    const userAgent = request.headers.get('user-agent') || null;
    
    await logActivity(
      currentUser.id,
      cliente.id,
      accion,
      `Acción ${accion} en tarea ${tareaId}${comentario ? ': ' + comentario : ''}`,
      tareaId,
      comentarioCreado?.id,
      accionCreada?.id,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      mensaje: `Acción "${accion}" realizada correctamente`,
      tareaId,
      nuevoEstado: nuevoEstado || 'sin cambios',
    });

  } catch (error) {
    console.error('Error procesando acción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 