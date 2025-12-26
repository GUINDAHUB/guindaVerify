import { NextRequest, NextResponse } from 'next/server';
import { getClickUpService } from '@/lib/clickup';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, listId } = await request.json();

    if (!apiKey || !listId) {
      return NextResponse.json(
        { error: 'API Key y List ID son requeridos' },
        { status: 400 }
      );
    }

    const clickUpService = await getClickUpService(apiKey);
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

