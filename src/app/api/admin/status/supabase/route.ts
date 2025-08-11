import { NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';

export async function GET() {
  try {
    const supabaseService = getSupabaseService();
    
    // Intentar obtener la configuración del sistema como prueba de conexión
    const config = await supabaseService.getConfiguracionSistema();
    
    // Si llegamos aquí, la conexión está funcionando
    return NextResponse.json({
      status: 'connected',
      message: 'Conexión con Supabase establecida correctamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error verificando conexión con Supabase:', error);
    return NextResponse.json(
      { 
        status: 'disconnected',
        error: 'Error de conexión con Supabase',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 