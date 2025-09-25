import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { codigo, nombre, email, logoUrl, clickupListId, estadosVisibles, estadosAprobacion, estadosRechazo, dragDropEnabled } = body;

    // Validaciones básicas
    if (!codigo || !nombre || !clickupListId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const supabaseService = getSupabaseService();
    
    // Verificar que el cliente existe
    const existingCliente = await supabaseService.getClienteById(id);
    if (!existingCliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el código sea único (si cambió)
    if (codigo !== existingCliente.codigo) {
      const clienteWithSameCode = await supabaseService.getClienteByCodigo(codigo);
      if (clienteWithSameCode) {
        return NextResponse.json(
          { error: 'El código ya existe' },
          { status: 400 }
        );
      }
    }

    // Actualizar el cliente
    const clienteActualizado = await supabaseService.updateCliente(id, {
      codigo,
      nombre,
      email: email || null,
      logoUrl: logoUrl || null,
      clickupListId,
      estadosVisibles: estadosVisibles || [],
      estadosAprobacion: estadosAprobacion || [],
      estadosRechazo: estadosRechazo || [],
      dragDropEnabled: dragDropEnabled ?? true,
    });

    if (!clienteActualizado) {
      return NextResponse.json(
        { error: 'Error al actualizar el cliente' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      cliente: clienteActualizado,
      message: 'Cliente actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseService = getSupabaseService();

    // Verificar que el cliente existe
    const existingCliente = await supabaseService.getClienteById(id);
    if (!existingCliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el cliente
    const success = await supabaseService.deleteCliente(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Error al eliminar el cliente' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Cliente eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 