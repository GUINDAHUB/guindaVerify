import { createClient } from '@supabase/supabase-js';
import { Cliente, Comentario, AccionTarea } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
        estados_aprobacion: cliente.estadosAprobacion,
        estados_rechazo: cliente.estadosRechazo,
        activo: cliente.activo,
        drag_drop_enabled: cliente.dragDropEnabled ?? true
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
      if (updates.estadosAprobacion) updatesDB.estados_aprobacion = updates.estadosAprobacion;
      if (updates.estadosRechazo) updatesDB.estados_rechazo = updates.estadosRechazo;
      if (updates.activo !== undefined) updatesDB.activo = updates.activo;
      if (updates.dragDropEnabled !== undefined) updatesDB.drag_drop_enabled = updates.dragDropEnabled;
      
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
      estadosAprobacion: data.estados_aprobacion || [],
      estadosRechazo: data.estados_rechazo || [],
      activo: data.activo,
      dragDropEnabled: data.drag_drop_enabled ?? true,
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

    // Intentar crear la configuración por defecto
    try {
      await this.updateConfiguracionSistema(defaultConfig);
    } catch (error) {
      console.error('Error creando configuración por defecto:', error);
    }

    return defaultConfig;
  }

  async updateConfiguracionSistema(config: any): Promise<boolean> {
    try {
      // Convertir camelCase a snake_case para la base de datos
      const dbConfig = {
        id: config.id || '00000000-0000-0000-0000-000000000000',
        clickup_api_key: config.clickupApiKey || null,
        clickup_workspace_id: config.clickupWorkspaceId || null,
        estados_por_defecto: config.estadosPorDefecto || {
          pendiente_revision: 'Pendiente de Revisión',
          aprobado: 'Aprobado',
          rechazado: 'Rechazado'
        },
        // Configuración SMTP
        smtp_host: config.smtpHost || null,
        smtp_port: config.smtpPort || null,
        smtp_secure: config.smtpSecure || null,
        smtp_user: config.smtpUser || null,
        smtp_pass: config.smtpPass || null,
        smtp_from_name: config.smtpFromName || null,
        smtp_from_email: config.smtpFromEmail || null,
        smtp_enabled: config.smtpEnabled || null,
        updated_at: new Date().toISOString()
      };

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