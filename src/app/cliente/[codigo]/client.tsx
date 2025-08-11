'use client';

import { useEffect, useState, useCallback } from 'react';
import { TareaPublicacion } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle, MessageCircle, User, RefreshCw, ExternalLink, FileText, Camera, Clock, Hash, Filter, X, LogOut, MessageSquare } from 'lucide-react';
import { ComentariosModal } from '@/components/comentarios-modal';

interface ClienteData {
  id: string;
  nombre: string;
  codigo: string;
}

interface PublicacionesResponse {
  cliente: ClienteData;
  publicacionesPorRevisar: TareaPublicacion[];
  publicacionesPendientesCambios: TareaPublicacion[];
  publicacionesAprobadas: TareaPublicacion[];
  total: {
    porRevisar: number;
    pendientesCambios: number;
    aprobadas: number;
    total: number;
  };
}

interface Filtros {
  tipoPublicacion: string;
  plataforma: string;
  fechaDesde: string;
  fechaHasta: string;
  busqueda: string;
}

interface ClientePortalClientProps {
  codigo: string;
}

export function ClientePortalClient({ codigo }: ClientePortalClientProps) {
  const [data, setData] = useState<PublicacionesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comentario, setComentario] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    tipoPublicacion: '',
    plataforma: '',
    fechaDesde: '',
    fechaHasta: '',
    busqueda: ''
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [comentariosModal, setComentariosModal] = useState<{
    isOpen: boolean;
    tareaId: string;
    tareaNombre: string;
  }>({
    isOpen: false,
    tareaId: '',
    tareaNombre: '',
  });

  const fetchPublicaciones = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await fetch(`/api/cliente/${codigo}/publicaciones`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error cargando publicaciones');
      }

      const data = await response.json();
      console.log('📊 Datos recibidos de la API:', data);
      setData(data);
      
      if (isRefresh) {
        toast.success('Publicaciones actualizadas');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      if (isRefresh) {
        toast.error(`Error al actualizar: ${errorMessage}`);
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [codigo]); // Dependencias del useCallback

  useEffect(() => {
    if (codigo) {
      fetchPublicaciones();
    }
  }, [codigo, fetchPublicaciones]);

  const handleLogout = async () => {
    try {
      await fetch('/api/cliente/auth/logout', { method: 'POST' });
      window.location.href = `/cliente/${codigo}/login`;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleAccion = async (tareaId: string, accion: 'aprobar' | 'hay_cambios') => {
    try {
      setActionLoading(tareaId);

      const body: { tareaId: string; accion: string; comentario?: string } = { tareaId, accion };
      if (accion === 'hay_cambios') {
        if (!comentario.trim()) {
          toast.error('Por favor ingresa un comentario explicando los cambios necesarios');
          return;
        }
        body.comentario = comentario;
      }

      const response = await fetch(`/api/cliente/${codigo}/acciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error procesando acción');
      }

      const result = await response.json();
      toast.success(result.mensaje);

      // Recargar publicaciones
      await fetchPublicaciones(true);

      // Limpiar estado
      setComentario('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setActionLoading(null);
    }
  };

  const getEstadoColor = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('pendiente')) return 'bg-yellow-100 text-yellow-800';
    if (estadoLower.includes('aprobado')) return 'bg-green-100 text-green-800';
    if (estadoLower.includes('rechazado')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleRefresh = async () => {
    await fetchPublicaciones(true);
  };

  const handleRefreshClick = () => {
    handleRefresh();
  };

  const getTipoPublicacionIcon = (tipo?: string) => {
    if (!tipo) return '📱';
    const tipoLower = tipo.toLowerCase();
    
    if (tipoLower.includes('reel')) return '🎬';
    if (tipoLower.includes('storie') || tipoLower.includes('historia')) return '📸';
    if (tipoLower.includes('post') || tipoLower.includes('carrusel')) return '🖼️';
    if (tipoLower.includes('video')) return '🎥';
    if (tipoLower.includes('imagen') || tipoLower.includes('foto')) return '🖼️';
    
    return '📱';
  };

  const getPlataformaIcon = (plataforma?: string) => {
    if (!plataforma) return '🌐';
    const plataformaLower = plataforma.toLowerCase();
    
    if (plataformaLower.includes('instagram') || plataformaLower.includes('insta')) return '📸';
    if (plataformaLower.includes('tiktok')) return '🎵';
    if (plataformaLower.includes('linkedin')) return '💼';
    if (plataformaLower.includes('facebook') || plataformaLower.includes('fb')) return '📘';
    if (plataformaLower.includes('twitter') || plataformaLower.includes('x.com')) return '🐦';
    if (plataformaLower.includes('youtube')) return '📺';
    
    return '🌐';
  };

  const getTipoPublicacionColor = (tipo?: string) => {
    if (!tipo) return 'bg-gray-100 text-gray-800 border-gray-200';
    const tipoLower = tipo.toLowerCase();
    
    if (tipoLower.includes('reel')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (tipoLower.includes('storie') || tipoLower.includes('historia')) return 'bg-pink-100 text-pink-800 border-pink-200';
    if (tipoLower.includes('post') || tipoLower.includes('carrusel')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (tipoLower.includes('video')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPlataformaColor = (plataforma?: string) => {
    if (!plataforma) return 'bg-gray-500 text-white';
    const plataformaLower = plataforma.toLowerCase();
    
    if (plataformaLower.includes('instagram') || plataformaLower.includes('insta')) return 'bg-gradient-to-r from-purple-400 to-pink-400 text-white';
    if (plataformaLower.includes('tiktok')) return 'bg-black text-white';
    if (plataformaLower.includes('linkedin')) return 'bg-blue-600 text-white';
    if (plataformaLower.includes('facebook') || plataformaLower.includes('fb')) return 'bg-blue-500 text-white';
    if (plataformaLower.includes('twitter') || plataformaLower.includes('x.com')) return 'bg-gray-900 text-white';
    if (plataformaLower.includes('youtube')) return 'bg-red-600 text-white';
    
    return 'bg-gray-500 text-white';
  };

  // Nueva función para obtener iconos de múltiples plataformas
  const getPlataformasIcons = (plataformas?: string[]) => {
    if (!plataformas || plataformas.length === 0) return ['🌐'];
    return plataformas.map(plataforma => getPlataformaIcon(plataforma));
  };

  // Función para aplicar filtros a las publicaciones
  const aplicarFiltros = (publicaciones: TareaPublicacion[]): TareaPublicacion[] => {
    if (!publicaciones) return [];

    return publicaciones.filter(pub => {
      // Filtro por tipo de publicación
      if (filtros.tipoPublicacion && pub.tipoPublicacion) {
        if (!pub.tipoPublicacion.toLowerCase().includes(filtros.tipoPublicacion.toLowerCase())) {
          return false;
        }
      }

      // Filtro por plataforma
      if (filtros.plataforma && pub.plataformaPublicacion) {
        const tieneEsaPlataforma = pub.plataformaPublicacion.some(plat => 
          plat.toLowerCase().includes(filtros.plataforma.toLowerCase())
        );
        if (!tieneEsaPlataforma) {
          return false;
        }
      }

      // Filtro por búsqueda de texto
      if (filtros.busqueda) {
        const textoCompleto = [
          pub.nombre,
          pub.descripcion,
          pub.textoPublicacion,
          pub.comentarios
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!textoCompleto.includes(filtros.busqueda.toLowerCase())) {
          return false;
        }
      }

      // Filtro por fecha
      if (filtros.fechaDesde && pub.fechaProgramada) {
        try {
          const fechaPublicacion = new Date(pub.fechaProgramada);
          const fechaFiltroDesde = new Date(filtros.fechaDesde);
          if (fechaPublicacion < fechaFiltroDesde) {
            return false;
          }
        } catch {
          // Si hay error parseando la fecha, ignorar este filtro
        }
      }

      if (filtros.fechaHasta && pub.fechaProgramada) {
        try {
          const fechaPublicacion = new Date(pub.fechaProgramada);
          const fechaFiltroHasta = new Date(filtros.fechaHasta);
          fechaFiltroHasta.setHours(23, 59, 59, 999); // Incluir todo el día
          if (fechaPublicacion > fechaFiltroHasta) {
            return false;
          }
        } catch {
          // Si hay error parseando la fecha, ignorar este filtro
        }
      }

      return true;
    });
  };

  // Función para obtener tipos de publicación únicos
  const getTiposPublicacion = (): string[] => {
    if (!data) return [];
    const todasPublicaciones = [
      ...(data.publicacionesPorRevisar || []),
      ...(data.publicacionesPendientesCambios || []),
      ...(data.publicacionesAprobadas || [])
    ];
    const tipos = todasPublicaciones
      .map(pub => pub.tipoPublicacion)
      .filter(Boolean)
      .filter((tipo, index, arr) => arr.indexOf(tipo) === index);
    return tipos as string[];
  };

  // Función para obtener plataformas únicas
  const getPlataformas = (): string[] => {
    if (!data) return [];
    const todasPublicaciones = [
      ...(data.publicacionesPorRevisar || []),
      ...(data.publicacionesPendientesCambios || []),
      ...(data.publicacionesAprobadas || [])
    ];
    const plataformas = todasPublicaciones
      .flatMap(pub => pub.plataformaPublicacion || [])
      .filter((plat, index, arr) => arr.indexOf(plat) === index);
    return plataformas;
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      tipoPublicacion: '',
      plataforma: '',
      fechaDesde: '',
      fechaHasta: '',
      busqueda: ''
    });
  };

  const abrirComentarios = (publicacion: TareaPublicacion) => {
    setComentariosModal({
      isOpen: true,
      tareaId: publicacion.id,
      tareaNombre: publicacion.nombre,
    });
  };

  const cerrarComentarios = () => {
    setComentariosModal({
      isOpen: false,
      tareaId: '',
      tareaNombre: '',
    });
  };

  // Verificar si hay filtros activos
  const hayFiltrosActivos = () => {
    return filtros.tipoPublicacion || filtros.plataforma || filtros.fechaDesde || filtros.fechaHasta || filtros.busqueda;
  };

  // Función para renderizar cada card de publicación
  function renderPublicacionCard(publicacion: TareaPublicacion, canEdit: boolean) {
    return (
      <>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-center space-y-1">
                <span className="text-2xl">
                  {getTipoPublicacionIcon(publicacion.tipoPublicacion)}
                </span>
                <div className="flex space-x-1">
                  {getPlataformasIcons(publicacion.plataformaPublicacion).map((icon, index) => (
                    <span key={index} className="text-lg">
                      {icon}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-2 text-gray-900">
                  {publicacion.nombre}
                </CardTitle>
                <CardDescription className="text-sm flex items-center mt-1">
                  <User className="w-3 h-3 mr-1" />
                  {publicacion.creador.nombre}
                </CardDescription>
              </div>
            </div>
            <Badge className={`${getEstadoColor(publicacion.estado)} font-medium`}>
              {publicacion.estado}
            </Badge>
          </div>

          {/* Tipo y Plataformas */}
          <div className="flex flex-wrap gap-2 mb-3">
            {publicacion.tipoPublicacion && (
              <Badge className={`${getTipoPublicacionColor(publicacion.tipoPublicacion)} text-xs font-medium border`}>
                {publicacion.tipoPublicacion}
              </Badge>
            )}
            {publicacion.plataformaPublicacion && publicacion.plataformaPublicacion.length > 0 && 
              publicacion.plataformaPublicacion.map((plataforma, index) => (
                <Badge key={index} className={`${getPlataformaColor(plataforma)} text-xs font-medium`}>
                  {getPlataformaIcon(plataforma)} {plataforma}
                </Badge>
              ))
            }
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Imagen preview */}
          {publicacion.imagenPreview && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={publicacion.imagenPreview}
                alt="Preview"
                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Texto de la publicación */}
          {publicacion.textoPublicacion && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-start space-x-2">
                <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 line-clamp-3">
                  {publicacion.textoPublicacion}
                </p>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="space-y-2 mb-4">
            {/* Fecha programada */}
            {publicacion.fechaProgramada && (
              <div className="flex items-center text-sm text-gray-600 bg-amber-50 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4 mr-2 text-amber-600" />
                <span className="font-medium">Fecha programada:</span>
                <span className="ml-2">
                  {(() => {
                    try {
                      const fecha = new Date(publicacion.fechaProgramada);
                      if (isNaN(fecha.getTime())) {
                        return 'Fecha no válida';
                      }
                      return fecha.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      });
                    } catch (error) {
                      console.warn('Error formateando fecha:', publicacion.fechaProgramada, error);
                      return 'Fecha no válida';
                    }
                  })()}
                </span>
              </div>
            )}

            {/* Enlace a Drive */}
            {publicacion.enlaceDrive && (
              <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg">
                <div className="flex items-center text-sm text-gray-700">
                  <Camera className="w-4 h-4 mr-2 text-green-600" />
                  <span className="font-medium">Archivos multimedia</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-700 border-green-300 hover:bg-green-100 h-8"
                  onClick={() => window.open(publicacion.enlaceDrive, '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Ver Drive
                </Button>
              </div>
            )}

            {/* Comentarios internos */}
            {publicacion.comentarios && (
              <div className="bg-blue-50 px-3 py-2 rounded-lg border-l-4 border-blue-400">
                <div className="flex items-start space-x-2">
                  <MessageCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-blue-900">Comentarios:</span>
                    <p className="text-sm text-blue-800 mt-1 line-clamp-2">
                      {publicacion.comentarios}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Etiquetas */}
          {publicacion.etiquetas.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {publicacion.etiquetas.map((etiqueta, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-white border-gray-300">
                  <Hash className="w-3 h-3 mr-1" />
                  {etiqueta.nombre}
                </Badge>
              ))}
            </div>
          )}

          {/* Botón de comentarios - siempre visible */}
          <div className="pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full mb-3 border-blue-300 text-blue-700 hover:bg-blue-50 shadow-sm"
              onClick={() => abrirComentarios(publicacion)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Ver comentarios
            </Button>

            {/* Acciones - solo para publicaciones que se pueden editar */}
            {canEdit && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 shadow-sm"
                  onClick={() => handleAccion(publicacion.id, 'aprobar')}
                  disabled={actionLoading === publicacion.id}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Aprobar
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 shadow-sm"
                      onClick={() => {}}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Hay cambios
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <MessageCircle className="w-5 h-5 text-orange-600" />
                        <span>Solicitar cambios</span>
                      </DialogTitle>
                      <DialogDescription>
                        Explica qué cambios necesita &quot;{publicacion.nombre}&quot;
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="Describe los cambios que necesita esta publicación..."
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <DialogFooter>
                      <Button
                        onClick={() => handleAccion(publicacion.id, 'hay_cambios')}
                        disabled={actionLoading === publicacion.id || !comentario.trim()}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Solicitar cambios
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Indicador de solo lectura para estados finales */}
          {!canEdit && (
            <div className="pt-4 border-t border-gray-100">
              <div className="text-center text-sm text-gray-500 italic">
                {publicacion.estado === 'Aprobado' || (data && data.publicacionesAprobadas && data.publicacionesAprobadas.some(p => p.id === publicacion.id))
                  ? '✅ Publicación aprobada' 
                  : '🔄 Esperando cambios del equipo'}
              </div>
            </div>
          )}
        </CardContent>
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando publicaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefreshClick} variant="outline">
            Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Portal de Revisión
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenido, {data.cliente.nombre}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
                {hayFiltrosActivos() && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                    !
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshClick}
                disabled={refreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {refreshing ? 'Actualizando...' : 'Actualizar'}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
              <div className="flex space-x-2">
                <Badge variant="secondary" className="text-sm">
                  {data.total?.porRevisar || 0} por revisar
                </Badge>
                <Badge variant="outline" className="text-sm border-orange-300 text-orange-700">
                  {data.total?.pendientesCambios || 0} pendientes
                </Badge>
                <Badge variant="outline" className="text-sm border-green-300 text-green-700">
                  {data.total?.aprobadas || 0} aprobadas
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Filtros */}
      {mostrarFiltros && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Búsqueda */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <Input
                  placeholder="Buscar en publicaciones..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                  className="w-full"
                />
              </div>

              {/* Tipo de publicación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <Select
                  value={filtros.tipoPublicacion || "todos"}
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, tipoPublicacion: value === "todos" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los tipos</SelectItem>
                    {getTiposPublicacion().map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {getTipoPublicacionIcon(tipo)} {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Plataforma */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plataforma
                </label>
                <Select
                  value={filtros.plataforma || "todas"}
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, plataforma: value === "todas" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las plataformas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las plataformas</SelectItem>
                    {getPlataformas().map((plataforma) => (
                      <SelectItem key={plataforma} value={plataforma}>
                        {getPlataformaIcon(plataforma)} {plataforma}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha Desde */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desde
                </label>
                <Input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
                  className="w-full"
                />
              </div>

              {/* Fecha Hasta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasta
                </label>
                <Input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                {hayFiltrosActivos() && (
                  <>
                    Filtros activos: {[
                      filtros.tipoPublicacion && `Tipo: ${filtros.tipoPublicacion}`,
                      filtros.plataforma && `Plataforma: ${filtros.plataforma}`,
                      filtros.busqueda && `Búsqueda: "${filtros.busqueda}"`,
                      filtros.fechaDesde && `Desde: ${filtros.fechaDesde}`,
                      filtros.fechaHasta && `Hasta: ${filtros.fechaHasta}`
                    ].filter(Boolean).join(', ')}
                  </>
                )}
              </div>
              {hayFiltrosActivos() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={limpiarFiltros}
                  className="flex items-center space-x-1"
                >
                  <X className="h-3 w-3" />
                  <span>Limpiar filtros</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(data.total?.total || 0) === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              No hay publicaciones
            </h2>
            <p className="text-gray-600">
              No se encontraron publicaciones en este momento.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Sección: Por revisar */}
            {(() => {
              const publicacionesFiltradas = aplicarFiltros(data.publicacionesPorRevisar || []);
              return publicacionesFiltradas.length > 0 && (
                <section>
                  <div className="flex items-center mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Por revisar ({publicacionesFiltradas.length})
                      </h2>
                      {hayFiltrosActivos() && (
                        <Badge variant="outline" className="text-xs">
                          de {data.total?.porRevisar || 0} total
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {publicacionesFiltradas.map((publicacion) => (
                      <Card key={publicacion.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                        {renderPublicacionCard(publicacion, true)}
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Sección: Pendientes de cambios */}
            {(() => {
              const publicacionesFiltradas = aplicarFiltros(data.publicacionesPendientesCambios || []);
              return publicacionesFiltradas.length > 0 && (
                <section>
                  <div className="flex items-center mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Pendientes de cambios ({publicacionesFiltradas.length})
                      </h2>
                      {hayFiltrosActivos() && (
                        <Badge variant="outline" className="text-xs">
                          de {data.total?.pendientesCambios || 0} total
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {publicacionesFiltradas.map((publicacion) => (
                      <Card key={publicacion.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden border-l-4 border-l-orange-400">
                        {renderPublicacionCard(publicacion, false)}
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Sección: Aprobadas */}
            {(() => {
              const publicacionesFiltradas = aplicarFiltros(data.publicacionesAprobadas || []);
              return publicacionesFiltradas.length > 0 && (
                <section>
                  <div className="flex items-center mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Aprobadas ({publicacionesFiltradas.length})
                      </h2>
                      {hayFiltrosActivos() && (
                        <Badge variant="outline" className="text-xs">
                          de {data.total?.aprobadas || 0} total
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {publicacionesFiltradas.map((publicacion) => (
                      <Card key={publicacion.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden border-l-4 border-l-green-400">
                        {renderPublicacionCard(publicacion, false)}
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Mensaje si no hay resultados con filtros */}
            {(() => {
              const publicacionesPorRevisarFiltradas = aplicarFiltros(data.publicacionesPorRevisar || []);
              const publicacionesPendientesFiltradas = aplicarFiltros(data.publicacionesPendientesCambios || []);
              const publicacionesAprobadasFiltradas = aplicarFiltros(data.publicacionesAprobadas || []);
              
              const hayResultados = publicacionesPorRevisarFiltradas.length > 0 || 
                                   publicacionesPendientesFiltradas.length > 0 || 
                                   publicacionesAprobadasFiltradas.length > 0;
              
              const hayPublicacionesTotales = (data.total?.total || 0) > 0;
              
              if (!hayResultados && hayPublicacionesTotales && hayFiltrosActivos()) {
                return (
                  <div className="text-center py-12">
                    <div className="text-gray-500 text-6xl mb-4">🔍</div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                      Sin resultados
                    </h2>
                    <p className="text-gray-600 mb-4">
                      No se encontraron publicaciones que coincidan con los filtros aplicados.
                    </p>
                    <Button variant="outline" onClick={limpiarFiltros}>
                      Limpiar filtros
                    </Button>
                  </div>
                );
              }
              
              if (!hayResultados && hayPublicacionesTotales && !hayFiltrosActivos()) {
                return (
                  <div className="text-center py-12">
                    <div className="text-gray-500 text-6xl mb-4">🔍</div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                      Sin coincidencias
                    </h2>
                    <p className="text-gray-600">
                      Hay publicaciones, pero ninguna coincide con los estados configurados.
                    </p>
                  </div>
                );
              }
              
              return null;
            })()}
          </div>
        )}
      </div>

      {/* Modal de comentarios */}
      <ComentariosModal
        isOpen={comentariosModal.isOpen}
        onClose={cerrarComentarios}
        tareaId={comentariosModal.tareaId}
        tareaNombre={comentariosModal.tareaNombre}
        clienteCodigo={codigo}
      />
    </div>
  );
}