import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';
import { getClientUsers } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 === DIAGNÓSTICO DE USUARIOS Y EMAILS ===');
    
    const supabaseService = getSupabaseService();
    
    // Obtener todos los clientes activos
    const clientes = await supabaseService.getAllClientes();
    const clientesActivos = clientes.filter((cliente: any) => cliente.activo);
    
    const diagnosticoUsuarios = [];
    
    for (const cliente of clientesActivos) {
      try {
        console.log(`\n🔍 Verificando usuarios de cliente: ${cliente.nombre}`);
        
        // Obtener usuarios del cliente
        const usuarios = await getClientUsers(cliente.id);
        
        // Filtrar usuarios con email y activos
        const usuariosConEmail = usuarios.filter(user => user.email && user.activo);
        const usuariosSinEmail = usuarios.filter(user => !user.email && user.activo);
        const usuariosInactivos = usuarios.filter(user => !user.activo);
        
        diagnosticoUsuarios.push({
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          totalUsuarios: usuarios.length,
          usuariosActivos: usuarios.filter(u => u.activo).length,
          usuariosConEmail: usuariosConEmail.length,
          usuariosSinEmail: usuariosSinEmail.length,
          usuariosInactivos: usuariosInactivos.length,
          emails: usuariosConEmail.map(u => u.email),
          usuariosDetalle: usuarios.map(u => ({
            id: u.id,
            nombre: u.nombre || 'Sin nombre',
            email: u.email || 'Sin email',
            activo: u.activo,
            createdAt: u.createdAt
          })),
          puedeRecibirNotificaciones: usuariosConEmail.length > 0
        });
        
        console.log(`- Total usuarios: ${usuarios.length}`);
        console.log(`- Usuarios activos con email: ${usuariosConEmail.length}`);
        console.log(`- Emails: ${usuariosConEmail.map(u => u.email).join(', ')}`);
        
      } catch (error) {
        console.error(`❌ Error obteniendo usuarios de ${cliente.nombre}:`, error);
        diagnosticoUsuarios.push({
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          error: error instanceof Error ? error.message : 'Error desconocido',
          puedeRecibirNotificaciones: false
        });
      }
    }

    // Generar resumen
    const resumen = {
      totalClientes: clientesActivos.length,
      clientesConUsuarios: diagnosticoUsuarios.filter(d => !d.error && d.totalUsuarios > 0).length,
      clientesConEmails: diagnosticoUsuarios.filter(d => !d.error && d.usuariosConEmail > 0).length,
      clientesSinEmails: diagnosticoUsuarios.filter(d => !d.error && d.usuariosConEmail === 0).length,
      totalEmailsConfigurados: diagnosticoUsuarios.reduce((sum, d) => sum + (d.usuariosConEmail || 0), 0)
    };

    // Generar recomendaciones
    const recomendaciones = [];
    
    if (resumen.clientesSinEmails > 0) {
      recomendaciones.push(`⚠️ ${resumen.clientesSinEmails} clientes no tienen usuarios con email configurado`);
    }
    
    const clientesSinUsuarios = diagnosticoUsuarios.filter(d => !d.error && d.totalUsuarios === 0);
    if (clientesSinUsuarios.length > 0) {
      recomendaciones.push(`👥 ${clientesSinUsuarios.length} clientes no tienen usuarios configurados`);
    }
    
    if (resumen.totalEmailsConfigurados === 0) {
      recomendaciones.push('❌ CRÍTICO: No hay emails configurados en ningún cliente');
    }
    
    if (recomendaciones.length === 0) {
      recomendaciones.push('✅ Configuración de usuarios y emails correcta');
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      resumen,
      diagnosticoUsuarios,
      recomendaciones
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico de usuarios:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
