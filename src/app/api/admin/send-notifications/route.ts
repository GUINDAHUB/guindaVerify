import { NextRequest, NextResponse } from 'next/server';
import { getNotificationService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Iniciando envío de notificaciones agrupadas...');

    // Verificar que la petición venga de un cron job o tenga autorización
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'guinda-cron-secret-2024';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Acceso no autorizado al endpoint de notificaciones');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const notificationService = getNotificationService();
    
    // Enviar todas las notificaciones pendientes agrupadas
    await notificationService.sendGroupedNotifications();

    console.log('✅ Proceso de notificaciones completado');

    return NextResponse.json({
      success: true,
      message: 'Notificaciones enviadas correctamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en el proceso de notificaciones:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// También permitir GET para pruebas manuales (solo en desarrollo)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Método no permitido en producción' },
      { status: 405 }
    );
  }

  // En desarrollo, permitir GET para pruebas
  return POST(request);
}
