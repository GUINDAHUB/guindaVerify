import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';
import { getNotificationService } from '@/lib/notifications';
import { getEmailService } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 === DIAGNÓSTICO SIMPLE DE EMAILS ===');
    
    const supabaseService = getSupabaseService();
    const notificationService = getNotificationService();
    const emailService = getEmailService();
    
    // Verificar configuración de email
    const emailConfig = emailService.getConfig();
    const emailConfigured = emailService.isConfigured();
    
    // Obtener cliente "Plantilla Clickup"
    const clientes = await supabaseService.getAllClientes();
    const plantillaCliente = clientes.find(c => c.nombre === 'Plantilla Clickup');
    
    if (!plantillaCliente) {
      return NextResponse.json({
        error: 'Cliente "Plantilla Clickup" no encontrado'
      }, { status: 404 });
    }
    
    // Obtener notificaciones pendientes para este cliente
    const notificacionesPendientes = await notificationService.getPendingNotifications(
      plantillaCliente.id
    );
    
    const diagnostico = {
      timestamp: new Date().toISOString(),
      cliente: {
        id: plantillaCliente.id,
        nombre: plantillaCliente.nombre,
        email: 'javier@somosguinda.com'
      },
      configuracionEmail: {
        configurado: emailConfigured,
        host: emailConfig?.host || 'No configurado',
        fromEmail: emailConfig?.fromEmail || 'No configurado',
        enabled: emailConfig?.enabled || false
      },
      notificaciones: {
        pendientes: notificacionesPendientes.length,
        detallesPendientes: notificacionesPendientes.map(n => ({
          id: n.id,
          tipo: n.tipoNotificacion,
          tareaId: n.tareaId,
          titulo: n.datosPublicacion.titulo,
          createdAt: n.createdAt
        }))
      },
      analisis: {
        hayNotificacionesPendientes: notificacionesPendientes.length > 0,
        puedeEnviarEmails: emailConfigured
      }
    };
    
    // Generar recomendaciones específicas
    const recomendaciones = [];
    
    if (!emailConfigured) {
      recomendaciones.push('❌ Email no configurado correctamente');
    } else {
      recomendaciones.push('✅ Email configurado correctamente');
    }
    
    if (notificacionesPendientes.length > 0) {
      recomendaciones.push(`📧 Hay ${notificacionesPendientes.length} notificaciones pendientes de enviar`);
      recomendaciones.push('💡 Ejecuta el endpoint de envío de notificaciones para enviar estos emails');
    } else {
      recomendaciones.push('✅ No hay notificaciones pendientes');
    }
    
    diagnostico.recomendaciones = recomendaciones;
    
    return NextResponse.json(diagnostico);

  } catch (error) {
    console.error('❌ Error en diagnóstico de email logs:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
