import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated, checkPasswordExists } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación de administrador
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Contraseña requerida' },
        { status: 400 }
      );
    }

    const exists = await checkPasswordExists(id, password);

    return NextResponse.json({
      exists,
      message: exists ? 'Esta contraseña ya está en uso' : 'Contraseña disponible'
    });

  } catch (error) {
    console.error('Error verificando contraseña:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
