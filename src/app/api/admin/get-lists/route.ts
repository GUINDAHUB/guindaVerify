import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    console.log('🟢 POST /api/admin/get-lists - Inicio');
    const body = await request.json();
    console.log('📥 Body recibido:', { hasApiKey: !!body.apiKey, workspaceId: body.workspaceId });
    
    const { apiKey, workspaceId } = body;

    console.log('🔍 Obteniendo listas del workspace:', workspaceId);

    if (!apiKey || !workspaceId) {
      return NextResponse.json({ 
        error: 'API Key y Workspace ID son requeridos',
        step: 'validation'
      }, { status: 400 });
    }

    const headers = {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    };

    try {
      // Obtener espacios del workspace
      console.log('🌐 Realizando petición a ClickUp API...');
      const spacesResponse = await axios.get(
        `https://api.clickup.com/api/v2/team/${workspaceId}/space`,
        { headers }
      );
      console.log('✅ Respuesta de ClickUp recibida:', spacesResponse.status);
      
      const spaces = spacesResponse.data.spaces || [];
      console.log(`📋 Espacios encontrados: ${spaces.length}`);
      
      const allLists = [];
      
      // Para cada espacio, obtener las listas
      for (const space of spaces) {
        try {
          console.log(`🔍 Explorando espacio: "${space.name}" (ID: ${space.id})`);
          
          // 1. Obtener listas directas del espacio
          const listsResponse = await axios.get(
            `https://api.clickup.com/api/v2/space/${space.id}/list`,
            { headers }
          );
          
          const directLists = listsResponse.data.lists || [];
          console.log(`📝 Listas directas en espacio "${space.name}": ${directLists.length}`);
          
          directLists.forEach(list => {
            allLists.push({
              id: list.id,
              name: list.name,
              spaceId: space.id,
              spaceName: space.name,
              folderName: null,
              taskCount: list.task_count || 0,
              location: 'Espacio'
            });
          });

          // 2. Obtener folders del espacio y sus listas
          try {
            const foldersResponse = await axios.get(
              `https://api.clickup.com/api/v2/space/${space.id}/folder`,
              { headers }
            );
            
            const folders = foldersResponse.data.folders || [];
            console.log(`📁 Folders en espacio "${space.name}": ${folders.length}`);
            
            // Para cada folder, obtener sus listas
            for (const folder of folders) {
              try {
                const folderListsResponse = await axios.get(
                  `https://api.clickup.com/api/v2/folder/${folder.id}/list`,
                  { headers }
                );
                
                const folderLists = folderListsResponse.data.lists || [];
                console.log(`📋 Listas en folder "${folder.name}": ${folderLists.length}`);
                
                folderLists.forEach(list => {
                  allLists.push({
                    id: list.id,
                    name: list.name,
                    spaceId: space.id,
                    spaceName: space.name,
                    folderId: folder.id,
                    folderName: folder.name,
                    taskCount: list.task_count || 0,
                    location: `${folder.name}`
                  });
                });
              } catch (folderError) {
                console.log(`⚠️ Error obteniendo listas del folder ${folder.name}:`, folderError.message);
              }
            }
          } catch (foldersError) {
            console.log(`⚠️ Error obteniendo folders del espacio ${space.name}:`, foldersError.message);
          }
          
        } catch (spaceError) {
          console.log(`⚠️ Error obteniendo listas del espacio ${space.name}:`, spaceError.message);
        }
      }
      
      return NextResponse.json({
        step: 'success',
        message: 'Listas obtenidas correctamente',
        lists: allLists,
        total: allLists.length
      });
      
    } catch (error: any) {
      console.error('❌ Error obteniendo listas:', error.response?.status, error.response?.data);
      
      if (error.response?.status === 404) {
        return NextResponse.json({
          step: 'workspace_not_found',
          error: 'Workspace no encontrado',
          details: 'El Workspace ID no existe o no tienes acceso a él'
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
          error: 'Error al obtener las listas',
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