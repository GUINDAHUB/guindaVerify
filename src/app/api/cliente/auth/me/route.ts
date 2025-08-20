import { NextResponse } from 'next/server';
import { getCurrentClientUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentClientUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'No hay usuario autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        username: user.username,
        es_admin_cliente: user.es_admin_cliente
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
