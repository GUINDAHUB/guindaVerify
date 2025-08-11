import { NextRequest, NextResponse } from 'next/server';
import { getClickUpService } from '@/lib/clickup';
import { getSupabaseService } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;

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

    // Obtener TODAS las tareas de ClickUp (no solo las de estados visibles)
    const clickUpService = await getClickUpService();
    const todasLasTareas = await clickUpService.getAllTasksFromList(cliente.clickupListId);

    // Convertir tareas a formato de publicaciones
    const todasLasPublicaciones = todasLasTareas.map(tarea => 
      clickUpService.convertToTareaPublicacion(tarea)
    );

    // Categorizar publicaciones por estado
    const publicacionesPorRevisar = (todasLasPublicaciones || []).filter(pub => 
      pub && cliente.estadosVisibles && cliente.estadosVisibles.includes(pub.estado)
    );

    const publicacionesPendientesCambios = (todasLasPublicaciones || []).filter(pub => 
      pub && cliente.estadosRechazo && cliente.estadosRechazo.includes(pub.estado)
    );

    const publicacionesAprobadas = (todasLasPublicaciones || []).filter(pub => 
      pub && cliente.estadosAprobacion && cliente.estadosAprobacion.includes(pub.estado)
    );

    console.log('📊 Estadísticas de categorización:');
    console.log(`- Total tareas: ${(todasLasPublicaciones || []).length}`);
    console.log(`- Por revisar: ${publicacionesPorRevisar.length}`);
    console.log(`- Pendientes cambios: ${publicacionesPendientesCambios.length}`);
    console.log(`- Aprobadas: ${publicacionesAprobadas.length}`);

    return NextResponse.json({
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        codigo: cliente.codigo,
        clickupListId: cliente.clickupListId,
      },
      publicacionesPorRevisar: publicacionesPorRevisar || [],
      publicacionesPendientesCambios: publicacionesPendientesCambios || [], 
      publicacionesAprobadas: publicacionesAprobadas || [],
      total: {
        porRevisar: (publicacionesPorRevisar || []).length,
        pendientesCambios: (publicacionesPendientesCambios || []).length,
        aprobadas: (publicacionesAprobadas || []).length,
        total: (todasLasPublicaciones || []).length,
      },
    });

  } catch (error) {
    console.error('Error obteniendo publicaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 