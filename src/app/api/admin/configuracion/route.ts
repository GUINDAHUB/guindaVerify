import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';

export async function GET() {
  try {
    const supabaseService = getSupabaseService();
    const config = await supabaseService.getConfiguracionSistema();

    return NextResponse.json({
      config: config || {
        clickupApiKey: '',
        clickupWorkspaceId: '',
        estadosPorDefecto: {
          pendienteRevision: 'Pendiente de Revisión',
          aprobado: 'Aprobado',
          rechazado: 'Rechazado'
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clickupApiKey, clickupWorkspaceId, estadosPorDefecto } = body;

    // Validaciones básicas
    if (!clickupApiKey || !clickupWorkspaceId) {
      return NextResponse.json(
        { error: 'API Key y Workspace ID son requeridos' },
        { status: 400 }
      );
    }

    const supabaseService = getSupabaseService();
    
    // Guardar configuración
    const success = await supabaseService.updateConfiguracionSistema({
      clickupApiKey,
      clickupWorkspaceId,
      estadosPorDefecto: estadosPorDefecto || {
        pendienteRevision: 'Pendiente de Revisión',
        aprobado: 'Aprobado',
        rechazado: 'Rechazado'
      }
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Error al guardar la configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Configuración guardada exitosamente',
    });
  } catch (error) {
    console.error('Error guardando configuración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 