import nodemailer from 'nodemailer';
import { getSupabaseService } from './supabase';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  enabled: boolean;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Inicializa el servicio de email con la configuración de la base de datos
   */
  public async initialize(): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const configuracion = await supabaseService.getConfiguracion();

      if (!configuracion) {
        console.warn('⚠️ No se encontró configuración del sistema');
        return;
      }

      // Verificar si la configuración SMTP está completa
      if (!configuracion.smtpHost || !configuracion.smtpUser || !configuracion.smtpPass) {
        console.warn('⚠️ Configuración SMTP incompleta');
        return;
      }

      this.config = {
        host: configuracion.smtpHost,
        port: configuracion.smtpPort || 587,
        secure: configuracion.smtpSecure || false,
        user: configuracion.smtpUser,
        pass: configuracion.smtpPass,
        fromName: configuracion.smtpFromName || 'GuindaVerify',
        fromEmail: configuracion.smtpFromEmail || configuracion.smtpUser,
        enabled: configuracion.smtpEnabled || false
      };

      // Crear el transporter de nodemailer
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.pass
        },
        // Configuraciones adicionales para mejor compatibilidad
        tls: {
          rejectUnauthorized: false // Para servidores con certificados autofirmados
        }
      });

      console.log('✅ Servicio de email inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando servicio de email:', error);
      this.transporter = null;
      this.config = null;
    }
  }

  /**
   * Verifica si el servicio de email está configurado y habilitado
   */
  public isConfigured(): boolean {
    return this.transporter !== null && this.config !== null && this.config.enabled;
  }

  /**
   * Obtiene la configuración actual (sin la contraseña por seguridad)
   */
  public getConfig(): Omit<EmailConfig, 'pass'> | null {
    if (!this.config) return null;
    
    const { pass, ...configSinPassword } = this.config;
    return configSinPassword;
  }

  /**
   * Envía un email
   */
  public async sendEmail(options: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
  }): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Servicio de email no configurado o deshabilitado');
    }

    if (!this.transporter || !this.config) {
      throw new Error('Transporter no inicializado');
    }

    try {
      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || (options.html ? undefined : options.subject)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email enviado exitosamente:', result.messageId);
      
      return result;
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      throw new Error(`Error enviando email: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Envía un email de prueba
   */
  public async sendTestEmail(testEmail: string): Promise<void> {
    const testSubject = '🧪 Email de Prueba - GuindaVerify';
    const currentDate = new Date().toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Email de Prueba</title>
          <link href="https://fonts.googleapis.com/css2?family=Rethink+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Rethink Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              line-height: 1.618;
              color: #1A1A1A;
              margin: 0; 
              padding: 0; 
              background-color: #F2E1E9;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white; 
              border-radius: 24px; 
              overflow: hidden; 
              border: 1px solid #F2E1E9;
              box-shadow: 0 8px 24px rgba(141, 23, 55, 0.12);
            }
            .header { 
              background: linear-gradient(135deg, #8D1737 0%, #E40046 72%);
              color: white; 
              padding: 32px 24px;
              text-align: center; 
            }
            .header h1 { margin: 0; font-size: 28px; font-weight: 800; }
            .header p { margin: 10px 0 0 0; opacity: 0.95; font-size: 16px; font-weight: 500; }
            .content { padding: 30px 24px; }
            .success { 
              background: #E40046;
              color: #FFFFFF;
              padding: 20px; 
              border-radius: 16px;
              margin: 20px 0; 
              text-align: center;
              font-weight: 600;
              font-size: 18px;
            }
            .info { 
              background: #F2E1E9;
              border: 1px solid #E40046;
              padding: 20px; 
              border-radius: 16px;
              margin: 20px 0; 
            }
            .info h3 { 
              margin: 0 0 15px 0; 
              color: #8D1737;
              font-size: 18px;
              font-weight: 700;
            }
            .info ul { 
              margin: 0; 
              padding-left: 20px; 
            }
            .info li { 
              margin: 8px 0; 
              color: #1A1A1A;
            }
            .steps { 
              background: #FFFFFF;
              border: 1px solid #8D1737;
              padding: 20px; 
              border-radius: 16px;
              margin: 20px 0; 
            }
            .steps h3 { 
              margin: 0 0 15px 0; 
              color: #8D1737;
              font-size: 18px;
              font-weight: 700;
            }
            .steps ol { 
              margin: 0; 
              padding-left: 20px; 
            }
            .steps li { 
              margin: 8px 0; 
              color: #1A1A1A;
            }
            .footer { 
              background: #F2E1E9;
              text-align: center; 
              padding: 20px; 
              color: #8D1737;
              font-size: 14px; 
              border-top: 1px solid #E40046;
            }
            .footer p { margin: 5px 0; }
            .badge {
              display: inline-block;
              background: #8D1737;
              color: #FFFFFF;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 600;
              margin: 0 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Email de Prueba</h1>
              <p>GuindaVerify - Sistema de Notificaciones</p>
            </div>
            <div class="content">
              <div class="success">
                ✅ ¡Configuración SMTP Exitosa!
              </div>
              
              <p>¡Excelente! Tu configuración SMTP está funcionando correctamente y ya puedes enviar notificaciones automáticas a tus clientes.</p>
              
              <div class="info">
                <h3>📧 Detalles de la Configuración:</h3>
                <ul>
                  <li><strong>Fecha de prueba:</strong> ${currentDate}</li>
                  <li><strong>Servidor SMTP:</strong> <span class="badge">${this.config?.host}</span></li>
                  <li><strong>Puerto:</strong> <span class="badge">${this.config?.port}</span></li>
                  <li><strong>Seguridad:</strong> <span class="badge">${this.config?.secure ? 'SSL (465)' : 'TLS (587)'}</span></li>
                  <li><strong>Remitente:</strong> ${this.config?.fromName} &lt;${this.config?.fromEmail}&gt;</li>
                </ul>
              </div>
              
              <div class="steps">
                <h3>🚀 Próximos pasos:</h3>
                <ol>
                  <li><strong>Activar notificaciones:</strong> Habilita las notificaciones automáticas en el panel</li>
                  <li><strong>Configurar eventos:</strong> Elige cuándo enviar emails (aprobaciones, cambios, etc.)</li>
                  <li><strong>Personalizar plantillas:</strong> Adapta los mensajes a tu marca</li>
                  <li><strong>Probar con clientes:</strong> Realiza pruebas con algunos clientes de confianza</li>
                </ol>
              </div>
              
              <p style="margin-top: 30px; padding: 15px; background: #F2E1E9; border-radius: 16px; color: #8D1737; border: 1px solid #E40046;">
                <strong>💡 Tip:</strong> Puedes enviar este tipo de emails de prueba cuando quieras verificar que la configuración sigue funcionando correctamente.
              </p>
            </div>
            <div class="footer">
              <p><strong>GuindaVerify</strong> - Sistema de Gestión de Publicaciones</p>
              <p>Este es un email automático de prueba. Si no esperabas recibirlo, puedes ignorarlo.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: testEmail,
      subject: testSubject,
      html: testHtml
    });
  }

  /**
   * Verifica la conexión SMTP
   */
  public async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('❌ Error verificando conexión SMTP:', error);
      return false;
    }
  }

  /**
   * Reinicia el servicio (útil cuando se actualiza la configuración)
   */
  public async reinitialize(): Promise<void> {
    this.transporter = null;
    this.config = null;
    await this.initialize();
  }
}

// Instancia singleton
export const emailService = EmailService.getInstance();

// Función helper para obtener el servicio
export function getEmailService(): EmailService {
  return emailService;
}

// Inicializar el servicio automáticamente (solo en servidor)
if (typeof window === 'undefined') {
  // Solo ejecutar en el servidor
  emailService.initialize().catch(error => {
    console.warn('⚠️ No se pudo inicializar el servicio de email al arrancar:', error.message);
  });
}
