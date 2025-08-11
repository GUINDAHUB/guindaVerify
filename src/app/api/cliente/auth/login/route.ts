import { NextRequest, NextResponse } from 'next/server';
import { verifyClientPassword, setClientSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { codigo, password } = await request.json();

    if (!codigo || !password) {
      return NextResponse.json(
        { error: 'Código de cliente y contraseña requeridos' },
        { status: 400 }
      );
    }

    const isValid = await verifyClientPassword(codigo, password);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Establecer la sesión del cliente
    await setClientSession(codigo);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en login cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
