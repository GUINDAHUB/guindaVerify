'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search, Filter, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from '@/components/admin-layout';

interface LogEntry {
  id: string;
  fecha: string;
  accion: string;
  detalles?: string;
  tarea_id?: string;
  tarea_nombre?: string;
  usuario_nombre?: string;
  usuario_username?: string;
  cliente_nombre?: string;
  cliente_codigo?: string;
  ip_address?: string;
  user_agent?: string;
}

export function AdminLogsClient() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<string>('all');
  const [selectedAccion, setSelectedAccion] = useState<string>('all');
  const [clientes, setClientes] = useState<any[]>([]);
  const [acciones, setAcciones] = useState<string[]>([]);

  useEffect(() => {
    loadLogs();
    loadClientes();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, selectedCliente, selectedAccion]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/logs?limit=500');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        
        // Extraer acciones únicas
        const uniqueAcciones = [...new Set(data.logs.map((log: LogEntry) => log.accion))];
        setAcciones(uniqueAcciones);
      } else {
        toast.error('Error al cargar logs');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    try {
      const response = await fetch('/api/admin/clientes');
      if (response.ok) {
        const data = await response.json();
        // La API devuelve un array directamente o un objeto con clientes
        const clientesArray = Array.isArray(data) ? data : (data.clientes || []);
        setClientes(clientesArray);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setClientes([]); // Asegurar que siempre sea un array
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.usuario_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.detalles?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.tarea_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.tarea_id?.includes(searchTerm)
      );
    }

    // Filtrar por cliente
    if (selectedCliente !== 'all') {
      filtered = filtered.filter(log => log.cliente_codigo === selectedCliente);
    }

    // Filtrar por acción
    if (selectedAccion !== 'all') {
      filtered = filtered.filter(log => log.accion === selectedAccion);
    }

    setFilteredLogs(filtered);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getAccionBadge = (accion: string) => {
    const badgeClasses: { [key: string]: string } = {
      login: 'bg-green-100 text-green-800',
      logout: 'bg-gray-100 text-gray-800',
      aprobar: 'bg-blue-100 text-blue-800',
      hay_cambios: 'bg-yellow-100 text-yellow-800',
      comentar: 'bg-purple-100 text-purple-800',
      migracion_sistema: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={badgeClasses[accion] || 'bg-gray-100 text-gray-800'}>
        {accion.replace('_', ' ')}
      </Badge>
    );
  };

  const exportLogs = () => {
    const csvContent = [
      ['Fecha', 'Usuario', 'Cliente', 'Acción', 'Detalles', 'Tarea', 'IP'].join(','),
      ...filteredLogs.map(log => [
        formatFecha(log.fecha),
        log.usuario_nombre || '-',
        log.cliente_nombre || '-',
        log.accion,
        log.detalles || '-',
        log.tarea_nombre || log.tarea_id || '-',
        log.ip_address || '-'
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_actividad_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Logs de Actividad</CardTitle>
                <CardDescription>
                  Registro completo de todas las actividades del sistema
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button onClick={exportLogs} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button onClick={loadLogs} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por usuario, cliente, acción, detalles o tarea..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {Array.isArray(clientes) && clientes.map((cliente) => (
                      <SelectItem key={cliente.codigo} value={cliente.codigo}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedAccion} onValueChange={setSelectedAccion}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Acción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las acciones</SelectItem>
                    {acciones.map((accion) => (
                      <SelectItem key={accion} value={accion}>
                        {accion.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Actividades Registradas ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-500 mt-2">Cargando logs...</p>
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium">Fecha</th>
                      <th className="text-left py-3 px-4 font-medium">Usuario</th>
                      <th className="text-left py-3 px-4 font-medium">Cliente</th>
                      <th className="text-left py-3 px-4 font-medium">Acción</th>
                      <th className="text-left py-3 px-4 font-medium">Detalles</th>
                      <th className="text-left py-3 px-4 font-medium">Tarea</th>
                      <th className="text-left py-3 px-4 font-medium">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">
                          {formatFecha(log.fecha)}
                        </td>
                        <td className="py-3 px-4">
                          {log.usuario_nombre ? (
                            <div>
                              <div className="font-medium">{log.usuario_nombre}</div>
                              <div className="text-sm text-gray-500">@{log.usuario_username}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {log.cliente_nombre ? (
                            <div>
                              <div className="font-medium">{log.cliente_nombre}</div>
                              <div className="text-sm text-gray-500">{log.cliente_codigo}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getAccionBadge(log.accion)}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          {log.detalles ? (
                            <div className="truncate" title={log.detalles}>
                              {log.detalles}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {log.tarea_nombre || log.tarea_id ? (
                            <div>
                              <div className="font-medium">
                                {log.tarea_nombre || log.tarea_id}
                              </div>
                              {log.tarea_nombre && log.tarea_id && (
                                <div className="text-xs text-gray-500">
                                  ID: {log.tarea_id}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {log.ip_address || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || selectedCliente !== 'all' || selectedAccion !== 'all'
                  ? 'No se encontraron logs que coincidan con los filtros aplicados'
                  : 'No hay logs de actividad registrados'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
