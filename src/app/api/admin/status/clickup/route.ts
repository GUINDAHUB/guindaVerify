import { NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';
import { getClickUpService } from '@/lib/clickup';

export async function GET() {
  try {
    // Obtener configuración de ClickUp desde Supabase
    const supabaseService = getSupabaseService();
    const config = await supabaseService.getConfiguracionSistema();
    
    if (!config?.clickupApiKey || !config?.clickupWorkspaceId) {
      return NextResponse.json(
        { 
          status: 'not_configured',
          error: 'ClickUp no está configurado. Configura la API Key y Workspace ID.',
        },
        { status: 400 }
      );
    }

    // Probar conexión con ClickUp
    const clickUpService = await getClickUpService();
    
    try {
      // Probar la conexión básica con la API Key
      await clickUpService.testConnection();
      
      // Si la API Key funciona, considerar la conexión exitosa
      // (No verificamos el workspace específico porque la API no lo requiere)
      return NextResponse.json({
        status: 'connected',
        message: 'Conexión con ClickUp establecida correctamente',
        workspace: {
          id: config.clickupWorkspaceId,
          name: 'Workspace configurado'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      return NextResponse.json(
        { 
          status: 'disconnected',
          error: error.message || 'Error de conexión con ClickUp',
          details: 'Verifica que la API Key sea correcta'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error verificando conexión con ClickUp:', error);
    return NextResponse.json(
      { 
        status: 'disconnected',
        error: 'Error de conexión con ClickUp',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 