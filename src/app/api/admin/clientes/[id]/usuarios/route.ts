import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated, getClientUsers, createClientUser, updateClientUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(
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
    const usuarios = await getClientUsers(id);

    return NextResponse.json({ usuarios });
  } catch (error) {
    console.error('Error obteniendo usuarios cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== POST /api/admin/clientes/[id]/usuarios ===');
    
    // Verificar autenticación de administrador
    const isAuth = await isAdminAuthenticated();
    console.log('Admin authenticated:', isAuth);
    
    if (!isAuth) {
      console.log('Authentication failed');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    console.log('Cliente ID:', id);
    
    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const { nombre, username, password, email, esAdminCliente } = requestBody;

    // Validaciones
    if (!nombre || !password) {
      return NextResponse.json(
        { error: 'Nombre y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Si no viene username, generarlo automáticamente
    const finalUsername = username || nombre.toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '');
    
    console.log('Generated username:', finalUsername);

    if (password.length < 6) {
      console.log('Password too short');
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Crear usuario
    console.log('Calling createClientUser with:', { id, nombre, finalUsername, password: '[HIDDEN]', email, esAdminCliente });
    const result = await createClientUser(id, nombre, finalUsername, password, email, esAdminCliente || false);
    console.log('createClientUser result:', result);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      usuario: result.user
    });

  } catch (error) {
    console.error('Error creando usuario cliente:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack available');
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== PUT /api/admin/clientes/[id]/usuarios ===');
    
    // Verificar autenticación de administrador
    const isAuth = await isAdminAuthenticated();
    console.log('Admin authenticated:', isAuth);
    
    if (!isAuth) {
      console.log('Authentication failed');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario es requerido' },
        { status: 400 }
      );
    }

    console.log('Cliente ID:', id);
    console.log('Usuario ID:', userId);
    
    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const { nombre, email } = requestBody;

    // Validaciones
    if (!nombre) {
      return NextResponse.json(
        { error: 'Nombre es requerido' },
        { status: 400 }
      );
    }

    // Actualizar usuario
    console.log('Calling updateClientUser with:', { userId, nombre, email });
    const result = await updateClientUser(userId, nombre, email);
    console.log('updateClientUser result:', result);

    if (!result) {
      return NextResponse.json(
        { error: 'Error al actualizar usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando usuario cliente:', error);
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
    // Verificar autenticación de administrador
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Eliminar usuario
    const { error } = await supabase
      .from('usuarios_clientes')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error eliminando usuario:', error);
      return NextResponse.json(
        { error: 'Error al eliminar usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error eliminando usuario cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
