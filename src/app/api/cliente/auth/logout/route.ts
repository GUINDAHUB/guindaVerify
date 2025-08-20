import { NextRequest, NextResponse } from 'next/server';
import { clearClientSession, getCurrentClientUser, logActivity } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Obtener información del usuario antes de cerrar sesión
    const currentUser = await getCurrentClientUser();
    
    if (currentUser) {
      // Registrar el logout en el log de actividades
      const ipAddress = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || null;
      const userAgent = request.headers.get('user-agent') || null;
      
      await logActivity(
        currentUser.id,
        currentUser.cliente_id,
        'logout',
        `Usuario ${currentUser.nombre} (${currentUser.username}) cerró sesión`,
        undefined,
        undefined,
        undefined,
        ipAddress,
        userAgent
      );
    }

    await clearClientSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en logout cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
