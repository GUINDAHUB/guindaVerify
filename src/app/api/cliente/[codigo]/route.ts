import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;

    // Obtener información del cliente
    const supabaseService = getSupabaseService();
    const cliente = await supabaseService.getClienteByCodigo(codigo);

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    if (!cliente.activo) {
      return NextResponse.json(
        { error: 'Cliente inactivo' },
        { status: 403 }
      );
    }

    // Devolver solo la información básica del cliente (sin datos sensibles)
    return NextResponse.json({
      id: cliente.id,
      codigo: cliente.codigo,
      nombre: cliente.nombre,
      logoUrl: cliente.logoUrl,
      activo: cliente.activo
    });

  } catch (error) {
    console.error('Error obteniendo información del cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
