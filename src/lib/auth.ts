import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { supabase } from './supabase';

// Configuración de cookies
const AUTH_COOKIE = 'guinda-auth';
const CLIENT_AUTH_COOKIE = 'guinda-client-auth';

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

// Autenticación de clientes
export async function verifyClientPassword(codigo: string, password: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('password_hash')
      .eq('codigo', codigo)
      .eq('activo', true)
      .single();

    if (error || !data || !data.password_hash) {
      console.error('Error al obtener contraseña cliente:', error);
      return false;
    }

    return await verifyPassword(password, data.password_hash);
  } catch (error) {
    console.error('Error en verificación cliente:', error);
    return false;
  }
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

// Gestión de sesiones de cliente
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
}

export async function getClientSession(): Promise<string | null> {
  const cookieStore = cookies();
  const authCookie = cookieStore.get(CLIENT_AUTH_COOKIE);
  return authCookie?.value || null;
}

export async function isClientAuthenticated(codigo: string): Promise<boolean> {
  const cookieStore = cookies();
  const authCookie = cookieStore.get(CLIENT_AUTH_COOKIE);
  return authCookie?.value === codigo;
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
