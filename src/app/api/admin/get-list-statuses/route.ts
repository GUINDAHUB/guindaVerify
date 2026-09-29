import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getClickUpService } from '@/lib/clickup';

export async function POST(request: NextRequest) {
  try {
    const noAuth = await requireAdmin();
    if (noAuth) return noAuth;

    const { listId } = await request.json();

    if (!listId) {
      return NextResponse.json(
        { error: 'List ID es requerido' },
        { status: 400 }
      );
    }

    // Usa la API key guardada en la configuración
    const clickUpService = await getClickUpService();
    const statuses = await clickUpService.getListStatuses(listId);

    return NextResponse.json({ statuses });
  } catch (error: any) {
    console.error('Error en get-list-statuses:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener estados' },
      { status: 500 }
    );
  }
}


