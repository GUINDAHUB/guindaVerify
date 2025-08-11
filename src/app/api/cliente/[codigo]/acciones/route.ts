import { NextRequest, NextResponse } from 'next/server';
import { getClickUpService } from '@/lib/clickup';
import { getSupabaseService } from '@/lib/supabase';

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

    const clickUpService = await getClickUpService();

    // Determinar el nuevo estado según la acción
    let nuevoEstado: string;
    let mensajeComentario: string;

    switch (accion) {
      case 'aprobar':
        nuevoEstado = cliente.estadosAprobacion[0] || 'Aprobado';
        mensajeComentario = `✅ Aprobado por ${cliente.nombre}`;
        break;
      case 'hay_cambios':
        if (!comentario) {
          return NextResponse.json(
            { error: 'Comentario es requerido para solicitar cambios' },
            { status: 400 }
          );
        }
        nuevoEstado = cliente.estadosRechazo[0] || 'Hay cambios';
        mensajeComentario = `🔄 ${cliente.nombre} solicita cambios: ${comentario}`;
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

    // Registrar acción en nuestra base de datos
    await supabaseService.createAccionTarea({
      tareaId,
      clienteId: cliente.id,
      accion,
      comentario: comentario || mensajeComentario,
    });

    // Si hay cambios solicitados, también guardarlo en la tabla de comentarios
    if (accion === 'hay_cambios' && comentario) {
      await supabaseService.createComentario({
        tareaId,
        clienteId: cliente.id,
        contenido: comentario,
        autor: {
          nombre: cliente.nombre,
          email: cliente.email || '',
        },
      });
    }

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