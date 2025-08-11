import { NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Debugging configuración del sistema...');
    
    const supabaseService = getSupabaseService();
    const config = await supabaseService.getConfiguracionSistema();
    
    console.log('📋 Configuración encontrada:', {
      id: config?.id,
      hasApiKey: !!config?.clickupApiKey,
      apiKeyLength: config?.clickupApiKey?.length || 0,
      hasWorkspaceId: !!config?.clickupWorkspaceId,
      workspaceId: config?.clickupWorkspaceId,
      estadosPorDefecto: config?.estadosPorDefecto
    });
    
    return NextResponse.json({
      success: true,
      config: {
        hasApiKey: !!config?.clickupApiKey,
        apiKeyLength: config?.clickupApiKey?.length || 0,
        hasWorkspaceId: !!config?.clickupWorkspaceId,
        workspaceId: config?.clickupWorkspaceId,
        estadosPorDefecto: config?.estadosPorDefecto,
        fullConfig: config
      },
      message: 'Configuración debuggeada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error en debug-config:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener configuración',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
