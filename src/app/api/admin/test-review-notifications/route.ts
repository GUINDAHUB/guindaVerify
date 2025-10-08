import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';
import { getClickUpService } from '@/lib/clickup';
import { getNotificationService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 === INICIANDO PRUEBA DE NOTIFICACIONES DE REVISIÓN ===');
    
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
      return NextResponse.json({ 
        error: 'ClickUp API Key no está configurada',
        configured: false 
      }, { status: 400 });
    }

    // Obtener parámetros de la prueba
    const body = await request.json().catch(() => ({}));
    const { clienteId, forceCreateNotifications = false } = body;

    const clickUpService = await getClickUpService();
    const notificationService = getNotificationService();
    
    // Si se especifica un cliente, probar solo ese cliente
    let clientesAProcesar;
    if (clienteId) {
      const cliente = await supabaseService.getClienteById(clienteId);
      if (!cliente) {
        return NextResponse.json({ 
          error: `Cliente con ID ${clienteId} no encontrado` 
        }, { status: 404 });
      }
      clientesAProcesar = [cliente];
    } else {
      // Obtener todos los clientes activos
      const clientes = await supabaseService.getAllClientes();
      clientesAProcesar = clientes.filter((cliente: any) => cliente.activo);
    }
    
    console.log(`👥 Clientes a procesar: ${clientesAProcesar.length}`);

    if (clientesAProcesar.length === 0) {
      return NextResponse.json({ 
        error: 'No hay clientes activos para probar',
        clientesProcesados: 0
      }, { status: 400 });
    }

    const resultadosPorCliente: any[] = [];
    let totalPublicacionesEnRevision = 0;
    let totalNotificacionesCreadas = 0;

    // Procesar cada cliente
    for (const cliente of clientesAProcesar) {
      try {
        console.log(`\n🔍 Procesando cliente: ${cliente.nombre} (${cliente.id})`);
        
        // Verificar que el cliente tenga su List ID configurado
        if (!cliente.clickupListId) {
          console.log(`⚠️ Cliente ${cliente.nombre} no tiene List ID configurado`);
          resultadosPorCliente.push({
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            publicacionesEnRevision: 0,
            notificacionesCreadas: 0,
            error: 'Cliente no tiene List ID de ClickUp configurado'
          });
          continue;
        }
        
        // Obtener TODAS las tareas de ClickUp usando el List ID específico del cliente
        const todasLasTareas = await clickUpService.getAllTasksFromList(
          cliente.clickupListId,
          true // Forzar refresh
        );
        
        console.log(`📋 Total de tareas en ClickUp: ${todasLasTareas.length}`);
        
        // Mostrar todos los estados únicos disponibles
        const estadosUnicos = [...new Set(todasLasTareas.map(tarea => tarea.status?.status).filter(Boolean))];
        console.log(`📊 Estados disponibles en ClickUp:`, estadosUnicos);
        
        // Convertir tareas a formato de publicaciones
        const todasLasPublicaciones = todasLasTareas.map(tarea => 
          clickUpService.convertToTareaPublicacion(tarea)
        );
        
        // Filtrar publicaciones en estado de revisión usando los estados configurados del cliente
        // (igual que hace el portal del cliente)
        let publicacionesEnRevision = (todasLasPublicaciones || []).filter(pub => 
          pub && cliente.estadosVisibles && cliente.estadosVisibles.includes(pub.estado)
        );
        
        // Si el usuario especifica un estado manual, usarlo en su lugar
        if (body.estadoManual) {
          console.log(`🔧 Usando estado manual especificado: ${body.estadoManual}`);
          publicacionesEnRevision = (todasLasPublicaciones || []).filter(pub => 
            pub && pub.estado === body.estadoManual
          );
        }
        
        console.log(`📊 Cliente ${cliente.nombre}:`);
        console.log(`- Total tareas: ${todasLasPublicaciones.length}`);
        console.log(`- Estados visibles configurados: ${cliente.estadosVisibles?.join(', ') || 'Ninguno'}`);
        console.log(`- Estados disponibles en ClickUp:`, estadosUnicos);
        console.log(`- Publicaciones en revisión: ${publicacionesEnRevision.length}`);

        totalPublicacionesEnRevision += publicacionesEnRevision.length;
        
        if (publicacionesEnRevision.length === 0) {
          resultadosPorCliente.push({
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            publicacionesEnRevision: 0,
            notificacionesCreadas: 0,
            estadosDisponibles: estadosUnicos,
            estadosVisiblesConfigurados: cliente.estadosVisibles || [],
            mensaje: 'No hay publicaciones en revisión'
          });
          continue;
        }

        console.log(`📋 Publicaciones en revisión para ${cliente.nombre}: ${publicacionesEnRevision.length}`);
        
        // Mostrar detalles de las publicaciones encontradas
        publicacionesEnRevision.forEach((pub, index) => {
          console.log(`  ${index + 1}. ${pub.nombre} - Estado: ${pub.estado} - Fecha: ${pub.fechaProgramada || 'Sin fecha'}`);
        });

        // Detectar nuevas publicaciones o forzar creación de notificaciones
        if (forceCreateNotifications) {
          console.log(`🔧 Forzando creación de notificaciones para todas las publicaciones...`);
          
          // Crear notificaciones para todas las publicaciones en revisión
          for (const publicacion of publicacionesEnRevision) {
            await notificationService.createNotification(cliente.id, 'nueva_publicacion', {
              tareaId: publicacion.id,
              titulo: publicacion.nombre,
              fechaProgramada: publicacion.fechaProgramada,
              estado: publicacion.estado,
              url: publicacion.url
            });
          }
          
          totalNotificacionesCreadas += publicacionesEnRevision.length;
          
          resultadosPorCliente.push({
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            publicacionesEnRevision: publicacionesEnRevision.length,
            notificacionesCreadas: publicacionesEnRevision.length,
            estadosDisponibles: estadosUnicos,
            estadosVisiblesConfigurados: cliente.estadosVisibles || [],
            publicaciones: publicacionesEnRevision.map(p => ({
              id: p.id,
              nombre: p.nombre,
              estado: p.estado,
              fechaProgramada: p.fechaProgramada
            })),
            mensaje: `Notificaciones forzadas para ${publicacionesEnRevision.length} publicaciones`
          });
        } else {
          // Usar el sistema normal de detección de cambios
          await notificationService.detectNewPublications(cliente.id, publicacionesEnRevision);
          
          // Obtener las notificaciones pendientes creadas
          const notificacionesPendientes = await notificationService.getPendingNotifications(
            cliente.id, 
            'nueva_publicacion'
          );
          
          const notificacionesNuevas = notificacionesPendientes.length;
          totalNotificacionesCreadas += notificacionesNuevas;
          
          resultadosPorCliente.push({
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            publicacionesEnRevision: publicacionesEnRevision.length,
            notificacionesCreadas: notificacionesNuevas,
            estadosDisponibles: estadosUnicos,
            estadosVisiblesConfigurados: cliente.estadosVisibles || [],
            publicaciones: publicacionesEnRevision.map(p => ({
              id: p.id,
              nombre: p.nombre,
              estado: p.estado,
              fechaProgramada: p.fechaProgramada
            })),
            mensaje: notificacionesNuevas > 0 
              ? `${notificacionesNuevas} nuevas notificaciones detectadas`
              : 'No hay cambios desde la última verificación'
          });
        }

        console.log(`✅ Cliente ${cliente.nombre} procesado correctamente`);

      } catch (error) {
        console.error(`❌ Error procesando cliente ${cliente.nombre}:`, error);
        resultadosPorCliente.push({
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          publicacionesEnRevision: 0,
          notificacionesCreadas: 0,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    // Enviar notificaciones por email si hay notificaciones pendientes
    let emailsEnviados = false;
    if (totalNotificacionesCreadas > 0) {
      console.log(`\n📧 Enviando ${totalNotificacionesCreadas} notificaciones por email...`);
      try {
        await notificationService.sendGroupedNotifications();
        emailsEnviados = true;
        console.log(`✅ Emails enviados correctamente`);
      } catch (error) {
        console.error(`❌ Error enviando emails:`, error);
      }
    }

    const resultado = {
      success: true,
      timestamp: new Date().toISOString(),
      configuracion: {
        clickupApiKeyConfigured: !!configuracion.clickupApiKey,
        clientesConListId: clientesAProcesar.filter(c => c.clickupListId).length,
        totalClientes: clientesAProcesar.length
      },
      resumen: {
        clientesProcesados: clientesAProcesar.length,
        totalPublicacionesEnRevision,
        totalNotificacionesCreadas,
        emailsEnviados
      },
      resultadosPorCliente,
      instrucciones: {
        paraForzarNotificaciones: 'Envía { "forceCreateNotifications": true } en el body',
        paraProbarUnCliente: 'Envía { "clienteId": "uuid-del-cliente" } en el body',
        paraUsarEstadoManual: 'Envía { "estadoManual": "nombre-del-estado" } en el body'
      }
    };

    console.log('✅ === PRUEBA COMPLETADA ===');
    console.log(`📊 Resumen: ${clientesAProcesar.length} clientes, ${totalPublicacionesEnRevision} publicaciones en revisión, ${totalNotificacionesCreadas} notificaciones creadas`);

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('❌ Error en prueba de notificaciones:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
