import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getNotificationService } from '@/lib/notifications';

export async function GET() {
  try {
    // Verificar autenticación de administrador
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const notificationService = getNotificationService();
    
    // Obtener estadísticas de notificaciones
    const pendingNotifications = await notificationService.getPendingNotifications();
    
    // Agrupar por cliente y tipo
    const stats = pendingNotifications.reduce((acc, notification) => {
      const key = `${notification.clienteId}-${notification.tipoNotificacion}`;
      if (!acc[key]) {
        acc[key] = {
          clienteId: notification.clienteId,
          tipo: notification.tipoNotificacion,
          count: 0,
          oldestDate: notification.createdAt
        };
      }
      acc[key].count++;
      if (notification.createdAt < acc[key].oldestDate) {
        acc[key].oldestDate = notification.createdAt;
      }
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      totalPending: pendingNotifications.length,
      byClient: Object.values(stats),
      notifications: pendingNotifications.map(n => ({
        id: n.id,
        clienteId: n.clienteId,
        tipo: n.tipoNotificacion,
        titulo: n.datosPublicacion.titulo,
        createdAt: n.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de notificaciones:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Verificar autenticación de administrador
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('🧪 Prueba manual de envío de notificaciones...');

    const notificationService = getNotificationService();
    
    // Enviar notificaciones pendientes
    await notificationService.sendGroupedNotifications();

    return NextResponse.json({
      success: true,
      message: 'Notificaciones de prueba enviadas correctamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en prueba de notificaciones:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
