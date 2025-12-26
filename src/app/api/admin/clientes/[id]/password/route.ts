import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated, updateClientPassword } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar que esté autenticado como admin
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { codigo, password } = await request.json();

    if (!codigo || !password) {
      return NextResponse.json(
        { error: 'Código de cliente y contraseña requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Actualizar contraseña del cliente
    const success = await updateClientPassword(codigo, password);
    if (!success) {
      return NextResponse.json(
        { error: 'Error al establecer la contraseña' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al establecer contraseña del cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
