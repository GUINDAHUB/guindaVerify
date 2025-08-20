'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Bug, RefreshCw } from "lucide-react";
import AdminLayout from '@/components/admin-layout';

export function DebugClickUpClient() {
  const [taskId, setTaskId] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleDebugTask = async () => {
    if (!taskId.trim()) {
      toast.error('Por favor ingresa un Task ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/debug-clickup-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId: taskId.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error debugging task');
      }

      const data = await response.json();
      setResults(data);
      toast.success('Debug completado - revisa la consola del navegador');
      console.log('🔍 RESULTADO DEBUG CLICKUP:', data);
    } catch (error) {
      console.error('Error debugging task:', error);
      toast.error(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Debug ClickUp</h1>
          <p className="text-gray-600 mt-2">
            Herramienta para investigar problemas con fechas y campos personalizados de ClickUp
          </p>
        </div>

        {/* Debug Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bug className="h-5 w-5" />
              <span>Investigar Tarea de ClickUp</span>
            </CardTitle>
            <CardDescription>
              Introduce el ID de una tarea para ver todos sus datos en detalle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="taskId">Task ID de ClickUp</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="taskId"
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  placeholder="Ej: 86dtt61vg"
                  className="flex-1"
                />
                <Button 
                  onClick={handleDebugTask}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span>{loading ? 'Investigando...' : 'Debug'}</span>
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                El Task ID se encuentra en la URL de la tarea de ClickUp
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica de la Tarea</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID</Label>
                    <p className="font-mono text-sm">{results.debugInfo.taskId}</p>
                  </div>
                  <div>
                    <Label>Nombre</Label>
                    <p className="text-sm">{results.debugInfo.taskName}</p>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <p className="text-sm">{results.debugInfo.status.status}</p>
                  </div>
                  <div>
                    <Label>URL</Label>
                    <a href={results.debugInfo.url} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:underline text-sm">
                      Ver en ClickUp
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fechas Estándar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(results.debugInfo.dates).map(([key, value]) => (
                    <div key={key}>
                      <Label>{key}</Label>
                      <p className="font-mono text-sm">{value || 'null'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campos Personalizados ({results.debugInfo.custom_fields.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.debugInfo.custom_fields.map((field: any, index: number) => (
                    <div key={field.id} className="p-3 border rounded-lg">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <Label>Nombre</Label>
                          <p className="font-semibold">{field.name}</p>
                        </div>
                        <div>
                          <Label>Tipo</Label>
                          <p className="font-mono">{field.type}</p>
                        </div>
                        <div>
                          <Label>Valor</Label>
                          <p className="font-mono break-all">
                            {field.value !== null ? String(field.value) : 'null'}
                          </p>
                        </div>
                      </div>
                      {field.type_config && (
                        <div className="mt-2">
                          <Label>Configuración del Tipo</Label>
                          <pre className="text-xs bg-gray-100 p-2 rounded">
                            {JSON.stringify(field.type_config, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publicación Convertida</CardTitle>
                <CardDescription>
                  Cómo interpreta GuindaVerify esta tarea
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha Programada</Label>
                    <p className="font-mono text-sm">
                      {results.publicacionConvertida.fechaProgramada || 'No detectada'}
                    </p>
                  </div>
                  <div>
                    <Label>Tipo de Publicación</Label>
                    <p className="text-sm">
                      {results.publicacionConvertida.tipoPublicacion || 'No detectado'}
                    </p>
                  </div>
                  <div>
                    <Label>Plataformas</Label>
                    <p className="text-sm">
                      {results.publicacionConvertida.plataformaPublicacion?.join(', ') || 'No detectadas'}
                    </p>
                  </div>
                  <div>
                    <Label>Texto de Publicación</Label>
                    <p className="text-sm">
                      {results.publicacionConvertida.textoPublicacion || 'No detectado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datos Completos (JSON)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={JSON.stringify(results, null, 2)}
                  readOnly
                  className="font-mono text-xs h-64"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
