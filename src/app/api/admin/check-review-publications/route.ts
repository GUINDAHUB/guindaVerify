import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';
import { getClickUpService } from '@/lib/clickup';
import { getNotificationService } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 === INICIANDO VERIFICACIÓN DE PUBLICACIONES EN REVISIÓN ===');
    
    const supabaseService = getSupabaseService();
    
    // Obtener configuración del sistema
    const configuracion = await supabaseService.getConfiguracionSistema();
    if (!configuracion) {
      return NextResponse.json({ 
        error: 'Configuración del sistema no encontrada' 
      }, { status: 500 });
    }

    // Verificar que ClickUp esté configurado
    if (!configuracion.clickupApiKey) {
      console.log('⚠️ ClickUp API Key no está configurada');
      return NextResponse.json({ 
        message: 'ClickUp API Key no está configurada',
        configured: false 
      });
    }

    // Obtener todos los clientes activos
    const clientes = await supabaseService.getAllClientes();
    const clientesActivos = clientes.filter((cliente: any) => cliente.activo);
    
    console.log(`👥 Clientes activos encontrados: ${clientesActivos.length}`);

    if (clientesActivos.length === 0) {
      return NextResponse.json({ 
        message: 'No hay clientes activos para verificar',
        clientesVerificados: 0,
        notificacionesCreadas: 0
      });
    }

    const clickUpService = await getClickUpService();
    const notificationService = getNotificationService();
    
    let totalNotificacionesCreadas = 0;
    const resultadosPorCliente: any[] = [];

    // Procesar cada cliente
    for (const cliente of clientesActivos) {
      try {
        console.log(`\n🔍 Verificando cliente: ${cliente.nombre} (${cliente.id})`);
        
        // Verificar que el cliente tenga su List ID configurado
        if (!cliente.clickupListId) {
          console.log(`⚠️ Cliente ${cliente.nombre} no tiene List ID configurado`);
          resultadosPorCliente.push({
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            publicacionesEncontradas: 0,
            notificacionesCreadas: 0,
            error: 'Cliente no tiene List ID de ClickUp configurado'
          });
          continue;
        }
        
        // Obtener TODAS las tareas de ClickUp usando el List ID específico del cliente
        const todasLasTareas = await clickUpService.getAllTasksFromList(
          cliente.clickupListId,
          true // Forzar refresh para obtener datos actualizados
        );
        
        // Convertir tareas a formato de publicaciones
        const todasLasPublicaciones = todasLasTareas.map(tarea => 
          clickUpService.convertToTareaPublicacion(tarea)
        );
        
        // Filtrar publicaciones en estado de revisión usando los estados configurados del cliente
        // (igual que hace el portal del cliente)
        const publicacionesEnRevision = (todasLasPublicaciones || []).filter(pub => 
          pub && cliente.estadosVisibles && cliente.estadosVisibles.includes(pub.estado)
        );
        
        console.log(`📊 Cliente ${cliente.nombre}:`);
        console.log(`- Total tareas: ${todasLasPublicaciones.length}`);
        console.log(`- Estados visibles configurados: ${cliente.estadosVisibles?.join(', ') || 'Ninguno'}`);
        console.log(`- Publicaciones en revisión: ${publicacionesEnRevision.length}`);

        if (publicacionesEnRevision.length === 0) {
          console.log(`ℹ️ No hay publicaciones en revisión para cliente ${cliente.nombre}`);
          resultadosPorCliente.push({
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            publicacionesEncontradas: 0,
            notificacionesCreadas: 0,
            mensaje: 'No hay publicaciones en revisión'
          });
          continue;
        }

        console.log(`📋 Publicaciones en revisión encontradas: ${publicacionesEnRevision.length}`);
        
        // Detectar nuevas publicaciones comparando con el último snapshot
        await notificationService.detectNewPublications(cliente.id, publicacionesEnRevision);
        
        // Obtener las notificaciones pendientes creadas para este cliente
        const notificacionesPendientes = await notificationService.getPendingNotifications(
          cliente.id, 
          'nueva_publicacion'
        );
        
        const notificacionesNuevas = notificacionesPendientes.length;
        totalNotificacionesCreadas += notificacionesNuevas;
        
        resultadosPorCliente.push({
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          publicacionesEncontradas: publicacionesEnRevision.length,
          notificacionesCreadas: notificacionesNuevas,
          mensaje: notificacionesNuevas > 0 
            ? `${notificacionesNuevas} nuevas notificaciones creadas`
            : 'No hay nuevas publicaciones desde la última verificación'
        });

        console.log(`✅ Cliente ${cliente.nombre} procesado: ${notificacionesNuevas} notificaciones creadas`);

      } catch (error) {
        console.error(`❌ Error procesando cliente ${cliente.nombre}:`, error);
        resultadosPorCliente.push({
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          publicacionesEncontradas: 0,
          notificacionesCreadas: 0,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    // Enviar notificaciones por email si hay notificaciones pendientes
    if (totalNotificacionesCreadas > 0) {
      console.log(`\n📧 Enviando ${totalNotificacionesCreadas} notificaciones por email...`);
      await notificationService.sendGroupedNotifications();
    }

    const resultado = {
      success: true,
      timestamp: new Date().toISOString(),
      clientesVerificados: clientesActivos.length,
      totalNotificacionesCreadas,
      resultadosPorCliente,
      mensaje: totalNotificacionesCreadas > 0 
        ? `Se crearon y enviaron ${totalNotificacionesCreadas} notificaciones`
        : 'No hay nuevas publicaciones en revisión'
    };

    console.log('✅ === VERIFICACIÓN COMPLETADA ===');
    console.log(`📊 Resumen: ${clientesActivos.length} clientes verificados, ${totalNotificacionesCreadas} notificaciones creadas`);

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('❌ Error en verificación de publicaciones en revisión:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Permitir que este endpoint sea llamado sin autenticación para cron jobs
export async function POST(request: NextRequest) {
  return GET(request);
}
