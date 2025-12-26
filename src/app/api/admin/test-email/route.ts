import { NextRequest, NextResponse } from 'next/server';
import { getEmailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validar que se proporcione un email
    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Obtener el servicio de email
    const emailService = getEmailService();
    
    // Reinicializar el servicio para obtener la configuración más reciente
    await emailService.reinitialize();

    // Verificar si está configurado
    if (!emailService.isConfigured()) {
      return NextResponse.json(
        { error: 'Servicio de email no configurado o deshabilitado. Verifica la configuración SMTP.' },
        { status: 400 }
      );
    }

    // Verificar conexión SMTP
    const connectionOk = await emailService.verifyConnection();
    if (!connectionOk) {
      return NextResponse.json(
        { error: 'No se pudo conectar al servidor SMTP. Verifica la configuración.' },
        { status: 400 }
      );
    }

    // Enviar email de prueba
    await emailService.sendTestEmail(email);

    return NextResponse.json({
      message: `Email de prueba enviado exitosamente a ${email}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error enviando email de prueba:', error);
    
    // Proporcionar mensajes de error más específicos
    let errorMessage = 'Error interno del servidor';
    
    if (error instanceof Error) {
      if (error.message.includes('authentication')) {
        errorMessage = 'Error de autenticación SMTP. Verifica usuario y contraseña.';
      } else if (error.message.includes('connection')) {
        errorMessage = 'Error de conexión SMTP. Verifica host y puerto.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Timeout de conexión SMTP. Verifica la configuración de red.';
      } else {
        errorMessage = `Error enviando email: ${error.message}`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


