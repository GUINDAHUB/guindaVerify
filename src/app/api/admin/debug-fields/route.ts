import { NextRequest, NextResponse } from 'next/server';
import { getClickUpService } from '@/lib/clickup';
import { getSupabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clienteId = searchParams.get('clienteId');
    
    // Si no se proporciona clienteId, devolver lista de clientes disponibles
    if (!clienteId) {
      const supabaseService = getSupabaseService();
      const clientes = await supabaseService.getAllClientes();
      
      return NextResponse.json({
        message: 'Se requiere clienteId. Aquí están los clientes disponibles:',
        clientes_disponibles: clientes.map(c => ({
          id: c.id,
          nombre: c.nombre,
          codigo: c.codigo,
          clickupListId: c.clickupListId
        })),
        ejemplo_uso: `/api/admin/debug-fields?clienteId=${clientes[0]?.id || 'ID_DEL_CLIENTE'}`
      });
    }

    // Obtener información del cliente
    const supabaseService = getSupabaseService();
    const cliente = await supabaseService.getClienteById(clienteId);

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Obtener tareas de ClickUp
    const clickUpService = await getClickUpService();
    const tareas = await clickUpService.getTasksFromList(
      cliente.clickupListId,
      cliente.estadosVisibles
    );

    // Debug: mostrar los custom fields de cada tarea
    const debug = tareas.map(tarea => ({
      id: tarea.id,
      name: tarea.name,
      custom_fields: tarea.custom_fields.map(field => {
        const fieldInfo: any = {
          id: field.id,
          name: field.name,
          type: field.type,
          value: field.value,
          type_config: field.type_config
        };

        // Si es un campo de tipo label o dropdown, mostrar las opciones disponibles
        if (field.type_config && field.type_config.options) {
          fieldInfo.available_options = field.type_config.options.map((opt: any) => ({
            id: opt.id,
            name: opt.name || opt.label,
            value: opt.value,
            color: opt.color
          }));
        }

        // Intentar resolver el valor actual si es un ID
        if (field.value !== null && field.value !== undefined && field.type_config && field.type_config.options) {
          const selectedId = Array.isArray(field.value) ? field.value[0] : field.value;
          
          // Buscar con múltiples criterios
          const selectedOption = field.type_config.options.find((opt: any) => 
            opt.id === selectedId || 
            opt.value === selectedId || 
            opt.orderindex === selectedId ||
            opt === selectedId
          );
          
          fieldInfo.search_attempts = {
            looking_for: selectedId,
            found_option: selectedOption,
            all_options: field.type_config.options
          };
          
          if (selectedOption) {
            fieldInfo.resolved_value = {
              id: selectedId,
              display_name: selectedOption.name || selectedOption.label || selectedOption.value || selectedOption,
              raw_option: selectedOption
            };
          } else {
            fieldInfo.resolved_value = {
              id: selectedId,
              display_name: `UNRESOLVED: ${selectedId}`,
              error: 'No matching option found'
            };
          }
        }

        return fieldInfo;
      })
    }));

    return NextResponse.json({
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        clickupListId: cliente.clickupListId,
      },
      debug,
      total: tareas.length,
    });

  } catch (error) {
    console.error('Error debuggeando campos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
