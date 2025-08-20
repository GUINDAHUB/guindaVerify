import { NextRequest, NextResponse } from 'next/server';
import { verifyClientUserPassword, verifyClientPasswordAutoDetect, setClientUserSession, logActivity } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { codigo, username, password } = await request.json();

    // Validaciones básicas
    if (!codigo || !password) {
      return NextResponse.json(
        { error: 'Código de cliente y contraseña requeridos' },
        { status: 400 }
      );
    }

    let isValid = false;
    let user = null;

    if (username) {
      // Modo específico: usuario + contraseña
      const result = await verifyClientUserPassword(codigo, username, password);
      isValid = result.isValid;
      user = result.user;
    } else {
      // Modo auto-detección: solo contraseña
      const result = await verifyClientPasswordAutoDetect(codigo, password);
      isValid = result.isValid;
      user = result.user;
    }
    
    if (!isValid || !user) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Establecer la sesión del cliente con información del usuario
    await setClientUserSession(codigo, user);

    // Registrar el login en el log de actividades
    const ipAddress = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || null;
    const userAgent = request.headers.get('user-agent') || null;
    
    await logActivity(
      user.id,
      user.cliente_id,
      'login',
      `Usuario ${user.nombre} (${user.username}) inició sesión`,
      undefined,
      undefined,
      undefined,
      ipAddress,
      userAgent
    );

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        username: user.username,
        es_admin_cliente: user.es_admin_cliente
      }
    });
  } catch (error) {
    console.error('Error en login cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
