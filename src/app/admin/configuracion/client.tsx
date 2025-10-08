'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from '@/components/admin-layout';

export function ConfiguracionPageClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    clickupApiKey: '',
    clickupWorkspaceId: '',
    estadosPorDefecto: {
      pendienteRevision: 'Pendiente de Revisión',
      aprobado: 'Aprobado',
      rechazado: 'Rechazado'
    },
    // Configuración SMTP
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPass: '',
    smtpFromName: 'GuindaVerify',
    smtpFromEmail: '',
    smtpEnabled: false
  });

  const [status, setStatus] = useState({
    supabase: false,
    clickup: false,
    email: false
  });

  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    loadConfig();
    checkStatus();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/configuracion');
      if (response.ok) {
        const data = await response.json();
        const loadedConfig = data.config || {};
        
        // Asegurar que todos los campos tengan valores definidos
        setConfig({
          clickupApiKey: loadedConfig.clickupApiKey || '',
          clickupWorkspaceId: loadedConfig.clickupWorkspaceId || '',
          estadosPorDefecto: loadedConfig.estadosPorDefecto || {
            pendienteRevision: 'Pendiente de Revisión',
            aprobado: 'Aprobado',
            rechazado: 'Rechazado'
          },
          // Configuración SMTP con valores por defecto
          smtpHost: loadedConfig.smtpHost || '',
          smtpPort: loadedConfig.smtpPort || 587,
          smtpSecure: loadedConfig.smtpSecure || false,
          smtpUser: loadedConfig.smtpUser || '',
          smtpPass: loadedConfig.smtpPass || '',
          smtpFromName: loadedConfig.smtpFromName || 'GuindaVerify',
          smtpFromEmail: loadedConfig.smtpFromEmail || '',
          smtpEnabled: loadedConfig.smtpEnabled || false
        });
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      // Verificar Supabase
      const supabaseResponse = await fetch('/api/admin/status/supabase');
      const supabaseStatus = supabaseResponse.ok;

      // Verificar ClickUp
      const clickupResponse = await fetch('/api/admin/status/clickup');
      const clickupStatus = clickupResponse.ok;

      setStatus({
        supabase: supabaseStatus,
        clickup: clickupStatus,
        email: false
      });
    } catch (error) {
      console.error('Error verificando estado:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/configuracion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Configuración guardada exitosamente');
        await checkStatus(); // Re-verificar estado después de guardar
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar configuración');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (type: 'supabase' | 'clickup') => {
    try {
      const response = await fetch(`/api/admin/status/${type}`);
      const data = await response.json();
      
      if (response.ok && data.status === 'connected') {
        toast.success(`${type === 'supabase' ? 'Supabase' : 'ClickUp'} conectado correctamente`);
      } else if (data.status === 'partial') {
        toast.warning(data.message, {
          description: data.details
        });
      } else {
        toast.error(data.error || `Error de conexión con ${type === 'supabase' ? 'Supabase' : 'ClickUp'}`, {
          description: data.details
        });
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Por favor ingresa un email para la prueba');
      return;
    }

    setTestingEmail(true);
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Email de prueba enviado exitosamente', {
          description: `Revisa la bandeja de entrada de ${testEmail}`
        });
        setStatus(prev => ({ ...prev, email: true }));
      } else {
        toast.error(data.error || 'Error enviando email de prueba');
        setStatus(prev => ({ ...prev, email: false }));
      }
    } catch (error) {
      toast.error('Error de conexión');
      setStatus(prev => ({ ...prev, email: false }));
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Estado de Supabase</CardTitle>
                <Badge variant={status.supabase ? "default" : "destructive"}>
                  {status.supabase ? "Conectado" : "Desconectado"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {status.supabase ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm text-gray-600">
                  {status.supabase 
                    ? "Base de datos conectada correctamente"
                    : "Error de conexión con la base de datos"
                  }
                </span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-3"
                onClick={() => handleTestConnection('supabase')}
              >
                Probar Conexión
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Estado de ClickUp</CardTitle>
                <Badge variant={status.clickup ? "default" : "destructive"}>
                  {status.clickup ? "Conectado" : "Desconectado"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {status.clickup ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm text-gray-600">
                  {status.clickup 
                    ? "API de ClickUp conectada correctamente"
                    : "Error de conexión con ClickUp"
                  }
                </span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-3"
                onClick={() => handleTestConnection('clickup')}
              >
                Probar Conexión
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Estado de Email</CardTitle>
                <Badge variant={config.smtpEnabled && status.email ? "default" : "secondary"}>
                  {config.smtpEnabled ? (status.email ? "Configurado" : "Sin probar") : "Deshabilitado"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {config.smtpEnabled ? (
                  status.email ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-sm text-gray-600">
                  {config.smtpEnabled 
                    ? (status.email ? "SMTP configurado y funcionando" : "SMTP configurado, sin probar")
                    : "Notificaciones por email deshabilitadas"
                  }
                </span>
              </div>
              {config.smtpEnabled && (
                <div className="mt-3 space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="email@ejemplo.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && testEmail && !testingEmail) {
                          handleTestEmail();
                        }
                      }}
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleTestEmail}
                      disabled={testingEmail || !testEmail}
                    >
                      {testingEmail ? (
                        <>
                          <div className="loading-spinner w-3 h-3 mr-1"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="w-3 h-3 mr-1" />
                          Probar
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Envía un email de prueba para verificar la configuración SMTP
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de ClickUp</CardTitle>
            <CardDescription>
              Configura las credenciales de ClickUp para la integración
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="clickupApiKey">API Key de ClickUp *</Label>
                <Input
                  id="clickupApiKey"
                  type="password"
                  value={config.clickupApiKey}
                  onChange={(e) => setConfig({...config, clickupApiKey: e.target.value})}
                  placeholder="pk_1234567890_ABCDEFGHIJKLMNOP"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Encuentra tu API Key en ClickUp → Settings → Apps → API Token
                </p>
              </div>

              <div>
                <Label htmlFor="clickupWorkspaceId">Workspace ID de ClickUp *</Label>
                <Input
                  id="clickupWorkspaceId"
                  value={config.clickupWorkspaceId}
                  onChange={(e) => setConfig({...config, clickupWorkspaceId: e.target.value})}
                  placeholder="123456789"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  El ID del workspace donde están las listas de tus clientes
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Estados por Defecto</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="pendienteRevision">Estado Pendiente de Revisión</Label>
                    <Input
                      id="pendienteRevision"
                      value={config.estadosPorDefecto.pendienteRevision}
                      onChange={(e) => setConfig({
                        ...config, 
                        estadosPorDefecto: {
                          ...config.estadosPorDefecto,
                          pendienteRevision: e.target.value
                        }
                      })}
                      placeholder="Pendiente de Revisión"
                    />
                  </div>
                  <div>
                    <Label htmlFor="aprobado">Estado Aprobado</Label>
                    <Input
                      id="aprobado"
                      value={config.estadosPorDefecto.aprobado}
                      onChange={(e) => setConfig({
                        ...config, 
                        estadosPorDefecto: {
                          ...config.estadosPorDefecto,
                          aprobado: e.target.value
                        }
                      })}
                      placeholder="Aprobado"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rechazado">Estado Rechazado</Label>
                    <Input
                      id="rechazado"
                      value={config.estadosPorDefecto.rechazado}
                      onChange={(e) => setConfig({
                        ...config, 
                        estadosPorDefecto: {
                          ...config.estadosPorDefecto,
                          rechazado: e.target.value
                        }
                      })}
                      placeholder="Rechazado"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Estos estados se usarán como valores por defecto al crear nuevos clientes
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Configuración
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* SMTP Configuration Form */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Configuración de Email (SMTP)</span>
            </CardTitle>
            <CardDescription>
              Configura el servidor SMTP para enviar notificaciones por email a los clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Habilitar/Deshabilitar SMTP */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="smtpEnabled" className="text-base font-medium">
                    Habilitar notificaciones por email
                  </Label>
                  <p className="text-sm text-gray-500">
                    Activa el envío automático de notificaciones por email
                  </p>
                </div>
                <Switch
                  id="smtpEnabled"
                  checked={config.smtpEnabled}
                  onCheckedChange={(checked) => setConfig({...config, smtpEnabled: checked})}
                />
              </div>

              {config.smtpEnabled && (
                <div className="space-y-6 border-t pt-6">
                  {/* Configuración del servidor */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost">Servidor SMTP *</Label>
                      <Input
                        id="smtpHost"
                        value={config.smtpHost}
                        onChange={(e) => setConfig({...config, smtpHost: e.target.value})}
                        placeholder="smtp.gmail.com"
                        required={config.smtpEnabled}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ej: smtp.gmail.com, smtp.outlook.com, mail.tudominio.com
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="smtpPort">Puerto SMTP *</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={config.smtpPort.toString()}
                        onChange={(e) => setConfig({...config, smtpPort: parseInt(e.target.value) || 587})}
                        placeholder="587"
                        required={config.smtpEnabled}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        587 (TLS) o 465 (SSL)
                      </p>
                    </div>
                  </div>

                  {/* Seguridad */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="smtpSecure" className="text-sm font-medium">
                        Usar SSL (puerto 465)
                      </Label>
                      <p className="text-xs text-gray-500">
                        Desactivar para TLS (puerto 587)
                      </p>
                    </div>
                    <Switch
                      id="smtpSecure"
                      checked={config.smtpSecure}
                      onCheckedChange={(checked) => {
                        setConfig({
                          ...config, 
                          smtpSecure: checked,
                          smtpPort: checked ? 465 : 587
                        });
                      }}
                    />
                  </div>

                  {/* Credenciales */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpUser">Usuario SMTP *</Label>
                      <Input
                        id="smtpUser"
                        type="email"
                        value={config.smtpUser}
                        onChange={(e) => setConfig({...config, smtpUser: e.target.value})}
                        placeholder="tu-email@gmail.com"
                        required={config.smtpEnabled}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Tu email completo
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="smtpPass">Contraseña SMTP *</Label>
                      <Input
                        id="smtpPass"
                        type="password"
                        value={config.smtpPass}
                        onChange={(e) => setConfig({...config, smtpPass: e.target.value})}
                        placeholder="••••••••••••••••"
                        required={config.smtpEnabled}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Para Gmail: usa una contraseña de aplicación
                      </p>
                    </div>
                  </div>

                  {/* Información del remitente */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpFromName">Nombre del remitente</Label>
                      <Input
                        id="smtpFromName"
                        value={config.smtpFromName}
                        onChange={(e) => setConfig({...config, smtpFromName: e.target.value})}
                        placeholder="GuindaVerify"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Nombre que aparecerá en los emails
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="smtpFromEmail">Email del remitente</Label>
                      <Input
                        id="smtpFromEmail"
                        type="email"
                        value={config.smtpFromEmail}
                        onChange={(e) => setConfig({...config, smtpFromEmail: e.target.value})}
                        placeholder="notificaciones@tudominio.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Si está vacío, usa el usuario SMTP
                      </p>
                    </div>
                  </div>
                </div>
              )}


              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Configuración
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instrucciones de Configuración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">1. Configurar ClickUp</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Ve a ClickUp → Settings → Apps → API Token</li>
                  <li>Crea un nuevo token con permisos de lectura y escritura</li>
                  <li>Copia el token y pégalo en el campo "API Key"</li>
                  <li>Anota el Workspace ID de tu workspace principal</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">2. Configurar Estados</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Los estados deben coincidir exactamente con los nombres en ClickUp</li>
                  <li>Puedes personalizar los estados por defecto arriba</li>
                  <li>Cada cliente puede tener sus propios estados específicos</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">3. Configurar Email (Opcional)</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Habilita las notificaciones por email en la sección SMTP</li>
                  <li>Para Gmail: usa una contraseña de aplicación (no tu contraseña normal)</li>
                  <li>Para otros proveedores: usa las credenciales SMTP correspondientes</li>
                  <li>Prueba la configuración enviando un email de prueba</li>
                </ul>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">📧 Configuraciones SMTP Comunes:</h5>
                  <div className="grid md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-blue-700">Gmail:</strong><br/>
                      Host: smtp.gmail.com<br/>
                      Puerto: 587 (TLS)<br/>
                      Requiere: Contraseña de aplicación
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-purple-700">Outlook:</strong><br/>
                      Host: smtp.live.com<br/>
                      Puerto: 587 (TLS)<br/>
                      Usuario: tu-email@outlook.com
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-green-700">Servidor Propio:</strong><br/>
                      Host: mail.tudominio.com<br/>
                      Puerto: 587 o 465<br/>
                      Credenciales de hosting
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-orange-700">Yahoo:</strong><br/>
                      Host: smtp.mail.yahoo.com<br/>
                      Puerto: 587 (TLS)<br/>
                      Requiere: Contraseña de aplicación
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">4. Crear Clientes</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Una vez configurado, ve al Panel de Administración</li>
                  <li>Crea clientes asociándolos a listas específicas de ClickUp</li>
                  <li>Cada cliente tendrá su propio portal de revisión</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
