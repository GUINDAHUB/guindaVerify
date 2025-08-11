import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, listId } = body;

    console.log('🔍 Obteniendo estados de la lista:', listId);

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

    try {
      // Obtener información de la lista incluyendo los estados
      const listResponse = await axios.get(
        `https://api.clickup.com/api/v2/list/${listId}`,
        { headers }
      );
      
      const list = listResponse.data;
      const statuses = list.statuses || [];
      
      console.log(`📋 Estados encontrados: ${statuses.length}`);
      
      // Formatear los estados para el frontend
      const formattedStatuses = statuses.map((status: any) => ({
        id: status.id,
        status: status.status,
        color: status.color,
        orderindex: status.orderindex,
        type: status.type
      }));
      
      return NextResponse.json({
        step: 'success',
        message: 'Estados obtenidos correctamente',
        list: {
          id: list.id,
          name: list.name
        },
        statuses: formattedStatuses,
        total: formattedStatuses.length
      });
      
    } catch (error: any) {
      console.error('❌ Error obteniendo estados:', error.response?.status, error.response?.data);
      
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
          error: 'Error al obtener los estados',
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

