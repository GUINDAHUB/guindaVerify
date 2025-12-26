import { NextRequest, NextResponse } from 'next/server';
import { getClickUpService } from '@/lib/clickup';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, workspaceId } = await request.json();

    if (!apiKey || !workspaceId) {
      return NextResponse.json(
        { error: 'API Key y Workspace ID son requeridos' },
        { status: 400 }
      );
    }

    const clickUpService = await getClickUpService(apiKey);
    const lists = await clickUpService.getLists(workspaceId);

    return NextResponse.json({ lists });
  } catch (error: any) {
    console.error('Error en get-lists:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener listas' },
      { status: 500 }
    );
  }
}

