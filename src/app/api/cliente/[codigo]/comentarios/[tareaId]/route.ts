import { NextRequest, NextResponse } from 'next/server';
import { getClickUpService } from '@/lib/clickup';
import { getSupabaseService } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string; tareaId: string }> }
) {
  try {
    const { codigo, tareaId } = await params;

    // Verificar que el cliente existe y está activo
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

    // Obtener comentarios de ClickUp
    const clickUpService = await getClickUpService();
    const comentariosClickUp = await clickUpService.getComments(tareaId);
    
    // Obtener comentarios de nuestra base de datos
    const comentariosDB = await supabaseService.getComentariosByTarea(tareaId);

    // Combinar y formatear comentarios
    const comentariosCombinados = [
      // Comentarios de ClickUp
      ...comentariosClickUp.map((comment: { 
        id: string; 
        comment_text: string; 
        date: string; 
        user?: { 
          username?: string; 
          email?: string; 
          profilePicture?: string; 
        } 
      }) => ({
        id: comment.id,
        contenido: comment.comment_text,
        fechaCreacion: new Date(parseInt(comment.date)),
        autor: {
          nombre: comment.user?.username || 'Usuario desconocido',
          email: comment.user?.email || '',
          avatar: comment.user?.profilePicture || null,
        },
        fuente: 'clickup',
        tipo: 'comentario',
      })),
      // Comentarios de nuestra DB
      ...comentariosDB.map((comment) => ({
        id: comment.id,
        contenido: comment.contenido,
        fechaCreacion: new Date(comment.fechaCreacion),
        autor: comment.autor,
        fuente: 'sistema',
        tipo: 'accion_cliente',
      })),
    ];

    // Ordenar por fecha (más recientes primero)
    comentariosCombinados.sort((a, b) => 
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );

    return NextResponse.json({
      tareaId,
      comentarios: comentariosCombinados,
      total: comentariosCombinados.length,
    });

  } catch (error) {
    console.error('Error obteniendo comentarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
