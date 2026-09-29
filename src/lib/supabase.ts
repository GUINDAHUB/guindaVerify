import { createClient } from '@supabase/supabase-js';
import { Cliente, Comentario, AccionTarea } from '@/types';

// Este módulo solo se usa en el servidor (API routes y server components).
// Usa la clave secreta de Supabase, que ignora RLS: la BD está cerrada al rol anon
// y todo el acceso pasa por aquí. NUNCA importar desde un componente "use client".
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export class SupabaseService {
  // Clientes
  async getClienteByCodigo(codigo: string): Promise<Cliente | null> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('codigo', codigo)
        .eq('activo', true)
        .single();

      if (error) {
        console.error('Error obteniendo cliente:', error);
        return null;
      }

      return this.convertClienteFromDB(data);
    } catch (error) {
      console.error('Error en getClienteByCodigo:', error);
      return null;
    }
  }

  async getClienteById(id: string): Promise<Cliente | null> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error obteniendo cliente por ID:', error);
        return null;
      }

      return this.convertClienteFromDB(data);
    } catch (error) {
      console.error('Error en getClienteById:', error);
      return null;
    }
  }

  async getAllClientes(): Promise<Cliente[]> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre');

      if (error) {
        console.error('Error obteniendo clientes:', error);
        return [];
      }

      return (data || []).map(cliente => this.convertClienteFromDB(cliente));
    } catch (error) {
      console.error('Error en getAllClientes:', error);
      return [];
    }
  }

  async createCliente(cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente | null> {
    try {
      // Convertir camelCase a snake_case para la base de datos
      const clienteDB = {
        codigo: cliente.codigo,
        nombre: cliente.nombre,
        email: cliente.email,
        logo_url: cliente.logoUrl,
        clickup_list_id: cliente.clickupListId,
        estados_visibles: cliente.estadosVisibles,
        clickup_status_not_started: cliente.clickupStatusNotStarted,
        estados_aprobacion: cliente.estadosAprobacion,
        estados_rechazo: cliente.estadosRechazo,
        activo: cliente.activo,
        drag_drop_enabled: cliente.dragDropEnabled ?? true,
        notify_new_publications: cliente.notifyNewPublications ?? false,
        notify_new_comments: cliente.notifyNewComments ?? false
      };

      const { data, error } = await supabase
        .from('clientes')
        .insert([clienteDB])
        .select()
        .single();

      if (error) {
        console.error('Error creando cliente:', error);
        return null;
      }

      // Convertir snake_case a camelCase para el frontend
      return this.convertClienteFromDB(data);
    } catch (error) {
      console.error('Error en createCliente:', error);
      return null;
    }
  }

  async updateCliente(id: string, updates: Partial<Cliente>): Promise<Cliente | null> {
    try {
      // Convertir camelCase a snake_case para la base de datos
      const updatesDB: any = {};
      if (updates.codigo) updatesDB.codigo = updates.codigo;
      if (updates.nombre) updatesDB.nombre = updates.nombre;
      if (updates.email !== undefined) updatesDB.email = updates.email;
      if (updates.logoUrl !== undefined) updatesDB.logo_url = updates.logoUrl;
      if (updates.clickupListId) updatesDB.clickup_list_id = updates.clickupListId;
      if (updates.estadosVisibles) updatesDB.estados_visibles = updates.estadosVisibles;
      if (updates.clickupStatusNotStarted) updatesDB.clickup_status_not_started = updates.clickupStatusNotStarted;
      if (updates.estadosAprobacion) updatesDB.estados_aprobacion = updates.estadosAprobacion;
      if (updates.estadosRechazo) updatesDB.estados_rechazo = updates.estadosRechazo;
      if (updates.activo !== undefined) updatesDB.activo = updates.activo;
      if (updates.dragDropEnabled !== undefined) updatesDB.drag_drop_enabled = updates.dragDropEnabled;
      if (updates.notifyNewPublications !== undefined) updatesDB.notify_new_publications = updates.notifyNewPublications;
      if (updates.notifyNewComments !== undefined) updatesDB.notify_new_comments = updates.notifyNewComments;
      
      updatesDB.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('clientes')
        .update(updatesDB)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando cliente:', error);
        return null;
      }

      return this.convertClienteFromDB(data);
    } catch (error) {
      console.error('Error en updateCliente:', error);
      return null;
    }
  }

  async deleteCliente(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error eliminando cliente:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en deleteCliente:', error);
      return false;
    }
  }

  // Método auxiliar para convertir datos de la base de datos (snake_case) a camelCase
  private convertClienteFromDB(data: any): Cliente {
    return {
      id: data.id,
      codigo: data.codigo,
      nombre: data.nombre,
      email: data.email,
      logoUrl: data.logo_url,
      clickupListId: data.clickup_list_id,
      estadosVisibles: data.estados_visibles || [],
      clickupStatusNotStarted: data.clickup_status_not_started,
      estadosAprobacion: data.estados_aprobacion || [],
      estadosRechazo: data.estados_rechazo || [],
      activo: data.activo,
      dragDropEnabled: data.drag_drop_enabled ?? true,
      notifyNewPublications: data.notify_new_publications ?? false,
      notifyNewComments: data.notify_new_comments ?? false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Comentarios
  async getComentariosByTarea(tareaId: string): Promise<Comentario[]> {
    try {
      const { data, error } = await supabase
        .from('comentarios')
        .select('*')
        .eq('tarea_id', tareaId)
        .order('fecha_creacion', { ascending: false });

      if (error) {
        console.error('Error obteniendo comentarios:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error en getComentariosByTarea:', error);
      return [];
    }
  }

  async createComentario(comentario: Omit<Comentario, 'id' | 'fechaCreacion'>): Promise<Comentario | null> {
    try {
      const { data, error } = await supabase
        .from('comentarios')
        .insert([{ ...comentario, fechaCreacion: new Date().toISOString() }])
        .select()
        .single();

      if (error) {
        console.error('Error creando comentario:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en createComentario:', error);
      return null;
    }
  }

  // Acciones de tareas
  async createAccionTarea(accion: Omit<AccionTarea, 'fechaAccion'>): Promise<AccionTarea | null> {
    try {
      const { data, error } = await supabase
        .from('acciones_tareas')
        .insert([{ ...accion, fechaAccion: new Date().toISOString() }])
        .select()
        .single();

      if (error) {
        console.error('Error creando acción de tarea:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en createAccionTarea:', error);
      return null;
    }
  }

  async getAccionesByTarea(tareaId: string): Promise<AccionTarea[]> {
    try {
      const { data, error } = await supabase
        .from('acciones_tareas')
        .select('*')
        .eq('tareaId', tareaId)
        .order('fechaAccion', { ascending: false });

      if (error) {
        console.error('Error obteniendo acciones de tarea:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAccionesByTarea:', error);
      return [];
    }
  }

  // Configuración del sistema
  async getConfiguracion(): Promise<any> {
    return this.getConfiguracionSistema();
  }

  async getConfiguracionSistema(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('configuracion_sistema')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error obteniendo configuración:', error);
        // Si no hay configuración, crear una por defecto
        return this.createDefaultConfig();
      }

      // Convertir snake_case a camelCase para compatibilidad con el frontend
      if (data) {
        return {
          id: data.id,
          clickupApiKey: data.clickup_api_key,
          clickupWorkspaceId: data.clickup_workspace_id,
          estadosPorDefecto: data.estados_por_defecto,
          // Configuración SMTP
          smtpHost: data.smtp_host,
          smtpPort: data.smtp_port,
          smtpSecure: data.smtp_secure,
          smtpUser: data.smtp_user,
          smtpPass: data.smtp_pass,
          smtpFromName: data.smtp_from_name,
          smtpFromEmail: data.smtp_from_email,
          smtpEnabled: data.smtp_enabled,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }

      return this.createDefaultConfig();
    } catch (error) {
      console.error('Error en getConfiguracionSistema:', error);
      return this.createDefaultConfig();
    }
  }

  private async createDefaultConfig(): Promise<any> {
    const defaultConfig = {
      id: '00000000-0000-0000-0000-000000000000',
      clickupApiKey: '',
      clickupWorkspaceId: '',
      estadosPorDefecto: {
        pendiente_revision: 'Pendiente de Revisión',
        aprobado: 'Aprobado',
        rechazado: 'Rechazado'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // No se escribe en la BD: si la lectura falló por un error puntual,
    // guardar estos valores vacíos borraría la configuración real (API key, SMTP).
    return defaultConfig;
  }

  async updateConfiguracionSistema(config: any): Promise<boolean> {
    try {
      // Convertir camelCase a snake_case para la base de datos.
      // Solo se escriben los campos que vienen en `config`: un campo ausente (undefined)
      // conserva su valor actual en vez de quedar a null.
      const campos: Record<string, string> = {
        clickupApiKey: 'clickup_api_key',
        clickupWorkspaceId: 'clickup_workspace_id',
        estadosPorDefecto: 'estados_por_defecto',
        smtpHost: 'smtp_host',
        smtpPort: 'smtp_port',
        smtpSecure: 'smtp_secure',
        smtpUser: 'smtp_user',
        smtpPass: 'smtp_pass',
        smtpFromName: 'smtp_from_name',
        smtpFromEmail: 'smtp_from_email',
        smtpEnabled: 'smtp_enabled',
      };

      const dbConfig: Record<string, any> = {
        id: config.id || '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString()
      };
      for (const [campo, columna] of Object.entries(campos)) {
        if (config[campo] !== undefined) {
          dbConfig[columna] = config[campo] === '' ? null : config[campo];
        }
      }

      const { error } = await supabase
        .from('configuracion_sistema')
        .upsert([dbConfig], { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error actualizando configuración:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en updateConfiguracionSistema:', error);
      return false;
    }
  }
}

// Instancia singleton del servicio
let supabaseService: SupabaseService | null = null;

export function getSupabaseService(): SupabaseService {
  if (!supabaseService) {
    supabaseService = new SupabaseService();
  }
  return supabaseService;
} 