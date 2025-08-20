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
  async getTasksFromList(listId: string, statuses?: string[], forceRefresh: boolean = false): Promise<ClickUpTask[]> {
    try {
      console.log(`🔍 Obteniendo tareas de la lista: ${listId}`);
      console.log(`📋 Estados filtrados:`, statuses);
      console.log(`🔄 Forzar actualización:`, forceRefresh);
      
      const params = new URLSearchParams({
        include_closed: 'false',
        subtasks: 'false',
        // Añadir timestamp para evitar cache cuando se fuerza refresh
        ...(forceRefresh && { _t: Date.now().toString() })
      });

      if (statuses && statuses.length > 0) {
        // Enviar cada estado como un parámetro separado
        statuses.forEach(status => {
          params.append('statuses[]', status);
        });
      }

      const url = `${CLICKUP_API_BASE}/list/${listId}/task?${params.toString()}`;
      console.log(`📡 URL de la petición: ${url}`);

      const headers = {
        ...this.getHeaders(),
        // Añadir headers para evitar cache cuando se fuerza refresh
        ...(forceRefresh && { 
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        })
      };

      const response = await axios.get(url, { headers });

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
  async getAllTasksFromList(listId: string, forceRefresh: boolean = false): Promise<ClickUpTask[]> {
    try {
      console.log(`🔍 Obteniendo TODAS las tareas de la lista: ${listId}`);
      console.log(`🔄 Forzar actualización:`, forceRefresh);
      
      const params = new URLSearchParams({
        include_closed: 'false',
        subtasks: 'false',
        // Añadir timestamp para evitar cache cuando se fuerza refresh
        ...(forceRefresh && { _t: Date.now().toString() })
      });

      const url = `${CLICKUP_API_BASE}/list/${listId}/task?${params.toString()}`;
      console.log(`📡 URL de la petición: ${url}`);

      const headers = {
        ...this.getHeaders(),
        // Añadir headers para evitar cache cuando se fuerza refresh
        ...(forceRefresh && { 
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        })
      };

      const response = await axios.get(url, { headers });

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
  async getTask(taskId: string, forceRefresh: boolean = false): Promise<ClickUpTask> {
    try {
      const url = new URL(`${CLICKUP_API_BASE}/task/${taskId}`);
      
      // Añadir timestamp para evitar cache cuando se fuerza refresh
      if (forceRefresh) {
        url.searchParams.set('_t', Date.now().toString());
      }

      const headers = {
        ...this.getHeaders(),
        // Añadir headers para evitar cache cuando se fuerza refresh
        ...(forceRefresh && { 
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        })
      };

      const response = await axios.get(url.toString(), { headers });

      console.log(`🔍 Tarea obtenida: ${taskId}${forceRefresh ? ' (forced refresh)' : ''}`);
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

  // Actualizar la fecha de publicación (campo personalizado)
  async updateTaskDueDate(taskId: string, dueDate: number): Promise<void> {
    try {
      // Primero, obtener la tarea para encontrar el campo personalizado de fecha
      const task = await this.getTask(taskId);
      
      // Buscar el campo de fecha de publicación
      const campoFecha = task.custom_fields.find(field => 
        field.name.toLowerCase().includes('fecha') && 
        (field.name.toLowerCase().includes('publicacion') || 
         field.name.toLowerCase().includes('publicación'))
      );

      if (!campoFecha) {
        console.error('❌ No se encontró campo de fecha de publicación:', {
          taskId,
          availableFields: task.custom_fields.map(f => ({ name: f.name, type: f.type, id: f.id }))
        });
        throw new Error('No se encontró el campo personalizado de fecha de publicación');
      }

      console.log('🔍 Campo de fecha encontrado:', {
        fieldId: campoFecha.id,
        fieldName: campoFecha.name,
        fieldType: campoFecha.type,
        currentValue: campoFecha.value
      });

      // Actualizar el campo personalizado usando la API específica
      const response = await axios.post(
        `${CLICKUP_API_BASE}/task/${taskId}/field/${campoFecha.id}`,
        { value: dueDate },
        { headers: this.getHeaders() }
      );

      console.log('✅ ClickUp API - Campo personalizado actualizado:', {
        status: response.status,
        data: response.data,
        fieldId: campoFecha.id,
        fieldName: campoFecha.name,
        newValue: dueDate,
        fechaComprensible: new Date(dueDate).toISOString()
      });

    } catch (error: any) {
      console.error('❌ ClickUp API - Error actualizando campo personalizado:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        taskId,
        dueDate
      });
      throw new Error(`No se pudo actualizar la fecha de publicación: ${error.message}`);
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
    console.log(`\n🔍 === DEBUGGING FECHA PROGRAMADA - Tarea: ${task.name} (${task.id}) ===`);
    
    // Log de TODOS los campos personalizados para debugging
    console.log(`📋 Todos los campos personalizados (${task.custom_fields.length}):`, 
      task.custom_fields.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        value: f.value,
        type_config: f.type_config
      }))
    );

    // Log de fechas de tarea estándar
    console.log(`📅 Fechas estándar de tarea:`, {
      due_date: task.due_date,
      start_date: task.start_date,
      date_created: task.date_created,
      date_updated: task.date_updated
    });

    // Estrategia 1: Buscar campos tipo 'date'
    const camposFechaTipo = task.custom_fields.filter(field => field.type === 'date');
    console.log(`🎯 Campos tipo 'date' encontrados (${camposFechaTipo.length}):`, 
      camposFechaTipo.map(f => ({ name: f.name, value: f.value, type_config: f.type_config }))
    );

    // Estrategia 2: Buscar por nombre relacionado con fecha
    const camposFechaNombre = task.custom_fields.filter(field => 
      field.name.toLowerCase().includes('fecha') || 
      field.name.toLowerCase().includes('programada') ||
      field.name.toLowerCase().includes('publicación') ||
      field.name.toLowerCase().includes('publicacion') ||
      field.name.toLowerCase().includes('schedule') ||
      field.name.toLowerCase().includes('publish') ||
      field.name.toLowerCase().includes('date')
    );
    console.log(`📝 Campos por nombre relacionado (${camposFechaNombre.length}):`, 
      camposFechaNombre.map(f => ({ name: f.name, value: f.value, type: f.type }))
    );

    // Priorizar: 1) campos tipo date con nombre relacionado, 2) cualquier campo tipo date, 3) por nombre
    let campoFecha = camposFechaTipo.find(field => 
      field.name.toLowerCase().includes('fecha') || 
      field.name.toLowerCase().includes('programada') ||
      field.name.toLowerCase().includes('publicación') ||
      field.name.toLowerCase().includes('publicacion') ||
      field.name.toLowerCase().includes('schedule') ||
      field.name.toLowerCase().includes('publish') ||
      field.name.toLowerCase().includes('date')
    );

    if (!campoFecha && camposFechaTipo.length > 0) {
      campoFecha = camposFechaTipo[0];
      console.log(`🔄 Usando primer campo tipo 'date' disponible:`, campoFecha.name);
    }

    if (!campoFecha && camposFechaNombre.length > 0) {
      campoFecha = camposFechaNombre[0];
      console.log(`🔄 Usando primer campo por nombre relacionado:`, campoFecha.name);
    }
    
    let fechaRaw: string | undefined;
    let fuente = '';
    
    if (campoFecha && campoFecha.value !== null && campoFecha.value !== undefined) {
      fechaRaw = campoFecha.value.toString();
      fuente = `campo personalizado '${campoFecha.name}' (tipo: ${campoFecha.type})`;
      console.log(`✅ Fecha encontrada en ${fuente}:`, { raw: fechaRaw, originalValue: campoFecha.value });
    } else if (task.due_date) {
      fechaRaw = task.due_date;
      fuente = 'due_date de la tarea';
      console.log(`✅ Fecha encontrada en ${fuente}:`, fechaRaw);
    } else {
      console.log(`❌ No se encontró fecha en ninguna fuente para tarea: ${task.name}`);
      console.log(`🔍 Campos disponibles:`, task.custom_fields.map(f => f.name));
      return undefined;
    }

    // Validar y convertir la fecha a formato ISO
    if (fechaRaw) {
      try {
        console.log(`🔄 Procesando fecha raw: "${fechaRaw}" (tipo: ${typeof fechaRaw}) desde ${fuente}`);
        
        // Si es un timestamp de ClickUp (solo números), convertir
        if (/^\d+$/.test(fechaRaw)) {
          const timestamp = parseInt(fechaRaw);
          console.log(`⏰ Detectado timestamp numérico: ${timestamp}`);
          
          // ClickUp timestamps pueden estar en milisegundos o segundos
          // Si es menor que 10^12, probablemente sea en segundos
          const timestampMs = timestamp < 1e12 ? timestamp * 1000 : timestamp;
          console.log(`⏰ Timestamp ajustado a ms: ${timestampMs}`);
          
          const date = new Date(timestampMs);
          if (!isNaN(date.getTime())) {
            // Crear fecha en zona horaria local para evitar offset
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            const fechaLocal = `${year}-${month}-${day}`;
            
            console.log(`✅ Fecha convertida desde timestamp: ${fechaLocal} (UTC: ${date.toISOString()})`);
            return fechaLocal;
          } else {
            console.error(`❌ Timestamp inválido: ${timestamp} -> ${date}`);
          }
        }
        
        // Intentar parsear como fecha normal
        const date = new Date(fechaRaw);
        if (!isNaN(date.getTime())) {
          // Crear fecha en zona horaria local para evitar offset
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          const fechaLocal = `${year}-${month}-${day}`;
          
          console.log(`✅ Fecha convertida desde string: ${fechaLocal} (UTC: ${date.toISOString()}, original: ${fechaRaw})`);
          return fechaLocal;
        } else {
          console.error(`❌ Fecha inválida al parsear: "${fechaRaw}" -> ${date}`);
        }
      } catch (error) {
        console.error('❌ Error parseando fecha programada:', { fechaRaw, fuente, error });
      }
    }

    console.log(`❌ No se pudo extraer fecha válida de la tarea: ${task.name}`);
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