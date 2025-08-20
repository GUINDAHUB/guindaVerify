import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Verificar si existen las tablas necesarias
    const tables = ['usuarios_clientes', 'logs_actividad'];
    const results = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        results[table] = {
          exists: !error,
          error: error?.message || null
        };
      } catch (e) {
        results[table] = {
          exists: false,
          error: e instanceof Error ? e.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json({
      tables: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Error checking tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
