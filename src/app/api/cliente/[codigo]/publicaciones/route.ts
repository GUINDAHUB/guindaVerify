import { NextRequest, NextResponse } from 'next/server';
import { getClickUpService } from '@/lib/clickup';
import { getSupabaseService } from '@/lib/supabase';
import { getNotificationService } from '@/lib/notifications';
import { getClientUserForCodigo } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    console.log(`📡 API Publicaciones - Cliente: ${codigo}, ForceRefresh: ${forceRefresh}`);

    // Solo usuarios con sesión de este cliente
    if (!(await getClientUserForCodigo(codigo))) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
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

    // Obtener TODAS las tareas de ClickUp (con opción de refresh forzado)
    const clickUpService = await getClickUpService();
    const todasLasTareas = await clickUpService.getAllTasksFromList(cliente.clickupListId, forceRefresh);

    // Convertir tareas a formato de publicaciones
    const todasLasPublicaciones = todasLasTareas.map(tarea => 
      clickUpService.convertToTareaPublicacion(tarea)
    );

    // Función para ordenar publicaciones por fecha programada (más próximas primero)
    const ordenarPorFecha = (publicaciones: any[]) => {
      return publicaciones.sort((a, b) => {
        // Si no tienen fecha programada, van al final
        if (!a.fechaProgramada && !b.fechaProgramada) return 0;
        if (!a.fechaProgramada) return 1;
        if (!b.fechaProgramada) return -1;
        
        // Ordenar por fecha programada (más próxima primero - orden ascendente)
        const fechaA = new Date(a.fechaProgramada);
        const fechaB = new Date(b.fechaProgramada);
        return fechaA.getTime() - fechaB.getTime();
      });
    };

    // Categorizar y ordenar publicaciones por estado
    const publicacionesSinEmpezar = ordenarPorFecha(
      (todasLasPublicaciones || []).filter(pub => 
        pub && cliente.clickupStatusNotStarted && pub.estado === cliente.clickupStatusNotStarted
      )
    );

    const publicacionesPorRevisar = ordenarPorFecha(
      (todasLasPublicaciones || []).filter(pub => 
        pub && cliente.estadosVisibles && cliente.estadosVisibles.includes(pub.estado)
      )
    );

    const publicacionesPendientesCambios = ordenarPorFecha(
      (todasLasPublicaciones || []).filter(pub => 
        pub && cliente.estadosRechazo && cliente.estadosRechazo.includes(pub.estado)
      )
    );

    const publicacionesAprobadas = ordenarPorFecha(
      (todasLasPublicaciones || []).filter(pub => 
        pub && cliente.estadosAprobacion && cliente.estadosAprobacion.includes(pub.estado)
      )
    );

    // 📊 Estadísticas de categorización (desactivado para reducir logs)
    // console.log('📊 Estadísticas de categorización:');
    // console.log(`- Total tareas: ${(todasLasPublicaciones || []).length}`);
    // console.log(`- Sin empezar: ${publicacionesSinEmpezar.length}`);
    // console.log(`- Por revisar: ${publicacionesPorRevisar.length}`);
    // console.log(`- Pendientes cambios: ${publicacionesPendientesCambios.length}`);
    // console.log(`- Aprobadas: ${publicacionesAprobadas.length}`);

    // 🔔 Detectar nuevas publicaciones para notificaciones (DESACTIVADO TEMPORALMENTE)
    // try {
    //   const notificationService = getNotificationService();
    //   await notificationService.detectNewPublications(cliente.id, publicacionesPorRevisar);
    // } catch (error) {
    //   console.error('⚠️ Error detectando nuevas publicaciones para notificaciones:', error);
    //   // No fallar la respuesta principal por un error de notificaciones
    // }

    return NextResponse.json({
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        codigo: cliente.codigo,
        logoUrl: cliente.logoUrl,
        clickupListId: cliente.clickupListId,
        clickupStatusNotStarted: cliente.clickupStatusNotStarted,
        dragDropEnabled: cliente.dragDropEnabled ?? true,
      },
      publicacionesSinEmpezar: publicacionesSinEmpezar || [],
      publicacionesPorRevisar: publicacionesPorRevisar || [],
      publicacionesPendientesCambios: publicacionesPendientesCambios || [], 
      publicacionesAprobadas: publicacionesAprobadas || [],
      total: {
        sinEmpezar: (publicacionesSinEmpezar || []).length,
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