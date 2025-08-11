import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';

export async function GET() {
  try {
    const supabaseService = getSupabaseService();
    const clientes = await supabaseService.getAllClientes();

    return NextResponse.json({
      clientes,
      total: clientes.length,
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codigo, nombre, email, clickupListId, estadosVisibles, estadosAprobacion, estadosRechazo } = body;

    // Validaciones básicas
    if (!codigo || !nombre || !clickupListId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar que el código sea único
    const supabaseService = getSupabaseService();
    const existingCliente = await supabaseService.getClienteByCodigo(codigo);
    if (existingCliente) {
      return NextResponse.json(
        { error: 'El código ya existe' },
        { status: 400 }
      );
    }

    // Crear el cliente
    const nuevoCliente = await supabaseService.createCliente({
      codigo,
      nombre,
      email: email || null,
      clickupListId,
      estadosVisibles: estadosVisibles || [],
      estadosAprobacion: estadosAprobacion || [],
      estadosRechazo: estadosRechazo || [],
      activo: true,
    });

    if (!nuevoCliente) {
      return NextResponse.json(
        { error: 'Error al crear el cliente' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      cliente: nuevoCliente,
      message: 'Cliente creado exitosamente',
    });
  } catch (error) {
    console.error('Error creando cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 