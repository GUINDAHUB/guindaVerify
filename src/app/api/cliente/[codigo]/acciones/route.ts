import { NextRequest, NextResponse } from 'next/server';
import { getClickUpService, taskBelongsToList } from '@/lib/clickup';
import { getSupabaseService } from '@/lib/supabase';
import { getClientUserForCodigo, logActivity } from '@/lib/auth';
import type { TipoCambio } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    const body = await request.json();
    const { tareaId, accion } = body;
    // tipoCambio solo se usa si el cliente tiene estado de "cambios de copy" configurado.
    // Con 'ambos' el texto llega separado en comentarioCopy y comentarioVisual.
    const tipoCambioBody: string | undefined = body.tipoCambio;
    const comentarioCopy: string = (body.comentarioCopy || '').trim();
    const comentarioVisual: string = (body.comentarioVisual || '').trim();
    let comentario: string = (body.comentario || '').trim();

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
    let tipoCambio: TipoCambio | undefined;

    switch (accion) {
      case 'aprobar':
        nuevoEstado = cliente.estadosAprobacion[0] || 'Aprobado';
        mensajeComentario = `✅ [${currentUser.nombre}]: Aprobado`;
        break;
      case 'hay_cambios': {
        // Los comentarios del cliente en ClickUp deben empezar por "[Nombre]: " (con o sin emoji
        // delante): así los reconoce el filtro de privacidad de /comentarios y se muestran siempre.
        const prefijo = `🔄 [${currentUser.nombre}]:`;
        const estadoVisual = cliente.estadosRechazo[0] || 'Hay cambios';

        if (!cliente.estadoCambiosCopy) {
          // Cliente sin distinción copy/visual: funcionamiento de siempre
          if (!comentario) {
            return NextResponse.json(
              { error: 'Comentario es requerido para solicitar cambios' },
              { status: 400 }
            );
          }
          nuevoEstado = estadoVisual;
          mensajeComentario = `${prefijo} ${comentario}`;
          break;
        }

        if (tipoCambioBody === 'ambos') {
          if (!comentarioCopy || !comentarioVisual) {
            return NextResponse.json(
              { error: 'Explica tanto los cambios de copy como los visuales' },
              { status: 400 }
            );
          }
          tipoCambio = 'ambos';
          // Una tarea solo puede tener un estado: con los dos tipos va a cambios visuales
          nuevoEstado = estadoVisual;
          comentario = `Copy: ${comentarioCopy}\nVisual: ${comentarioVisual}`;
          mensajeComentario = `${prefijo} (Copy + visual)\n✍️ Copy: ${comentarioCopy}\n🎨 Visual: ${comentarioVisual}`;
        } else if (tipoCambioBody === 'copy' || tipoCambioBody === 'visual') {
          if (!comentario) {
            return NextResponse.json(
              { error: 'Comentario es requerido para solicitar cambios' },
              { status: 400 }
            );
          }
          tipoCambio = tipoCambioBody;
          nuevoEstado = tipoCambio === 'copy' ? cliente.estadoCambiosCopy : estadoVisual;
          mensajeComentario = `${prefijo} (${tipoCambio === 'copy' ? 'Cambio de copy' : 'Cambio visual'}) ${comentario}`;
        } else {
          return NextResponse.json(
            { error: 'Indica si los cambios son de copy, visuales o ambos' },
            { status: 400 }
          );
        }
        break;
      }
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
      tipoCambio,
      comentario: comentario || mensajeComentario,
    });

    // El comentario del cliente se guarda solo en ClickUp (de ahí lo lee el portal).
    // No se duplica en la tabla `comentarios`: saldría repetido en el modal.

    // Registrar la actividad en el log
    const ipAddress = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || null;
    const userAgent = request.headers.get('user-agent') || null;
    
    await logActivity(
      currentUser.id,
      cliente.id,
      accion,
      `Acción ${accion}${tipoCambio ? ` (${tipoCambio})` : ''} en tarea ${tareaId}${comentario ? ': ' + comentario : ''}`,
      tareaId,
      undefined,
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