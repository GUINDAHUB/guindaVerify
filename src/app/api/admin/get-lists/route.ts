import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getClickUpService } from '@/lib/clickup';
import { getSupabaseService } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const noAuth = await requireAdmin();
    if (noAuth) return noAuth;

    // La API key y el workspace se leen de la configuración guardada (no viajan al navegador)
    const config = await getSupabaseService().getConfiguracionSistema();
    const workspaceId = config?.clickupWorkspaceId;

    if (!config?.clickupApiKey || !workspaceId) {
      return NextResponse.json(
        { error: 'ClickUp no está configurado. Ve a Configuración primero.' },
        { status: 400 }
      );
    }

    const clickUpService = await getClickUpService();
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


