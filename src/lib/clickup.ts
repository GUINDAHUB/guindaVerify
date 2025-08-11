import axios from 'axios';
import { ClickUpTask, TareaPublicacion } from '@/types';
import { getSupabaseService } from './supabase';

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

export class ClickUpService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Authorization': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  // Obtener tareas de una lista específica
  async getTasksFromList(listId: string, statuses?: string[]): Promise<ClickUpTask[]> {
    try {
      console.log(`🔍 Obteniendo tareas de la lista: ${listId}`);
      console.log(`📋 Estados filtrados:`, statuses);
      
      const params = new URLSearchParams({
        include_closed: 'false',
        subtasks: 'false',
      });

      if (statuses && statuses.length > 0) {
        // Enviar cada estado como un parámetro separado
        statuses.forEach(status => {
          params.append('statuses[]', status);
        });
      }

      const url = `${CLICKUP_API_BASE}/list/${listId}/task?${params.toString()}`;
      console.log(`📡 URL de la petición: ${url}`);

      const response = await axios.get(url, { headers: this.getHeaders() });

      console.log(`✅ Tareas obtenidas: ${response.data.tasks?.length || 0}`);
      return response.data.tasks || [];
    } catch (error: any) {
      console.error('❌ Error obteniendo tareas de ClickUp:', error);
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.err || error.message;
        
        if (status === 404) {
          throw new Error(`Lista con ID "${listId}" no encontrada. Verifica que el List ID sea correcto.`);
        } else if (status === 401) {
          throw new Error('API Key inválida. Verifica que la API Key sea correcta.');
        } else if (status === 403) {
          throw new Error('No tienes permisos para acceder a esta lista.');
        } else {
          throw new Error(`Error de ClickUp (${status}): ${message}`);
        }
      } else if (error.request) {
        throw new Error('No se pudo conectar con ClickUp. Verifica tu conexión a internet.');
      } else {
        throw new Error(`Error de configuración: ${error.message}`);
      }
    }
  }

  // Obtener TODAS las tareas de una lista (sin filtrar por estados)
  async getAllTasksFromList(listId: string): Promise<ClickUpTask[]> {
    try {
      console.log(`🔍 Obteniendo TODAS las tareas de la lista: ${listId}`);
      
      const params = new URLSearchParams({
        include_closed: 'false',
        subtasks: 'false',
      });

      const url = `${CLICKUP_API_BASE}/list/${listId}/task?${params.toString()}`;
      console.log(`📡 URL de la petición: ${url}`);

      const response = await axios.get(url, { headers: this.getHeaders() });

      console.log(`✅ Todas las tareas obtenidas: ${response.data.tasks?.length || 0}`);
      return response.data.tasks || [];
    } catch (error: any) {
      console.error('❌ Error obteniendo todas las tareas de ClickUp:', error);
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.err || error.message;
        
        if (status === 404) {
          throw new Error(`Lista con ID "${listId}" no encontrada. Verifica que el List ID sea correcto.`);
        } else if (status === 401) {
          throw new Error('API Key inválida. Verifica que la API Key sea correcta.');
        } else if (status === 403) {
          throw new Error('No tienes permisos para acceder a esta lista.');
        } else {
          throw new Error(`Error de ClickUp (${status}): ${message}`);
        }
      } else if (error.request) {
        throw new Error('No se pudo conectar con ClickUp. Verifica tu conexión a internet.');
      } else {
        throw new Error(`Error de configuración: ${error.message}`);
      }
    }
  }

  // Obtener una tarea específica
  async getTask(taskId: string): Promise<ClickUpTask> {
    try {
      const response = await axios.get(
        `${CLICKUP_API_BASE}/task/${taskId}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error obteniendo tarea de ClickUp:', error);
      throw new Error('No se pudo obtener la tarea de ClickUp');
    }
  }

  // Cambiar el estado de una tarea
  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    try {
      await axios.put(
        `${CLICKUP_API_BASE}/task/${taskId}`,
        { status },
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error('Error actualizando estado de tarea:', error);
      throw new Error('No se pudo actualizar el estado de la tarea');
    }
  }

  // Agregar comentario a una tarea
  async addComment(taskId: string, comment: string): Promise<void> {
    try {
      await axios.post(
        `${CLICKUP_API_BASE}/task/${taskId}/comment`,
        { comment_text: comment },
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error('Error agregando comentario:', error);
      throw new Error('No se pudo agregar el comentario');
    }
  }

  // Obtener comentarios de una tarea
  async getComments(taskId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${CLICKUP_API_BASE}/task/${taskId}/comment`,
        { headers: this.getHeaders() }
      );

      return response.data.comments || [];
    } catch (error) {
      console.error('Error obteniendo comentarios:', error);
      throw new Error('No se pudieron obtener los comentarios');
    }
  }

  // Obtener información del workspace (team)
  async getWorkspaceInfo(workspaceId: string): Promise<any> {
    try {
      // Primero intentar obtener información del team
      const response = await axios.get(
        `${CLICKUP_API_BASE}/team/${workspaceId}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo información del workspace:', error);
      
      // Manejar diferentes tipos de errores
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.err || error.message;
        
        if (status === 404) {
          // Si el endpoint /team no funciona, intentar con /space
          try {
            console.log('Intentando con endpoint /space...');
            const spaceResponse = await axios.get(
              `${CLICKUP_API_BASE}/space/${workspaceId}`,
              { headers: this.getHeaders() }
            );
            return spaceResponse.data;
          } catch (spaceError: any) {
            throw new Error(`Workspace ID "${workspaceId}" no encontrado. Verifica que el ID sea correcto y que tengas acceso al workspace.`);
          }
        } else if (status === 401) {
          throw new Error('API Key inválida. Verifica que la API Key sea correcta y tenga los permisos necesarios.');
        } else if (status === 403) {
          throw new Error('No tienes permisos para acceder a este workspace.');
        } else {
          throw new Error(`Error de ClickUp (${status}): ${message}`);
        }
      } else if (error.request) {
        throw new Error('No se pudo conectar con ClickUp. Verifica tu conexión a internet.');
      } else {
        throw new Error(`Error de configuración: ${error.message}`);
      }
    }
  }

  // Probar conexión básica con ClickUp (sin workspace específico)
  async testConnection(): Promise<boolean> {
    try {
      // Intentar obtener información del usuario como prueba de conexión
      const response = await axios.get(
        `${CLICKUP_API_BASE}/user`,
        { headers: this.getHeaders() }
      );

      return response.status === 200;
    } catch (error: any) {
      console.error('Error probando conexión con ClickUp:', error);
      
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          throw new Error('API Key inválida. Verifica que la API Key sea correcta.');
        } else if (status === 403) {
          throw new Error('No tienes permisos para acceder a ClickUp.');
        } else {
          throw new Error(`Error de ClickUp (${status}): ${error.response.data?.err || error.message}`);
        }
      } else if (error.request) {
        throw new Error('No se pudo conectar con ClickUp. Verifica tu conexión a internet.');
      } else {
        throw new Error(`Error de configuración: ${error.message}`);
      }
    }
  }

  // Convertir tarea de ClickUp a formato de publicación
  convertToTareaPublicacion(task: ClickUpTask): TareaPublicacion {
    // Extraer información de publicación de campos personalizados o descripción
    const tipoPublicacion = this.extractTipoPublicacion(task);
    const plataformaPublicacion = this.extractPlataformaPublicacion(task);
    const imagenPreview = this.extractImagenPreview(task);
    const textoPublicacion = this.extractTextoPublicacion(task);
    const fechaProgramada = this.extractFechaProgramada(task);
    const enlaceDrive = this.extractEnlaceDrive(task);
    const comentarios = this.extractComentarios(task);
    const urlPublicacion = this.extractUrlPublicacion(task);

    return {
      id: task.id,
      nombre: task.name,
      descripcion: task.description,
      estado: task.status.status,
      colorEstado: task.status.color,
      fechaCreacion: task.date_created,
      fechaActualizacion: task.date_updated,
      creador: {
        nombre: task.creator.username,
        email: task.creator.email,
        avatar: task.creator.profilePicture,
      },
      asignados: task.assignees.map(assignee => ({
        nombre: assignee.username,
        email: assignee.email,
        avatar: assignee.profilePicture,
      })),
      etiquetas: task.tags.map(tag => ({
        nombre: tag.name,
        color: tag.tag_bg,
      })),
      url: task.url,
      tipoPublicacion,
      plataformaPublicacion,
      imagenPreview,
      textoPublicacion,
      fechaProgramada,
      enlaceDrive,
      comentarios,
      urlPublicacion,
    };
  }

  // Métodos auxiliares para extraer información específica de publicaciones
  private extractTipoPublicacion(task: ClickUpTask): string | undefined {
    // console.log(`🎯 extractTipoPublicacion llamado para tarea: ${task.name}`);
    
    // Buscar el campo directamente por nombre exacto primero
    let campo = task.custom_fields.find(field => 
      field.name === 'Tipo de publicación'
    );
    
    // Si no se encuentra, buscar por nombres similares
    if (!campo) {
      const posiblesNombres = [
        'tipo de publicacion',
        'tipo publicacion', 
        'tipo_publicacion',
        'tipo de contenido',
        'tipo contenido',
        'tipo_contenido',
        'content type',
        'publication type'
      ];
      
      // console.log(`🔍 No se encontró "Tipo de publicación", buscando variantes: ${posiblesNombres.join(', ')}`);
      // console.log(`📋 Custom fields disponibles:`, task.custom_fields.map(f => f.name));
      
      for (const nombrePosible of posiblesNombres) {
        campo = task.custom_fields.find(field => 
          field.name.toLowerCase().includes(nombrePosible.toLowerCase())
        );
        
        // console.log(`🔎 Buscando "${nombrePosible}" → ${campo ? 'ENCONTRADO' : 'NO ENCONTRADO'}: ${campo?.name}`);
        
        if (campo) break;
      }
    } else {
      // console.log(`✅ Campo "Tipo de publicación" encontrado directamente`);
    }
    
    if (campo && campo.value !== null && campo.value !== undefined) {
        // Para campos de tipo "drop_down", usar orderindex para buscar la opción
        if (campo.type === 'drop_down' && campo.type_config && campo.type_config.options) {
          const selectedValue = Array.isArray(campo.value) ? campo.value[0] : campo.value;
          
          // Para dropdowns, ClickUp devuelve el orderindex como valor
          const option = campo.type_config.options.find((opt: any) => {
            return opt.orderindex === selectedValue || 
                   opt.orderindex === Number(selectedValue) ||
                   opt.id === selectedValue || 
                   opt.value === selectedValue;
          });
          
          if (option) {
            const displayName = option.name || option.label || option.value || option;
            return displayName;
          } else {
            // Mostrar el valor tal como viene si no se encuentra la opción
            return `[${selectedValue}]`;
          }
        }

        // Para campos simples donde el valor es directo
        if (campo.type !== 'drop_down' && campo.type !== 'labels') {
          let valor = campo.value;
          
          // Si es un objeto con name o label
          if (typeof valor === 'object' && (valor.name || valor.label)) {
            valor = valor.name || valor.label;
          }
          
          // Si es un array, tomar el primer elemento
          if (Array.isArray(valor) && valor.length > 0) {
            valor = valor[0].name || valor[0].label || valor[0];
          }
          
          if (valor && typeof valor === 'string') {
            return valor;
          }
        }

        // Último fallback: mostrar el valor tal como viene
        return String(campo.value);
    }

    return undefined;
  }

  private extractPlataformaPublicacion(task: ClickUpTask): string[] | undefined {
    // Buscar en campos personalizados (labels/rótulos) - nombres posibles
    const posiblesNombres = [
      'plataforma',
      'plataforma de publicacion',
      'plataforma publicacion',
      'red social',
      'redes sociales',
      'platform',
      'social media',
      'canal'
    ];
    
    for (const nombrePosible of posiblesNombres) {
      const campo = task.custom_fields.find(field => 
        field.name.toLowerCase().includes(nombrePosible.toLowerCase())
      );
      
      if (campo && campo.value && campo.type_config) {
        console.log(`🏷️ Campo encontrado: ${campo.name}`, {
          type: campo.type,
          value: campo.value,
          type_config: campo.type_config
        });

        // Para campos de tipo "labels", manejar múltiples selecciones
        if (campo.type === 'labels' && campo.type_config.options) {
          const selectedLabelIds = Array.isArray(campo.value) ? campo.value : [campo.value];
          const plataformas: string[] = [];
          
          // Buscar el nombre de cada opción seleccionada usando su ID
          selectedLabelIds.forEach(labelId => {
            const option = campo.type_config.options.find((opt: any) => 
              opt.id === labelId || opt.value === labelId
            );
            
            if (option) {
              // Para labels, usar 'label' en lugar de 'name'
              const nombrePlataforma = option.label || option.name;
              if (nombrePlataforma) {
                plataformas.push(nombrePlataforma);
              }
            }
          });
          
          if (plataformas.length > 0) {
            return plataformas;
          }
        }

        // Para campos de tipo "drop_down", manejar múltiples selecciones si las hay
        if (campo.type === 'drop_down' && campo.type_config.options) {
          const selectedOptionIds = Array.isArray(campo.value) ? campo.value : [campo.value];
          const plataformas: string[] = [];
          
          selectedOptionIds.forEach(optionId => {
            const option = campo.type_config.options.find((opt: any) => 
              opt.id === optionId || opt.value === optionId
            );
            
            if (option) {
              const nombrePlataforma = option.name || option.label;
              if (nombrePlataforma) {
                plataformas.push(nombrePlataforma);
              }
            }
          });
          
          if (plataformas.length > 0) {
            return plataformas;
          }
        }

        // Fallback: intentar extraer múltiples valores directamente
        let valores = campo.value;
        
        // Si es un array de objetos o strings
        if (Array.isArray(valores)) {
          const plataformas = valores.map(valor => {
            if (typeof valor === 'object' && (valor.name || valor.label)) {
              return valor.name || valor.label;
            }
            return valor.toString();
          }).filter(Boolean);
          
          if (plataformas.length > 0) {
            return plataformas;
          }
        }
        
        // Si es un solo valor
        if (valores) {
          if (typeof valores === 'object' && (valores.name || valores.label)) {
            return [valores.name || valores.label];
          }
          if (typeof valores === 'string') {
            return [valores];
          }
        }
      }
    }

    return undefined;
  }

  private extractImagenPreview(task: ClickUpTask): string | undefined {
    // Buscar en campos personalizados de imagen
    const campoImagen = task.custom_fields.find(field => 
      field.name.toLowerCase().includes('imagen') || 
      field.name.toLowerCase().includes('foto') ||
      field.name.toLowerCase().includes('preview')
    );
    
    if (campoImagen && campoImagen.value) {
      return campoImagen.value.toString();
    }

    // Buscar en descripción (URLs de imagen)
    if (task.description) {
      const urlMatch = task.description.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i);
      if (urlMatch) {
        return urlMatch[0];
      }
    }

    return undefined;
  }

  private extractTextoPublicacion(task: ClickUpTask): string | undefined {
    // Buscar en campos personalizados de texto
    const campoTexto = task.custom_fields.find(field => 
      field.name.toLowerCase().includes('texto') || 
      field.name.toLowerCase().includes('contenido') ||
      field.name.toLowerCase().includes('copy')
    );
    
    if (campoTexto && campoTexto.value) {
      return campoTexto.value.toString();
    }

    // Usar descripción como fallback
    return task.description;
  }

  private extractFechaProgramada(task: ClickUpTask): string | undefined {
    // Buscar en campos personalizados de fecha
    const campoFecha = task.custom_fields.find(field => 
      field.name.toLowerCase().includes('fecha') || 
      field.name.toLowerCase().includes('programada') ||
      field.name.toLowerCase().includes('publicación') ||
      field.name.toLowerCase().includes('publicacion')
    );
    
    let fechaRaw: string | undefined;
    
    if (campoFecha && campoFecha.value) {
      fechaRaw = campoFecha.value.toString();
    } else if (task.due_date) {
      fechaRaw = task.due_date;
    }

    // Validar y convertir la fecha a formato ISO
    if (fechaRaw) {
      try {
        // Si es un timestamp de ClickUp (milisegundos), convertir
        if (/^\d+$/.test(fechaRaw)) {
          const timestamp = parseInt(fechaRaw);
          // ClickUp timestamps están en milisegundos
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
        
        // Intentar parsear como fecha normal
        const date = new Date(fechaRaw);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (error) {
        console.warn('Error parseando fecha programada:', fechaRaw, error);
      }
    }

    return undefined;
  }

  private extractEnlaceDrive(task: ClickUpTask): string | undefined {
    // Buscar en campos personalizados de enlace a Drive
    const campoEnlace = task.custom_fields.find(field => 
      field.name.toLowerCase().includes('drive') || 
      field.name.toLowerCase().includes('enlace') ||
      field.name.toLowerCase().includes('archivos') ||
      field.name.toLowerCase().includes('multimedia') ||
      field.name.toLowerCase().includes('google drive') ||
      field.name.toLowerCase().includes('link')
    );
    
    if (campoEnlace && campoEnlace.value) {
      const valor = campoEnlace.value.toString();
      // Verificar que sea un enlace válido de Drive o similar
      if (valor.includes('drive.google.com') || valor.includes('dropbox.com') || valor.startsWith('http')) {
        return valor;
      }
    }

    // Buscar en la descripción enlaces de Drive
    if (task.description) {
      const driveMatch = task.description.match(/https:\/\/drive\.google\.com[^\s]+/i);
      if (driveMatch) {
        return driveMatch[0];
      }
      
      // Buscar otros enlaces de archivos
      const linkMatch = task.description.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|mp4|pdf|zip)/i);
      if (linkMatch) {
        return linkMatch[0];
      }
    }

    return undefined;
  }

  private extractComentarios(task: ClickUpTask): string | undefined {
    // Buscar en campos personalizados de comentarios
    const campoComentarios = task.custom_fields.find(field => 
      field.name.toLowerCase().includes('comentarios') || 
      field.name.toLowerCase().includes('notas') ||
      field.name.toLowerCase().includes('observaciones') ||
      field.name.toLowerCase().includes('feedback')
    );
    
    if (campoComentarios && campoComentarios.value) {
      return campoComentarios.value.toString();
    }

    return undefined;
  }

  private extractUrlPublicacion(task: ClickUpTask): string | undefined {
    // Buscar en campos personalizados de URL de publicación
    const campoUrl = task.custom_fields.find(field => 
      field.name.toLowerCase().includes('url') ||
      field.name.toLowerCase().includes('enlace') ||
      field.name.toLowerCase().includes('link') ||
      field.name.toLowerCase().includes('publicacion') ||
      field.name.toLowerCase().includes('publicación') ||
      field.name.toLowerCase().includes('post')
    );
    
    if (campoUrl && campoUrl.value) {
      return campoUrl.value.toString();
    }

    return undefined;
  }
}

// Instancia singleton del servicio
let clickUpService: ClickUpService | null = null;

export async function getClickUpService(apiKey?: string): Promise<ClickUpService> {
  if (!clickUpService) {
    let key = apiKey;
    
    if (!key) {
      // Obtener la API Key desde Supabase
      const supabaseService = getSupabaseService();
      const config = await supabaseService.getConfiguracionSistema();
      
      if (!config?.clickupApiKey) {
        throw new Error('ClickUp API Key no configurada en la base de datos');
      }
      
      key = config.clickupApiKey;
    }
    
    if (!key) {
      throw new Error('ClickUp API Key no disponible');
    }
    
    clickUpService = new ClickUpService(key);
  }
  return clickUpService;
} 