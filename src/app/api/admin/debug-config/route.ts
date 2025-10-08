import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 === DIAGNÓSTICO DE CONFIGURACIÓN ===');
    
    const supabaseService = getSupabaseService();
    
    // Obtener configuración del sistema
    const configuracion = await supabaseService.getConfiguracionSistema();
    
    // Obtener todos los clientes
    const clientes = await supabaseService.getAllClientes();
    
    const diagnostico = {
      timestamp: new Date().toISOString(),
      configuracionSistema: {
        existe: !!configuracion,
        clickupApiKey: configuracion?.clickupApiKey ? '✅ Configurada' : '❌ No configurada',
        clickupListId: configuracion?.clickupListId ? '✅ Configurada' : '❌ No configurada',
        clickupWorkspaceId: configuracion?.clickupWorkspaceId ? '✅ Configurada' : '❌ No configurada',
        smtpConfigured: configuracion?.smtpHost && configuracion?.smtpUser ? '✅ Configurado' : '❌ No configurado',
        smtpEnabled: configuracion?.smtpEnabled ? '✅ Habilitado' : '❌ Deshabilitado'
      },
      clientes: {
        total: clientes.length,
        activos: clientes.filter(c => c.activo).length,
        inactivos: clientes.filter(c => !c.activo).length,
        detalles: clientes.map(cliente => ({
          id: cliente.id,
          nombre: cliente.nombre,
          codigo: cliente.codigo,
          activo: cliente.activo,
          clickupListId: cliente.clickupListId || 'No configurado',
          estadosVisibles: cliente.estadosVisibles || [],
          estadosAprobacion: cliente.estadosAprobacion || [],
          estadosRechazo: cliente.estadosRechazo || [],
          tieneUsuarios: 'Verificando...' // Se podría expandir para verificar usuarios
        }))
      },
      recomendaciones: []
    };

    // Generar recomendaciones
    if (!configuracion?.clickupApiKey) {
      diagnostico.recomendaciones.push('🔧 Configura la ClickUp API Key en el panel de administración');
    }
    
    if (!configuracion?.clickupListId) {
      diagnostico.recomendaciones.push('🔧 Configura el ClickUp List ID en el panel de administración');
    }
    
    if (!configuracion?.smtpHost || !configuracion?.smtpUser) {
      diagnostico.recomendaciones.push('📧 Configura SMTP para envío de emails');
    }
    
    if (!configuracion?.smtpEnabled) {
      diagnostico.recomendaciones.push('📧 Habilita el envío de emails SMTP');
    }
    
    const clientesActivos = clientes.filter(c => c.activo);
    if (clientesActivos.length === 0) {
      diagnostico.recomendaciones.push('👥 No hay clientes activos configurados');
    }
    
    const clientesSinEstados = clientesActivos.filter(c => !c.estadosVisibles || c.estadosVisibles.length === 0);
    if (clientesSinEstados.length > 0) {
      diagnostico.recomendaciones.push(`⚙️ ${clientesSinEstados.length} clientes activos no tienen estados visibles configurados`);
    }

    if (diagnostico.recomendaciones.length === 0) {
      diagnostico.recomendaciones.push('✅ La configuración parece estar completa');
    }

    return NextResponse.json(diagnostico);

  } catch (error) {
    console.error('❌ Error en diagnóstico de configuración:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}