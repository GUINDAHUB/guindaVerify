import { getSupabaseService } from './supabase';
import { getEmailService } from './email';
import { getClientUsers } from './auth';

export interface NotificationData {
  tareaId: string;
  titulo: string;
  fechaProgramada?: string;
  estado: string;
  url?: string;
}

export interface PendingNotification {
  id: string;
  clienteId: string;
  tareaId: string;
  tipoNotificacion: 'nueva_publicacion' | 'cambios_implementados' | 'publicacion_actualizada';
  datosPublicacion: NotificationData;
  procesada: boolean;
  createdAt: Date;
}

export class NotificationService {
  private static instance: NotificationService;
  private supabaseService = getSupabaseService();

  // Propiedad para acceder a supabase directamente
  get supabase() {
    return this.supabaseService.supabase;
  }

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Detecta nuevas publicaciones comparando con el último snapshot
   */
  async detectNewPublications(clienteId: string, currentPublications: any[]): Promise<void> {
    try {
      console.log(`🔍 Detectando nuevas publicaciones para cliente: ${clienteId}`);
      
      // Obtener IDs de publicaciones actuales en "pendiente de revisión"
      const currentTaskIds = currentPublications.map(pub => pub.id);
      
      // Obtener último snapshot
      const lastSnapshot = await this.getLastSnapshot(clienteId);
      
      if (!lastSnapshot) {
        // Primera vez - crear snapshot inicial sin notificaciones
        await this.updateSnapshot(clienteId, currentTaskIds);
        console.log(`📸 Snapshot inicial creado para cliente ${clienteId}`);
        return;
      }

      // Detectar nuevas publicaciones (IDs que no estaban en el snapshot anterior)
      const newTaskIds = currentTaskIds.filter(id => !lastSnapshot.tarea_ids.includes(id));
      
      if (newTaskIds.length > 0) {
        console.log(`🆕 Detectadas ${newTaskIds.length} nuevas publicaciones:`, newTaskIds);
        
        // Crear notificaciones para las nuevas publicaciones
        for (const taskId of newTaskIds) {
          const publicacion = currentPublications.find(pub => pub.id === taskId);
          if (publicacion) {
            await this.createNotification(clienteId, 'nueva_publicacion', {
              tareaId: publicacion.id,
              titulo: publicacion.nombre,
              fechaProgramada: publicacion.fechaProgramada,
              estado: publicacion.estado,
              url: publicacion.url
            });
          }
        }
      } else {
        console.log(`✅ No hay nuevas publicaciones para cliente ${clienteId}`);
      }

      // Actualizar snapshot con el estado actual
      await this.updateSnapshot(clienteId, currentTaskIds);

    } catch (error) {
      console.error('❌ Error detectando nuevas publicaciones:', error);
    }
  }

  /**
   * Crea una notificación pendiente
   */
  async createNotification(
    clienteId: string, 
    tipo: 'nueva_publicacion' | 'cambios_implementados' | 'publicacion_actualizada',
    datos: NotificationData
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notificaciones_pendientes')
        .insert({
          cliente_id: clienteId,
          tarea_id: datos.tareaId,
          tipo_notificacion: tipo,
          datos_publicacion: datos,
          procesada: false
        });

      if (error) {
        console.error('❌ Error creando notificación:', error);
        return;
      }

      console.log(`✅ Notificación creada: ${tipo} para tarea ${datos.tareaId}`);
    } catch (error) {
      console.error('❌ Error en createNotification:', error);
    }
  }

  /**
   * Obtiene el último snapshot de un cliente
   */
  private async getLastSnapshot(clienteId: string): Promise<{ tarea_ids: string[] } | null> {
    try {
      const { data, error } = await this.supabase
        .from('snapshots_publicaciones')
        .select('tarea_ids')
        .eq('cliente_id', clienteId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error obteniendo snapshot:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Error en getLastSnapshot:', error);
      return null;
    }
  }

  /**
   * Actualiza el snapshot de un cliente
   */
  private async updateSnapshot(clienteId: string, tareaIds: string[]): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('snapshots_publicaciones')
        .upsert({
          cliente_id: clienteId,
          tarea_ids: tareaIds,
          last_check: new Date().toISOString()
        }, {
          onConflict: 'cliente_id'
        });

      if (error) {
        console.error('❌ Error actualizando snapshot:', error);
        return;
      }

      console.log(`📸 Snapshot actualizado para cliente ${clienteId}: ${tareaIds.length} publicaciones`);
    } catch (error) {
      console.error('❌ Error en updateSnapshot:', error);
    }
  }

  /**
   * Obtiene notificaciones pendientes por cliente y tipo
   */
  async getPendingNotifications(
    clienteId?: string, 
    tipo?: string
  ): Promise<PendingNotification[]> {
    try {
      let query = this.supabase
        .from('notificaciones_pendientes')
        .select('*')
        .eq('procesada', false)
        .order('created_at', { ascending: true });

      if (clienteId) {
        query = query.eq('cliente_id', clienteId);
      }

      if (tipo) {
        query = query.eq('tipo_notificacion', tipo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error obteniendo notificaciones pendientes:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        clienteId: item.cliente_id,
        tareaId: item.tarea_id,
        tipoNotificacion: item.tipo_notificacion,
        datosPublicacion: item.datos_publicacion,
        procesada: item.procesada,
        createdAt: new Date(item.created_at)
      }));
    } catch (error) {
      console.error('❌ Error en getPendingNotifications:', error);
      return [];
    }
  }

  /**
   * Marca notificaciones como procesadas
   */
  async markNotificationsAsProcessed(notificationIds: string[]): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notificaciones_pendientes')
        .update({ 
          procesada: true, 
          processed_at: new Date().toISOString() 
        })
        .in('id', notificationIds);

      if (error) {
        console.error('❌ Error marcando notificaciones como procesadas:', error);
        return;
      }

      console.log(`✅ ${notificationIds.length} notificaciones marcadas como procesadas`);
    } catch (error) {
      console.error('❌ Error en markNotificationsAsProcessed:', error);
    }
  }

  /**
   * Envía notificaciones agrupadas por email
   */
  async sendGroupedNotifications(): Promise<void> {
    try {
      console.log('📧 Iniciando envío de notificaciones agrupadas...');

      // Obtener todas las notificaciones pendientes agrupadas por cliente
      const pendingNotifications = await this.getPendingNotifications();
      
      if (pendingNotifications.length === 0) {
        console.log('✅ No hay notificaciones pendientes para enviar');
        return;
      }

      // Agrupar por cliente
      const notificationsByClient = pendingNotifications.reduce((acc, notification) => {
        if (!acc[notification.clienteId]) {
          acc[notification.clienteId] = [];
        }
        acc[notification.clienteId].push(notification);
        return acc;
      }, {} as Record<string, PendingNotification[]>);

      console.log(`📊 Notificaciones agrupadas para ${Object.keys(notificationsByClient).length} clientes`);

      // Enviar emails por cliente
      for (const [clienteId, notifications] of Object.entries(notificationsByClient)) {
        await this.sendClientNotificationEmail(clienteId, notifications);
      }

    } catch (error) {
      console.error('❌ Error enviando notificaciones agrupadas:', error);
    }
  }

  /**
   * Envía email de notificaciones a un cliente específico
   */
  private async sendClientNotificationEmail(
    clienteId: string, 
    notifications: PendingNotification[]
  ): Promise<void> {
    try {
      console.log(`📧 Enviando notificaciones a cliente ${clienteId}: ${notifications.length} notificaciones`);

      // Obtener información del cliente
      const cliente = await this.supabaseService.getClienteById(clienteId);
      if (!cliente) {
        console.error(`❌ Cliente no encontrado: ${clienteId}`);
        return;
      }

      // Obtener usuarios del cliente con email
      const usuarios = await getClientUsers(clienteId);
      const usuariosConEmail = usuarios.filter(user => user.email && user.activo);

      if (usuariosConEmail.length === 0) {
        console.log(`⚠️ Cliente ${cliente.nombre} no tiene usuarios con email configurado`);
        // Marcar como procesadas aunque no se envíen
        await this.markNotificationsAsProcessed(notifications.map(n => n.id));
        return;
      }

      // Agrupar notificaciones por tipo
      const nuevasPublicaciones = notifications.filter(n => n.tipoNotificacion === 'nueva_publicacion');
      
      if (nuevasPublicaciones.length > 0) {
        await this.sendNewPublicationsEmail(cliente, usuariosConEmail, nuevasPublicaciones);
      }

      // Marcar todas las notificaciones como procesadas
      await this.markNotificationsAsProcessed(notifications.map(n => n.id));

    } catch (error) {
      console.error(`❌ Error enviando email a cliente ${clienteId}:`, error);
    }
  }

  /**
   * Envía email específico para nuevas publicaciones
   */
  private async sendNewPublicationsEmail(
    cliente: any,
    usuarios: any[],
    notifications: PendingNotification[]
  ): Promise<void> {
    try {
      const emailService = getEmailService();
      
      // Reinicializar el servicio para asegurar configuración actualizada
      await emailService.reinitialize();
      
      if (!emailService.isConfigured()) {
        console.log('⚠️ Servicio de email no configurado, saltando envío');
        return;
      }

      const count = notifications.length;
      const subject = count === 1 
        ? `🎨 Nueva publicación lista para revisión - ${cliente.nombre}`
        : `🎨 ${count} nuevas publicaciones listas para revisión - ${cliente.nombre}`;

      // Generar lista de publicaciones
      const publicacionesList = notifications.map(n => {
        const datos = n.datosPublicacion;
        const fechaTexto = datos.fechaProgramada 
          ? new Date(datos.fechaProgramada).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric', 
              month: 'long',
              day: 'numeric'
            })
          : 'Sin fecha programada';
        
        return `
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #4f46e5;">
            <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 16px;">${datos.titulo}</h3>
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              📅 Programada para: <strong>${fechaTexto}</strong>
            </p>
          </div>
        `;
      }).join('');

      const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/cliente/${cliente.codigo}`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Nuevas Publicaciones - ${cliente.nombre}</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0; 
                background-color: #f8fafc;
              }
              .container { 
                max-width: 600px; 
                margin: 20px auto; 
                background: white; 
                border-radius: 12px; 
                overflow: hidden; 
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); 
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
              }
              .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
              .header p { margin: 10px 0 0 0; opacity: 0.9; }
              .content { padding: 30px; }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
              }
              .footer { 
                background: #f8fafc; 
                text-align: center; 
                padding: 20px; 
                color: #6b7280; 
                font-size: 14px; 
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎨 ${count === 1 ? 'Nueva Publicación Lista' : `${count} Nuevas Publicaciones Listas`}</h1>
                <p>Tu equipo de Guinda ha preparado contenido para tu aprobación</p>
              </div>
              <div class="content">
                <p>Hola,</p>
                
                <p>Tu equipo ha preparado <strong>${count} ${count === 1 ? 'nueva publicación' : 'nuevas publicaciones'}</strong> 
                que ${count === 1 ? 'necesita' : 'necesitan'} tu revisión y aprobación:</p>

                ${publicacionesList}

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${portalUrl}" class="cta-button">
                    👆 Revisar y Aprobar Publicaciones
                  </a>
                </div>

                <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                  💡 <strong>Tip:</strong> Puedes aprobar las publicaciones directamente desde tu portal 
                  o solicitar cambios específicos si algo necesita ajustes.
                </p>
              </div>
              <div class="footer">
                <p><strong>GuindaVerify</strong> - Sistema de Gestión de Publicaciones</p>
                <p>Este email se envía automáticamente cuando hay nuevas publicaciones pendientes de revisión.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Enviar a todos los usuarios con email
      const emails = usuariosConEmail.map(user => user.email);
      
      await emailService.sendEmail({
        to: emails,
        subject: subject,
        html: htmlContent
      });

      console.log(`✅ Email de nuevas publicaciones enviado a ${emails.length} usuarios de ${cliente.nombre}`);

    } catch (error) {
      console.error('❌ Error enviando email de nuevas publicaciones:', error);
    }
  }
}

// Instancia singleton
export const notificationService = NotificationService.getInstance();

// Función helper para obtener el servicio
export function getNotificationService(): NotificationService {
  return notificationService;
}
