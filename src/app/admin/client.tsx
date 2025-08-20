'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Users, Settings, Eye, RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Cliente } from '@/types';
import AdminLayout from '@/components/admin-layout';

export function AdminPageClient() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    email: '',
    clickupListId: '',
    estadosVisibles: '',
    estadosAprobacion: '',
    estadosRechazo: ''
  });

  // Nuevos estados para ClickUp
  const [clickupLists, setClickupLists] = useState<any[]>([]);
  const [clickupStatuses, setClickupStatuses] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [selectedList, setSelectedList] = useState<string>('');
  const [selectedEstadosVisibles, setSelectedEstadosVisibles] = useState<string[]>([]);
  const [selectedEstadosAprobacion, setSelectedEstadosAprobacion] = useState<string[]>([]);
  const [selectedEstadosRechazo, setSelectedEstadosRechazo] = useState<string[]>([]);

  
  // Estados para gestión de usuarios
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [selectedClienteForUsers, setSelectedClienteForUsers] = useState<Cliente | null>(null);
  const [clientUsers, setClientUsers] = useState<any[]>([]);
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    nombre: '',
    password: ''
  });
  const [passwordCheckStatus, setPasswordCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const response = await fetch('/api/admin/clientes');
      if (response.ok) {
        const data = await response.json();
        setClientes(data.clientes);
      } else {
        toast.error('Error al cargar clientes');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadClickUpLists = async () => {
    try {
      setLoadingLists(true);
      
      console.log('🔄 Iniciando carga de listas de ClickUp...');
      
      // Obtener configuración de ClickUp
      const configResponse = await fetch('/api/admin/configuracion');
      console.log('📋 Respuesta de configuración:', configResponse.status);
      
      if (!configResponse.ok) {
        const errorText = await configResponse.text();
        console.error('❌ Error al obtener configuración:', errorText);
        toast.error('Error al obtener configuración de ClickUp');
        return;
      }
      
      const configData = await configResponse.json();
      console.log('⚙️ Configuración obtenida:', {
        hasApiKey: !!configData.config?.clickupApiKey,
        hasWorkspaceId: !!configData.config?.clickupWorkspaceId
      });
      
      const { clickupApiKey, clickupWorkspaceId } = configData.config;
      
      if (!clickupApiKey || !clickupWorkspaceId) {
        toast.error('ClickUp no está configurado. Ve a Configuración primero.');
        return;
      }

      console.log('🚀 Enviando petición a get-lists...');
      const response = await fetch('/api/admin/get-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: clickupApiKey,
          workspaceId: clickupWorkspaceId
        })
      });

      console.log('📨 Respuesta de get-lists:', response.status);
      const data = await response.json();
      console.log('📦 Datos recibidos:', data);
      
      if (response.ok) {
        setClickupLists(data.lists || []);
        toast.success(`${data.lists?.length || 0} listas cargadas de ClickUp`);
      } else {
        console.error('❌ Error en la respuesta:', data);
        toast.error(data.error || 'Error al cargar listas de ClickUp');
      }
    } catch (error) {
      console.error('💥 Error en loadClickUpLists:', error);
      toast.error(`Error de conexión al cargar listas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoadingLists(false);
    }
  };

  const loadClickUpStatuses = async (listId: string) => {
    try {
      setLoadingStatuses(true);
      
      // Obtener configuración de ClickUp
      const configResponse = await fetch('/api/admin/configuracion');
      if (!configResponse.ok) {
        toast.error('Error al obtener configuración de ClickUp');
        return;
      }
      
      const configData = await configResponse.json();
      const { clickupApiKey } = configData.config;
      
      if (!clickupApiKey) {
        toast.error('ClickUp no está configurado. Ve a Configuración primero.');
        return;
      }

      const response = await fetch('/api/admin/get-list-statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: clickupApiKey,
          listId: listId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setClickupStatuses(data.statuses || []);
        toast.success(`${data.statuses?.length || 0} estados cargados`);
      } else {
        toast.error(data.error || 'Error al cargar estados de la lista');
      }
    } catch (error) {
      toast.error('Error de conexión al cargar estados');
    } finally {
      setLoadingStatuses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCliente 
        ? `/api/admin/clientes/${editingCliente.id}`
        : '/api/admin/clientes';
      
      const method = editingCliente ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          clickupListId: selectedList || formData.clickupListId,
          estadosVisibles: selectedEstadosVisibles.length > 0 ? selectedEstadosVisibles : 
            (formData.estadosVisibles ? formData.estadosVisibles.split(',').map(s => s.trim()) : []),
          estadosAprobacion: selectedEstadosAprobacion.length > 0 ? selectedEstadosAprobacion : 
            (formData.estadosAprobacion ? formData.estadosAprobacion.split(',').map(s => s.trim()) : []),
          estadosRechazo: selectedEstadosRechazo.length > 0 ? selectedEstadosRechazo : 
            (formData.estadosRechazo ? formData.estadosRechazo.split(',').map(s => s.trim()) : []),
        }),
      });

      if (response.ok) {
        toast.success(editingCliente ? 'Cliente actualizado' : 'Cliente creado');
        setIsDialogOpen(false);
        resetForm();
        loadClientes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar cliente');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return;
    
    try {
      const response = await fetch(`/api/admin/clientes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Cliente eliminado');
        loadClientes();
      } else {
        toast.error('Error al eliminar cliente');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      codigo: cliente.codigo,
      nombre: cliente.nombre,
      email: cliente.email || '',
      clickupListId: cliente.clickupListId,
      estadosVisibles: cliente.estadosVisibles.join(', '),
      estadosAprobacion: cliente.estadosAprobacion.join(', '),
      estadosRechazo: cliente.estadosRechazo.join(', '),
    });
    
    // Configurar los estados seleccionados para el modo edición
    setSelectedList(cliente.clickupListId);
    setSelectedEstadosVisibles(cliente.estadosVisibles);
    setSelectedEstadosAprobacion(cliente.estadosAprobacion);
    setSelectedEstadosRechazo(cliente.estadosRechazo);
    
    // Cargar los estados de la lista si tenemos el ID
    if (cliente.clickupListId) {
      loadClickUpStatuses(cliente.clickupListId);
    }
    
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCliente(null);
    setFormData({
      codigo: '',
      nombre: '',
      email: '',
      clickupListId: '',
      estadosVisibles: '',
      estadosAprobacion: '',
      estadosRechazo: ''
    });
    
    // Limpiar los nuevos estados
    setSelectedList('');
    setSelectedEstadosVisibles([]);
    setSelectedEstadosAprobacion([]);
    setSelectedEstadosRechazo([]);
    setClickupLists([]);
    setClickupStatuses([]);
  };

  const getClienteUrl = (codigo: string) => {
    return `${window.location.origin}/cliente/${codigo}`;
  };

  const handleListSelect = (listId: string) => {
    setSelectedList(listId);
    setFormData({...formData, clickupListId: listId});
    
    // Limpiar estados previos
    setSelectedEstadosVisibles([]);
    setSelectedEstadosAprobacion([]);
    setSelectedEstadosRechazo([]);
    setClickupStatuses([]);
    
    // Cargar estados de la nueva lista
    if (listId) {
      loadClickUpStatuses(listId);
    }
  };

  const handleStatusSelect = (status: string, type: 'visible' | 'aprobacion' | 'rechazo') => {
    switch (type) {
      case 'visible':
        const newVisibles = selectedEstadosVisibles.includes(status)
          ? selectedEstadosVisibles.filter(s => s !== status)
          : [...selectedEstadosVisibles, status];
        setSelectedEstadosVisibles(newVisibles);
        break;
      case 'aprobacion':
        const newAprobacion = selectedEstadosAprobacion.includes(status)
          ? selectedEstadosAprobacion.filter(s => s !== status)
          : [...selectedEstadosAprobacion, status];
        setSelectedEstadosAprobacion(newAprobacion);
        break;
      case 'rechazo':
        const newRechazo = selectedEstadosRechazo.includes(status)
          ? selectedEstadosRechazo.filter(s => s !== status)
          : [...selectedEstadosRechazo, status];
        setSelectedEstadosRechazo(newRechazo);
        break;
    }
  };



  // Funciones para gestión de usuarios
  const loadClientUsers = async (clienteId: string) => {
    try {
      const response = await fetch(`/api/admin/clientes/${clienteId}/usuarios`);
      if (response.ok) {
        const data = await response.json();
        setClientUsers(data.usuarios);
      } else {
        toast.error('Error al cargar usuarios');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleManageUsers = (cliente: Cliente) => {
    setSelectedClienteForUsers(cliente);
    setUsersDialogOpen(true);
    loadClientUsers(cliente.id);
  };

  const handleCreateUser = async () => {
    if (!selectedClienteForUsers || !newUserData.nombre || !newUserData.password) {
      toast.error('Nombre y contraseña son requeridos');
      return;
    }

    if (newUserData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Verificar si la contraseña ya existe (esto requeriría llamar al backend para verificar)
    // Por ahora, solo mostramos una advertencia en la UI si hay usuarios múltiples

    try {
      const requestData = {
        nombre: newUserData.nombre,
        password: newUserData.password,
        esAdminCliente: false
      };

      const response = await fetch(`/api/admin/clientes/${selectedClienteForUsers.id}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('Usuario creado correctamente');
        setNewUserDialogOpen(false);
        setNewUserData({ nombre: '', password: '' });
        loadClientUsers(selectedClienteForUsers.id);
      } else {
        const responseText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: 'Error de servidor desconocido' };
        }
        
        toast.error(errorData.error || 'Error al crear usuario');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${userName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/clientes/${selectedClienteForUsers?.id}/usuarios?userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Usuario eliminado correctamente');
        loadClientUsers(selectedClienteForUsers!.id);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const checkPasswordAvailability = async (password: string) => {
    if (!password || password.length < 6 || !selectedClienteForUsers) {
      setPasswordCheckStatus('idle');
      return;
    }

    setPasswordCheckStatus('checking');

    try {
      const response = await fetch(`/api/admin/clientes/${selectedClienteForUsers.id}/check-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        setPasswordCheckStatus(data.exists ? 'taken' : 'available');
      } else {
        setPasswordCheckStatus('idle');
      }
    } catch (error) {
      setPasswordCheckStatus('idle');
    }
  };

  return (
    <AdminLayout>
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
            <p className="text-xs text-muted-foreground">
              Clientes registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientes.filter(c => c.activo).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes con acceso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuración</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">✓</div>
            <p className="text-xs text-muted-foreground">
              Sistema configurado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clientes Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestión de Clientes</CardTitle>
              <CardDescription>
                Administra los clientes y sus configuraciones
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCliente 
                      ? 'Modifica la información del cliente'
                      : 'Añade un nuevo cliente al sistema'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="codigo">Código *</Label>
                      <Input
                        id="codigo"
                        value={formData.codigo}
                        onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                        placeholder="mi-cliente"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Usado en la URL: /cliente/[codigo]
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        placeholder="Mi Cliente"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="cliente@ejemplo.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clickupListId">Lista ClickUp *</Label>
                      <div className="flex gap-2">
                        <Select onValueChange={handleListSelect} value={selectedList || formData.clickupListId}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecciona una lista..." />
                          </SelectTrigger>
                          <SelectContent>
                            {clickupLists.map((list) => (
                              <SelectItem key={list.id} value={list.id}>
                                {list.name} 
                                <span className="text-gray-500 text-xs ml-2">
                                  ({list.spaceName}{list.folderName ? ` → ${list.folderName}` : ''})
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={loadClickUpLists}
                          disabled={loadingLists}
                        >
                          {loadingLists ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Haz clic en el botón para cargar listas desde ClickUp
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label>Estados Visibles *</Label>
                    <div className="border rounded-md p-3 min-h-[80px] bg-gray-50">
                      {loadingStatuses ? (
                        <div className="flex items-center justify-center py-4">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">Cargando estados...</span>
                        </div>
                      ) : clickupStatuses.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {clickupStatuses.map((status) => (
                            <Button
                              key={status.id}
                              type="button"
                              variant={selectedEstadosVisibles.includes(status.status) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleStatusSelect(status.status, 'visible')}
                              className="text-xs"
                            >
                              {status.status}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 py-4">
                          {selectedList ? 'No se encontraron estados' : 'Selecciona una lista primero'}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Estados que aparecerán en el portal del cliente
                    </p>
                    {selectedEstadosVisibles.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        Seleccionados: {selectedEstadosVisibles.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Estados Aprobación *</Label>
                      <div className="border rounded-md p-3 min-h-[80px] bg-gray-50">
                        {loadingStatuses ? (
                          <div className="flex items-center justify-center py-4">
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-xs text-gray-500">Cargando...</span>
                          </div>
                        ) : clickupStatuses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {clickupStatuses.map((status) => (
                              <Button
                                key={status.id}
                                type="button"
                                variant={selectedEstadosAprobacion.includes(status.status) ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStatusSelect(status.status, 'aprobacion')}
                                className="text-xs"
                              >
                                {status.status}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 py-4">
                            {selectedList ? 'No hay estados' : 'Selecciona lista'}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Al aprobar
                      </p>
                      {selectedEstadosAprobacion.length > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          {selectedEstadosAprobacion.join(', ')}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Estados Rechazo *</Label>
                      <div className="border rounded-md p-3 min-h-[80px] bg-gray-50">
                        {loadingStatuses ? (
                          <div className="flex items-center justify-center py-4">
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-xs text-gray-500">Cargando...</span>
                          </div>
                        ) : clickupStatuses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {clickupStatuses.map((status) => (
                              <Button
                                key={status.id}
                                type="button"
                                variant={selectedEstadosRechazo.includes(status.status) ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStatusSelect(status.status, 'rechazo')}
                                className="text-xs"
                              >
                                {status.status}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 py-4">
                            {selectedList ? 'No hay estados' : 'Selecciona lista'}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Al rechazar
                      </p>
                      {selectedEstadosRechazo.length > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {selectedEstadosRechazo.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingCliente ? 'Actualizar' : 'Crear'} Cliente
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
              <p>Cargando clientes...</p>
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay clientes registrados</p>
              <p className="text-sm text-gray-400">Crea tu primer cliente para empezar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium">Código</th>
                    <th className="text-left py-3 px-4 font-medium">Estado</th>
                    <th className="text-left py-3 px-4 font-medium">URL Portal</th>
                    <th className="text-left py-3 px-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{cliente.nombre}</div>
                          {cliente.email && (
                            <div className="text-sm text-gray-500">{cliente.email}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {cliente.codigo}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={cliente.activo ? "default" : "secondary"}>
                          {cliente.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={getClienteUrl(cliente.codigo)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Ver portal →
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(cliente)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleManageUsers(cliente)}
                            className="text-green-600 hover:text-green-800"
                            title="Gestionar usuarios"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(cliente.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Diálogo para gestionar usuarios del cliente */}
      <Dialog open={usersDialogOpen} onOpenChange={setUsersDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gestionar Usuarios - {selectedClienteForUsers?.nombre}</DialogTitle>
            <DialogDescription>
              Administra los usuarios que pueden acceder al portal de este cliente
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Usuarios del Cliente</h3>
              <Button onClick={() => {
                setNewUserDialogOpen(true);
                setPasswordCheckStatus('idle');
                setNewUserData({ nombre: '', password: '' });
                if (debounceTimer) {
                  clearTimeout(debounceTimer);
                  setDebounceTimer(null);
                }
              }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>
            
            {clientUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Nombre</th>
                      <th className="text-left py-2 px-3">Usuario</th>
                      <th className="text-left py-2 px-3">Estado</th>
                      <th className="text-left py-2 px-3">Creado</th>
                      <th className="text-left py-2 px-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientUsers.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="py-2 px-3">{user.nombre}</td>
                        <td className="py-2 px-3">{user.username}</td>
                        <td className="py-2 px-3">
                          <Badge variant={user.activo ? "default" : "destructive"}>
                            {user.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user.id, user.nombre)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay usuarios creados para este cliente
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setUsersDialogOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para crear nuevo usuario */}
      <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crea un nuevo usuario para el cliente {selectedClienteForUsers?.nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="newUserNombre">Nombre</Label>
              <Input
                id="newUserNombre"
                value={newUserData.nombre}
                onChange={(e) => setNewUserData({...newUserData, nombre: e.target.value})}
                placeholder="Ej: Juan Pérez"
              />
              <p className="text-xs text-gray-500 mt-1">
                El nombre de usuario se generará automáticamente
              </p>
            </div>
            <div>
              <Label htmlFor="newUserPassword">Contraseña</Label>
              <Input
                id="newUserPassword"
                type="password"
                value={newUserData.password}
                onChange={(e) => {
                  const newPassword = e.target.value;
                  setNewUserData({...newUserData, password: newPassword});
                  
                  // Limpiar timeout anterior
                  if (debounceTimer) {
                    clearTimeout(debounceTimer);
                  }
                  
                  // Nuevo timeout para verificar contraseña
                  const timer = setTimeout(() => {
                    checkPasswordAvailability(newPassword);
                  }, 500);
                  
                  setDebounceTimer(timer);
                }}
                placeholder="Mínimo 6 caracteres"
                className={
                  passwordCheckStatus === 'taken' ? 'border-red-500' :
                  passwordCheckStatus === 'available' ? 'border-green-500' : ''
                }
              />
              {passwordCheckStatus === 'checking' && (
                <p className="text-xs text-blue-600 mt-1">
                  🔍 Verificando disponibilidad...
                </p>
              )}
              {passwordCheckStatus === 'taken' && (
                <p className="text-xs text-red-600 mt-1">
                  ❌ Esta contraseña ya está en uso. Elige otra diferente.
                </p>
              )}
              {passwordCheckStatus === 'available' && (
                <p className="text-xs text-green-600 mt-1">
                  ✅ Contraseña disponible
                </p>
              )}
              {passwordCheckStatus === 'idle' && newUserData.password.length > 0 && newUserData.password.length < 6 && (
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres requeridos
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setNewUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateUser}
              disabled={
                !newUserData.nombre || 
                !newUserData.password || 
                newUserData.password.length < 6 ||
                passwordCheckStatus === 'taken' ||
                passwordCheckStatus === 'checking'
              }
            >
              Crear Usuario
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
