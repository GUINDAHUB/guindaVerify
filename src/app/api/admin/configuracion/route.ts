import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseService } from '@/lib/supabase';

export async function GET() {
  try {
    const noAuth = await requireAdmin();
    if (noAuth) return noAuth;

    const supabaseService = getSupabaseService();
    const config = await supabaseService.getConfiguracionSistema();

    // Los secretos nunca salen del servidor: solo se indica si están guardados.
    // Al guardar, un campo secreto vacío conserva el valor actual.
    const { clickupApiKey, smtpPass, ...configPublica } = config || {};

    return NextResponse.json({
      config: {
        ...configPublica,
        clickupApiKey: '',
        smtpPass: '',
        clickupApiKeySet: !!clickupApiKey,
        smtpPassSet: !!smtpPass,
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
    const noAuth = await requireAdmin();
    if (noAuth) return noAuth;

    const body = await request.json();
    const {
      clickupApiKey,
      clickupWorkspaceId,
      estadosPorDefecto,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass,
      smtpFromName,
      smtpFromEmail,
      smtpEnabled
    } = body;

    const supabaseService = getSupabaseService();
    const configActual = await supabaseService.getConfiguracionSistema();

    // Validaciones básicas (la API key puede venir vacía si ya hay una guardada)
    if ((!clickupApiKey && !configActual?.clickupApiKey) || !clickupWorkspaceId) {
      return NextResponse.json(
        { error: 'API Key y Workspace ID son requeridos' },
        { status: 400 }
      );
    }

    // Guardar configuración
    // Campos secretos vacíos = mantener el valor guardado (undefined no se escribe)
    const success = await supabaseService.updateConfiguracionSistema({
      clickupApiKey: clickupApiKey || undefined,
      clickupWorkspaceId,
      estadosPorDefecto: estadosPorDefecto || {
        pendienteRevision: 'Pendiente de Revisión',
        aprobado: 'Aprobado',
        rechazado: 'Rechazado'
      },
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass: smtpPass || undefined,
      smtpFromName,
      smtpFromEmail,
      smtpEnabled
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