import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, listId } = body;

    console.log('🔍 Probando List ID:', listId);

    if (!apiKey || !listId) {
      return NextResponse.json({ 
        error: 'API Key y List ID son requeridos',
        step: 'validation'
      }, { status: 400 });
    }

    const headers = {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    };

    // Probar el endpoint de la lista
    try {
      const response = await axios.get(
        `https://api.clickup.com/api/v2/list/${listId}`,
        { headers }
      );
      
      console.log('✅ Lista encontrada:', response.data.name);
      
      return NextResponse.json({
        step: 'success',
        message: 'Lista encontrada',
        list: {
          id: response.data.id,
          name: response.data.name,
          taskCount: response.data.task_count
        }
      });
    } catch (error: any) {
      console.error('❌ Error con List ID:', error.response?.status, error.response?.data);
      
      if (error.response?.status === 404) {
        return NextResponse.json({
          step: 'list_not_found',
          error: 'Lista no encontrada',
          details: 'El List ID no existe o no tienes acceso a él'
        }, { status: 404 });
      } else if (error.response?.status === 401) {
        return NextResponse.json({
          step: 'unauthorized',
          error: 'API Key inválida',
          details: 'Verifica que la API Key sea correcta'
        }, { status: 401 });
      } else {
        return NextResponse.json({
          step: 'error',
          error: 'Error al verificar la lista',
          details: error.response?.data?.err || error.message
        }, { status: error.response?.status || 500 });
      }
    }

  } catch (error: any) {
    console.error('❌ Error general:', error);
    return NextResponse.json({
      step: 'general_error',
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
} 