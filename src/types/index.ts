// Tipos para la aplicación GuindaVerify

export interface Cliente {
  id: string;
  codigo: string; // Para la URL única
  nombre: string;
  email?: string;
  logoUrl?: string; // URL del logo del cliente
  clickupListId: string;
  estadosVisibles: string[]; // Estados que aparecen en el portal
  estadosAprobacion: string[]; // Estados cuando aprueba
  estadosRechazo: string[]; // Estados cuando rechaza
  activo: boolean;
  dragDropEnabled?: boolean; // Permite arrastrar publicaciones en el calendario
  createdAt: Date;
  updatedAt: Date;
}

export interface ClickUpTask {
  id: string;
  name: string;
  description?: string;
  status: {
    status: string;
    color: string;
    orderindex: number;
    type: string;
  };
  date_created: string;
  date_updated: string;
  date_closed?: string;
  creator: {
    id: number;
    username: string;
    color: string;
    email: string;
    profilePicture?: string;
  };
  assignees: Array<{
    id: number;
    username: string;
    color: string;
    email: string;
    profilePicture?: string;
  }>;
  checklists: Array<{
    id: string;
    name: string;
    items: Array<{
      id: string;
      name: string;
      orderindex: number;
      assignee?: any;
      group_assignee?: any;
      resolved: boolean;
      parent?: string;
      date_created: string;
      children: any[];
    }>;
  }>;
  tags: Array<{
    name: string;
    tag_fg: string;
    tag_bg: string;
    creator: number;
  }>;
  parent?: string;
  priority?: {
    priority: string;
    color: string;
  };
  due_date?: string;
  start_date?: string;
  points?: number;
  time_estimate?: number;
  time_spent?: number;
  custom_fields: Array<{
    id: string;
    name: string;
    type: string;
    type_config: any;
    date_created: string;
    hide_from_guests: boolean;
    value: any;
  }>;
  dependencies: any[];
  linked_tasks: any[];
  team_id: string;
  url: string;
  permission_level: string;
  list: {
    id: string;
    name: string;
    access: boolean;
  };
  project: {
    id: string;
    name: string;
    hidden: boolean;
    access: boolean;
  };
  folder: {
    id: string;
    name: string;
    hidden: boolean;
    access: boolean;
  };
  space: {
    id: string;
    name: string;
    access: boolean;
  };
}

export interface TareaPublicacion {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: string;
  colorEstado: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  creador: {
    nombre: string;
    email: string;
    avatar?: string;
  };
  asignados: Array<{
    nombre: string;
    email: string;
    avatar?: string;
  }>;
  etiquetas: Array<{
    nombre: string;
    color: string;
  }>;
  url: string;
  // Campos específicos para publicaciones
  tipoPublicacion?: string;
  plataformaPublicacion?: string[];  // Array para múltiples plataformas
  imagenPreview?: string;
  textoPublicacion?: string;
  fechaProgramada?: string;
  enlaceDrive?: string;
  comentarios?: string;
  urlPublicacion?: string;
  // Nuevos campos
  descripcionPublicacion?: string;  // Copy para el pie de publicación en redes
  urlStories?: string;  // URL para las stories
}

export interface UsuarioCliente {
  id: string;
  clienteId: string;
  nombre: string;
  username: string;
  esAdminCliente: boolean;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comentario {
  id: string;
  tareaId: string;
  clienteId: string;
  usuarioId?: string; // Nuevo campo para trazabilidad
  contenido: string;
  fechaCreacion: Date;
  autor: {
    nombre: string;
    email: string;
  };
}

export interface AccionTarea {
  id?: string; // Agregar id opcional
  tareaId: string;
  clienteId: string;
  usuarioId?: string; // Nuevo campo para trazabilidad
  accion: 'aprobar' | 'hay_cambios';
  comentario?: string;
  fechaAccion: Date;
}

export interface LogActividad {
  id: string;
  usuarioId?: string;
  clienteId: string;
  accion: string;
  detalles?: string;
  tareaId?: string;
  comentarioId?: string;
  accionTareaId?: string;
  ipAddress?: string;
  userAgent?: string;
  fecha: Date;
}

export interface ConfiguracionSistema {
  clickupApiKey: string;
  clickupWorkspaceId: string;
  supabaseUrl: string;
  supabaseKey: string;
  estadosPorDefecto: {
    pendienteRevision: string;
    aprobado: string;
    rechazado: string;
  };
} 