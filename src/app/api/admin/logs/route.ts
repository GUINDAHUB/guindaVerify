import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated, getActivityLogs } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de administrador
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Obtener logs de actividad
    const logs = await getActivityLogs(clienteId || undefined, limit, offset);

    return NextResponse.json({
      logs,
      total: logs.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error obteniendo logs de actividad:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
