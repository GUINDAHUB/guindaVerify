import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { supabase } from './supabase';

// Configuración de cookies
const AUTH_COOKIE = 'guinda-auth';
const CLIENT_AUTH_COOKIE = 'guinda-client-auth';
const CLIENT_USER_COOKIE = 'guinda-client-user';

// Hash de contraseñas
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Autenticación de administradores
export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('auth_admin')
      .select('password_hash')
      .limit(1)
      .single();

    if (error || !data) {
      console.error('Error al obtener contraseña admin:', error);
      return false;
    }

    return await verifyPassword(password, data.password_hash);
  } catch (error) {
    console.error('Error en verificación admin:', error);
    return false;
  }
}

// Autenticación de usuarios de clientes
export async function verifyClientUserPassword(
  codigo: string, 
  username: string, 
  password: string
): Promise<{ isValid: boolean; user?: any }> {
  try {
    const { data, error } = await supabase
      .from('usuarios_clientes')
      .select(`
        id,
        nombre,
        username,
        password_hash,
        es_admin_cliente,
        activo,
        cliente_id,
        clientes!inner(codigo, activo)
      `)
      .eq('clientes.codigo', codigo)
      .eq('clientes.activo', true)
      .eq('username', username)
      .eq('activo', true)
      .single();

    if (error || !data || !data.password_hash) {
      console.error('Error al obtener usuario cliente:', error);
      return { isValid: false };
    }

    const isValid = await verifyPassword(password, data.password_hash);
    
    if (isValid) {
      return { 
        isValid: true, 
        user: {
          id: data.id,
          nombre: data.nombre,
          username: data.username,
          es_admin_cliente: data.es_admin_cliente,
          cliente_id: data.cliente_id
        }
      };
    }

    return { isValid: false };
  } catch (error) {
    console.error('Error en verificación usuario cliente:', error);
    return { isValid: false };
  }
}

// Función para auto-detectar usuario por contraseña
export async function verifyClientPasswordAutoDetect(
  codigo: string, 
  password: string
): Promise<{ isValid: boolean; user?: any }> {
  try {
    // Obtener todos los usuarios activos del cliente
    const { data: users, error } = await supabase
      .from('usuarios_clientes')
      .select(`
        id,
        nombre,
        username,
        password_hash,
        es_admin_cliente,
        cliente_id,
        clientes!inner(codigo, activo)
      `)
      .eq('activo', true)
      .eq('clientes.codigo', codigo)
      .eq('clientes.activo', true);

    if (error || !users || users.length === 0) {
      console.error('Error al obtener usuarios del cliente:', error);
      return { isValid: false };
    }

    // Probar la contraseña contra cada usuario y recopilar coincidencias
    const matchingUsers = [];
    for (const user of users) {
      const isValid = await verifyPassword(password, user.password_hash);
      if (isValid) {
        matchingUsers.push({
          id: user.id,
          nombre: user.nombre,
          username: user.username,
          es_admin_cliente: user.es_admin_cliente,
          cliente_id: user.cliente_id
        });
      }
    }

    if (matchingUsers.length === 0) {
      return { isValid: false };
    }

    if (matchingUsers.length === 1) {
      // Solo un usuario coincide, perfecto
      return { isValid: true, user: matchingUsers[0] };
    }

    // Múltiples usuarios con la misma contraseña
    // Priorizar: 1) usuario 'admin', 2) usuario creado más recientemente, 3) primero en la lista
    const preferredUser = matchingUsers.find(u => u.username === 'admin') || 
                         matchingUsers.sort((a, b) => b.id.localeCompare(a.id))[0];

    console.warn(`Múltiples usuarios (${matchingUsers.length}) con la misma contraseña en cliente. Usando: ${preferredUser.username}`);
    
    return { isValid: true, user: preferredUser };
  } catch (error) {
    console.error('Error en auto-detección de usuario:', error);
    return { isValid: false };
  }
}

// Mantener compatibilidad con sistema anterior
export async function verifyClientPassword(codigo: string, password: string): Promise<boolean> {
  // Intentar auto-detección primero
  const autoResult = await verifyClientPasswordAutoDetect(codigo, password);
  if (autoResult.isValid) {
    return true;
  }

  // Fallback: intentar con usuario 'admin' por defecto para compatibilidad
  const result = await verifyClientUserPassword(codigo, 'admin', password);
  return result.isValid;
}

// Gestión de sesiones de administrador
export async function setAdminSession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE);
  return authCookie?.value === 'authenticated';
}

// Gestión de sesiones de cliente (nueva versión con usuarios)
export async function setClientUserSession(codigo: string, user: any): Promise<void> {
  const cookieStore = cookies();
  
  // Mantener compatibilidad con código de cliente
  cookieStore.set(CLIENT_AUTH_COOKIE, codigo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });

  // Nueva cookie con información del usuario
  cookieStore.set(CLIENT_USER_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
}

export async function setClientSession(codigo: string): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(CLIENT_AUTH_COOKIE, codigo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
}

export async function clearClientSession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(CLIENT_AUTH_COOKIE);
  cookieStore.delete(CLIENT_USER_COOKIE);
}

export async function getClientSession(): Promise<string | null> {
  const cookieStore = cookies();
  const authCookie = cookieStore.get(CLIENT_AUTH_COOKIE);
  return authCookie?.value || null;
}

export async function getCurrentClientUser(): Promise<any | null> {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get(CLIENT_USER_COOKIE);
    
    if (!userCookie?.value) {
      return null;
    }

    return JSON.parse(userCookie.value);
  } catch (error) {
    console.error('Error al obtener usuario cliente:', error);
    return null;
  }
}

export async function isClientAuthenticated(codigo: string): Promise<boolean> {
  const cookieStore = cookies();
  const authCookie = cookieStore.get(CLIENT_AUTH_COOKIE);
  return authCookie?.value === codigo;
}

export async function isClientUserAuthenticated(codigo: string): Promise<{ isAuthenticated: boolean; user?: any }> {
  const cookieStore = cookies();
  const authCookie = cookieStore.get(CLIENT_AUTH_COOKIE);
  const userCookie = cookieStore.get(CLIENT_USER_COOKIE);
  
  if (authCookie?.value !== codigo) {
    return { isAuthenticated: false };
  }

  try {
    const user = userCookie?.value ? JSON.parse(userCookie.value) : null;
    return { isAuthenticated: true, user };
  } catch (error) {
    return { isAuthenticated: false };
  }
}

// Utilidades para actualizar contraseñas
export async function updateAdminPassword(newPassword: string): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(newPassword);
    
    const { error } = await supabase
      .from('auth_admin')
      .upsert({ 
        id: '00000000-0000-0000-0000-000000000000', // ID fijo para admin
        password_hash: hashedPassword 
      });

    if (error) {
      console.error('Error al actualizar contraseña admin:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error en actualización de contraseña admin:', error);
    return false;
  }
}

export async function updateClientPassword(codigo: string, newPassword: string): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(newPassword);
    
    const { error } = await supabase
      .from('clientes')
      .update({ password_hash: hashedPassword })
      .eq('codigo', codigo);

    if (error) {
      console.error('Error al actualizar contraseña cliente:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error en actualización de contraseña cliente:', error);
    return false;
  }
}

// Verificar si una contraseña ya existe para un cliente
export async function checkPasswordExists(clienteId: string, password: string): Promise<boolean> {
  try {
    console.log('=== checkPasswordExists ===');
    
    const { data: users, error } = await supabase
      .from('usuarios_clientes')
      .select('password_hash')
      .eq('cliente_id', clienteId)
      .eq('activo', true);

    if (error) {
      console.error('Error al verificar contraseñas existentes:', error);
      return false; // En caso de error, permitir creación (evitar bloqueos)
    }

    if (!users || users.length === 0) {
      return false; // No hay usuarios, la contraseña es única
    }

    // Verificar si la contraseña coincide con alguna existente
    for (const user of users) {
      const matches = await verifyPassword(password, user.password_hash);
      if (matches) {
        console.log('Contraseña duplicada detectada para cliente:', clienteId);
        return true; // Contraseña ya existe
      }
    }

    return false; // Contraseña es única
  } catch (error) {
    console.error('Error en verificación de contraseña duplicada:', error);
    return false; // En caso de error, permitir creación
  }
}

// Gestión de usuarios de clientes
export async function createClientUser(
  clienteId: string,
  nombre: string,
  username: string,
  password: string,
  esAdminCliente = false
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    console.log('=== createClientUser ===');
    console.log('Params:', { clienteId, nombre, username, password: '[HIDDEN]', esAdminCliente });
    
    // Verificar si la contraseña ya existe
    const passwordExists = await checkPasswordExists(clienteId, password);
    if (passwordExists) {
      return {
        success: false,
        error: 'Esta contraseña ya está en uso por otro usuario. Elige una contraseña diferente.'
      };
    }
    
    const hashedPassword = await hashPassword(password);
    console.log('Password hashed successfully');
    
    const insertData = {
      cliente_id: clienteId,
      nombre,
      username,
      password_hash: hashedPassword,
      es_admin_cliente: esAdminCliente,
      activo: true
    };
    console.log('Insert data:', { ...insertData, password_hash: '[HIDDEN]' });
    
    const { data, error } = await supabase
      .from('usuarios_clientes')
      .insert(insertData)
      .select()
      .single();

    console.log('Supabase response - error:', error);
    console.log('Supabase response - data:', data);

    if (error) {
      console.error('Error al crear usuario cliente:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      
      return { 
        success: false, 
        error: error.code === '23505' ? 'El nombre de usuario ya existe' : `Error al crear usuario: ${error.message}`
      };
    }

    return { success: true, user: data };
  } catch (error) {
    console.error('Error en creación de usuario cliente:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return { success: false, error: `Error interno: ${error instanceof Error ? error.message : 'Unknown'}` };
  }
}

export async function updateClientUserPassword(
  userId: string,
  newPassword: string
): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(newPassword);
    
    const { error } = await supabase
      .from('usuarios_clientes')
      .update({ password_hash: hashedPassword })
      .eq('id', userId);

    if (error) {
      console.error('Error al actualizar contraseña usuario cliente:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error en actualización de contraseña usuario cliente:', error);
    return false;
  }
}

export async function getClientUsers(clienteId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios_clientes')
      .select('id, nombre, username, es_admin_cliente, activo, created_at')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error al obtener usuarios cliente:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en obtención de usuarios cliente:', error);
    return [];
  }
}

// Logging de actividades
export async function logActivity(
  usuarioId: string,
  clienteId: string,
  accion: string,
  detalles?: string,
  tareaId?: string,
  comentarioId?: string,
  accionTareaId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('logs_actividad')
      .insert({
        usuario_id: usuarioId,
        cliente_id: clienteId,
        accion,
        detalles,
        tarea_id: tareaId,
        comentario_id: comentarioId,
        accion_tarea_id: accionTareaId,
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (error) {
      console.error('Error al crear log de actividad:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error en logging de actividad:', error);
    return false;
  }
}

export async function getActivityLogs(
  clienteId?: string,
  limit = 100,
  offset = 0
): Promise<any[]> {
  try {
    let query = supabase
      .from('vista_logs_completa')
      .select('*')
      .order('fecha', { ascending: false })
      .range(offset, offset + limit - 1);

    if (clienteId) {
      query = query.eq('cliente_codigo', clienteId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener logs de actividad:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en obtención de logs de actividad:', error);
    return [];
  }
}
