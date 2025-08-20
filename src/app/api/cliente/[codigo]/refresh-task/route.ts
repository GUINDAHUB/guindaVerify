import { NextRequest, NextResponse } from 'next/server';
import { getClickUpService } from '@/lib/clickup';
import { getSupabaseService } from '@/lib/supabase';
import { getCurrentClientUser, logActivity } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    const body = await request.json();
    const { tareaId } = body;

    console.log(`🔄 API Refresh Task - Cliente: ${codigo}, Tarea: ${tareaId}`);

    if (!tareaId) {
      return NextResponse.json({ error: 'ID de tarea es requerido' }, { status: 400 });
    }

    // Obtener información del cliente
    const supabaseService = getSupabaseService();
    const cliente = await supabaseService.getClienteByCodigo(codigo);

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    if (!cliente.activo) {
      return NextResponse.json({ error: 'Cliente inactivo' }, { status: 403 });
    }

    // Obtener información del usuario actual
    const currentUser = await getCurrentClientUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    // Obtener la tarea fresca desde ClickUp con refresh forzado
    const clickUpService = await getClickUpService();
    const tareaFresca = await clickUpService.getTask(tareaId, true);

    // Convertir a formato de publicación
    const publicacionActualizada = clickUpService.convertToTareaPublicacion(tareaFresca);

    // Registrar la actividad en el log
    const ipAddress = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || null;
    const userAgent = request.headers.get('user-agent') || null;
    
    await logActivity(
      currentUser.id,
      cliente.id,
      'refresh_task',
      `Tarea ${tareaId} refrescada desde ClickUp`,
      tareaId,
      null,
      null,
      ipAddress,
      userAgent
    );

    console.log(`✅ Tarea refrescada exitosamente: ${tareaId}`);

    return NextResponse.json({
      success: true,
      publicacion: publicacionActualizada
    });

  } catch (error) {
    console.error('Error en refresh-task:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
