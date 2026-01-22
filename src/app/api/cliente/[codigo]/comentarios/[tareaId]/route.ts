import { NextRequest, NextResponse } from 'next/server';
import { getClickUpService } from '@/lib/clickup';
import { getSupabaseService } from '@/lib/supabase';
import { getCurrentClientUser } from '@/lib/auth';

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

    // Obtener información del usuario del cliente actual
    const currentUser = await getCurrentClientUser();

    // Obtener comentarios de ClickUp
    const clickUpService = await getClickUpService();
    const comentariosClickUp = await clickUpService.getComments(tareaId);
    
    // Obtener comentarios de nuestra base de datos
    const comentariosDB = await supabaseService.getComentariosByTarea(tareaId);

    // Fecha de corte para el sistema de privacidad híbrido: 21 de Enero 2026 a las 18:00
    const CUTOFF_TIMESTAMP = new Date('2026-01-21T18:00:00').getTime();

    // Función para detectar si un comentario de ClickUp es realmente del cliente
    const esComentarioDelCliente = (contenido: string) => {
      // Buscar el patrón [Usuario]: en cualquier parte del contenido (puede haber emojis antes)
      return /\[.+\]:\s/.test(contenido);
    };

    // Función para extraer el nombre del usuario del comentario del cliente
    const extraerNombreUsuario = (contenido: string) => {
      const match = contenido.match(/\[(.+)\]:/);
      return match ? match[1] : null;
    };

    // Combinar y formatear comentarios
    const comentariosCombinados = [
      // Comentarios de ClickUp con filtrado híbrido
      ...comentariosClickUp
        .map((comment: { 
          id: string; 
          comment_text: string; 
          date: string; 
          user?: { 
            username?: string; 
            email?: string; 
            profilePicture?: string; 
          } 
        }) => {
          const commentTimestamp = parseInt(comment.date);
          const esDelCliente = esComentarioDelCliente(comment.comment_text);
          
          if (esDelCliente) {
            // Es un comentario del cliente enviado a través de ClickUp
            const nombreUsuario = extraerNombreUsuario(comment.comment_text);
            return {
              id: comment.id,
              contenido: comment.comment_text,
              fechaCreacion: new Date(commentTimestamp),
              autor: {
                nombre: nombreUsuario || cliente.nombre,
                email: cliente.email || '',
                avatar: cliente.logoUrl || null,
              },
              fuente: 'cliente_via_clickup',
              tipo: 'comentario_cliente',
              shouldShow: true, // Los comentarios del cliente siempre se muestran
            };
          } else {
            // Es un comentario del admin en ClickUp - aplicar lógica de privacidad
            let contenidoFinal = comment.comment_text;
            let shouldShow = false;
            
            if (commentTimestamp < CUTOFF_TIMESTAMP) {
              // Comentario antiguo: mostrar tal cual (mantener historial)
              shouldShow = true;
            } else {
              // Comentario nuevo: solo mostrar si incluye ///
              if (comment.comment_text.includes('///')) {
                shouldShow = true;
                // Limpiar las tres barras del texto final
                contenidoFinal = comment.comment_text.replace(/\/\/\//g, '');
              }
            }
            
            return {
              id: comment.id,
              contenido: contenidoFinal,
              fechaCreacion: new Date(commentTimestamp),
              autor: {
                nombre: comment.user?.username || 'Usuario desconocido',
                email: comment.user?.email || '',
                avatar: comment.user?.profilePicture || null,
              },
              fuente: 'clickup',
              tipo: 'comentario',
              shouldShow,
            };
          }
        })
        .filter((comment: any) => comment.shouldShow), // Filtrar solo los que deben mostrarse
      // Comentarios de nuestra DB (clientes directos)
      ...comentariosDB.map((comment) => ({
        id: comment.id,
        contenido: `[${comment.autor?.nombre || 'Usuario'}]: ${comment.contenido}`,
        fechaCreacion: new Date(comment.fechaCreacion),
        autor: {
          nombre: comment.autor?.nombre || currentUser?.nombre || cliente.nombre,
          email: comment.autor?.email || currentUser?.username || '',
          avatar: cliente.logoUrl || null,
        },
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
