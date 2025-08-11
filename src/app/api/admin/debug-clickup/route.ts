import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, workspaceId } = body;

    console.log('🔍 Iniciando diagnóstico de ClickUp...');
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'No proporcionada');
    console.log('Workspace ID:', workspaceId || 'No proporcionado');

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API Key es requerida',
        step: 'validation'
      }, { status: 400 });
    }

    const headers = {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    };

    // Paso 1: Probar API Key
    console.log('📡 Paso 1: Probando API Key...');
    let userInfo;
    try {
      const userResponse = await axios.get('https://api.clickup.com/api/v2/user', { headers });
      userInfo = userResponse.data;
      console.log('✅ API Key válida - Usuario:', userInfo.user?.username);
    } catch (error: any) {
      console.error('❌ Error con API Key:', error.response?.status, error.response?.data);
      return NextResponse.json({
        step: 'api_key_test',
        error: 'API Key inválida',
        status: error.response?.status,
        details: error.response?.data?.err || error.message
      }, { status: 400 });
    }

    // Paso 2: Obtener todos los workspaces disponibles
    console.log('📋 Paso 2: Obteniendo workspaces disponibles...');
    try {
      const teamsResponse = await axios.get('https://api.clickup.com/api/v2/team', { headers });
      const teams = teamsResponse.data;
      console.log('✅ Workspaces encontrados:', teams.teams?.length || 0);
      
      const availableWorkspaces = teams.teams?.map((team: any) => ({
        id: team.id,
        name: team.name,
        color: team.color
      })) || [];

      // Paso 3: Probar Workspace ID específico si se proporciona
      if (workspaceId) {
        console.log('📡 Paso 3: Probando Workspace ID específico:', workspaceId);
        try {
          const workspaceResponse = await axios.get(
            `https://api.clickup.com/api/v2/workspace/${workspaceId}`,
            { headers }
          );
          const workspaceInfo = workspaceResponse.data;
          console.log('✅ Workspace válido:', workspaceInfo.name);
          
          return NextResponse.json({
            step: 'success',
            message: 'Conexión exitosa',
            user: {
              username: userInfo.user?.username,
              email: userInfo.user?.email
            },
            workspace: {
              id: workspaceInfo.id,
              name: workspaceInfo.name
            },
            availableWorkspaces
          });
        } catch (error: any) {
          console.error('❌ Error con Workspace ID específico:', error.response?.status);
          return NextResponse.json({
            step: 'workspace_test',
            message: 'API Key válida, pero Workspace ID incorrecto',
            user: {
              username: userInfo.user?.username,
              email: userInfo.user?.email
            },
            availableWorkspaces,
            error: error.response?.data?.err || error.message,
            status: error.response?.status
          }, { status: 400 });
        }
      } else {
        // Solo API Key, sin Workspace ID
        return NextResponse.json({
          step: 'api_key_only',
          message: 'API Key válida',
          user: {
            username: userInfo.user?.username,
            email: userInfo.user?.email
          },
          availableWorkspaces
        });
      }

    } catch (error: any) {
      console.error('❌ Error obteniendo workspaces:', error.response?.status);
      return NextResponse.json({
        step: 'teams_test',
        message: 'API Key válida, pero no se pueden obtener workspaces',
        user: {
          username: userInfo.user?.username,
          email: userInfo.user?.email
        },
        error: error.response?.data?.err || error.message,
        status: error.response?.status
      }, { status: 400 });
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