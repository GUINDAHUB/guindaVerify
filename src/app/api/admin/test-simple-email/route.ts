import { NextRequest, NextResponse } from 'next/server';
import { getEmailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    const emailService = getEmailService();
    
    // Reinicializar el servicio
    await emailService.reinitialize();

    if (!emailService.isConfigured()) {
      return NextResponse.json(
        { error: 'Servicio de email no configurado' },
        { status: 400 }
      );
    }

    // Email simple similar al de notificaciones pero sin elementos complejos
    const subject = '🎨 4 Nuevas Publicaciones Listas - Plantilla Clickup';
    
    const simpleHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Nuevas Publicaciones</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
            <h1 style="color: #4f46e5;">🎨 4 Nuevas Publicaciones Listas</h1>
            <p>Tu equipo de Guinda ha preparado contenido para tu aprobación</p>
            
            <p>Hola,</p>
            
            <p>Tu equipo ha preparado <strong>4 nuevas publicaciones</strong> que necesitan tu revisión y aprobación:</p>

            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <h3 style="margin: 0 0 8px 0; color: #1e293b;">[REEL] jsjsjdjd</h3>
              <p style="margin: 0; color: #64748b;">📅 Programada para: 5 de septiembre de 2025</p>
            </div>

            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <h3 style="margin: 0 0 8px 0; color: #1e293b;">[STORIE] NUEVO</h3>
              <p style="margin: 0; color: #64748b;">📅 Programada para: 23 de septiembre de 2025</p>
            </div>

            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <h3 style="margin: 0 0 8px 0; color: #1e293b;">[REEL] asdasdkoasdlasd</h3>
              <p style="margin: 0; color: #64748b;">📅 Programada para: 3 de septiembre de 2025</p>
            </div>

            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <h3 style="margin: 0 0 8px 0; color: #1e293b;">[PUBLICACION] Estado de vacaciones</h3>
              <p style="margin: 0; color: #64748b;">📅 Programada para: 4 de septiembre de 2025</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3001/cliente/plantilla" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                👆 Revisar y Aprobar Publicaciones
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px;">
              💡 <strong>Tip:</strong> Puedes aprobar las publicaciones directamente desde tu portal.
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="text-align: center; color: #6b7280; font-size: 14px;">
              <strong>GuindaVerify</strong> - Sistema de Gestión de Publicaciones<br>
              Este email se envía automáticamente cuando hay nuevas publicaciones pendientes de revisión.
            </p>
          </div>
        </body>
      </html>
    `;

    await emailService.sendEmail({
      to: email,
      subject: subject,
      html: simpleHtml
    });

    return NextResponse.json({
      message: `Email de notificaciones simple enviado exitosamente a ${email}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error enviando email simple:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
