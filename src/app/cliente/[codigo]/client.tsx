'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { TareaPublicacion } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle, MessageCircle, User, RefreshCw, ExternalLink, FileText, Camera, Clock, Hash, Filter, X, LogOut, MessageSquare, Calendar, List, ChevronLeft, ChevronRight, Columns, Maximize2 } from 'lucide-react';
import { ComentariosModal } from '@/components/comentarios-modal';
import { PublicacionDetailModal } from '@/components/publicacion-detail-modal';

interface ClienteData {
  id: string;
  nombre: string;
  codigo: string;
  logoUrl?: string;
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
  mes: string; // Nuevo filtro para mes
}

type VistaActiva = 'lista' | 'calendario' | 'kanban';

interface ClientePortalClientProps {
  codigo: string;
}

export function ClientePortalClient({ codigo }: ClientePortalClientProps) {
  const [data, setData] = useState<PublicacionesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [comentario, setComentario] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    tipoPublicacion: '',
    plataforma: '',
    fechaDesde: '',
    fechaHasta: '',
    busqueda: '',
    mes: ''
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
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('kanban');
  const [fechaCalendario, setFechaCalendario] = useState(new Date());
  const [draggedPublication, setDraggedPublication] = useState<TareaPublicacion | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [selectedPublicacion, setSelectedPublicacion] = useState<TareaPublicacion | null>(null);

  const fetchPublicaciones = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Añadir parámetro forceRefresh cuando es un refresh manual
      const url = `/api/cliente/${codigo}/publicaciones${isRefresh ? '?forceRefresh=true' : ''}`;
      console.log(`🔄 Fetching publicaciones: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error cargando publicaciones');
      }

      const data = await response.json();
      console.log('📊 Datos recibidos de la API:', data);
      setData(data);
      
      if (isRefresh) {
        toast.success('✅ Datos actualizados desde ClickUp');
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
  }, [codigo]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      // Crear un endpoint simple para obtener el usuario actual
      const response = await fetch('/api/cliente/auth/me', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData.user);
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
      // Si no podemos obtener el usuario, no es crítico
    }
  }, []); // Dependencias del useCallback

  useEffect(() => {
    if (codigo) {
      fetchPublicaciones();
      fetchCurrentUser();
    }
  }, [codigo, fetchPublicaciones, fetchCurrentUser]);

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

  const handleRefreshSingleTask = async (tareaId: string) => {
    try {
      setActionLoading(tareaId);
      console.log(`🔄 Refrescando tarea específica: ${tareaId}`);

      const response = await fetch(`/api/cliente/${codigo}/refresh-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tareaId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error refrescando la tarea');
      }

      const result = await response.json();
      console.log('✅ Tarea refrescada:', result.publicacion);

      // Actualizar solo esta publicación específica en el estado
      if (data) {
        const updateSpecificPublication = (pub: TareaPublicacion) => {
          if (pub.id === tareaId) {
            return result.publicacion;
          }
          return pub;
        };

        setData(prev => prev ? {
          ...prev,
          publicacionesPorRevisar: prev.publicacionesPorRevisar?.map(updateSpecificPublication) || [],
          publicacionesPendientesCambios: prev.publicacionesPendientesCambios?.map(updateSpecificPublication) || [],
          publicacionesAprobadas: prev.publicacionesAprobadas?.map(updateSpecificPublication) || []
        } : null);
      }

      toast.success('📝 Datos actualizados desde ClickUp');
    } catch (error) {
      console.error('Error refrescando tarea:', error);
      toast.error(error instanceof Error ? error.message : 'Error refrescando la tarea');
    } finally {
      setActionLoading(null);
    }
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

      // Filtro por mes específico
      if (filtros.mes && pub.fechaProgramada) {
        try {
          const fechaPublicacion = new Date(pub.fechaProgramada);
          const year = fechaPublicacion.getFullYear();
          const month = fechaPublicacion.getMonth();
          const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
          
          if (monthKey !== filtros.mes) {
            return false;
          }
        } catch {
          // Si hay error parseando la fecha, ignorar este filtro
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

  // Función para obtener meses disponibles con publicaciones
  const getMesesDisponibles = (): Array<{value: string, label: string, count: number}> => {
    if (!data) return [];
    
    const todasPublicaciones = [
      ...(data.publicacionesPorRevisar || []),
      ...(data.publicacionesPendientesCambios || []),
      ...(data.publicacionesAprobadas || [])
    ];
    
    // Agrupar por mes
    const mesesMap = new Map<string, {label: string, count: number}>();
    
    todasPublicaciones.forEach(pub => {
      if (pub.fechaProgramada) {
        try {
          const fecha = new Date(pub.fechaProgramada);
          if (!isNaN(fecha.getTime())) {
            const year = fecha.getFullYear();
            const month = fecha.getMonth();
            const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
            
            const monthLabel = fecha.toLocaleDateString('es-ES', { 
              month: 'long', 
              year: 'numeric' 
            });
            
            if (mesesMap.has(monthKey)) {
              mesesMap.get(monthKey)!.count++;
            } else {
              mesesMap.set(monthKey, {
                label: monthLabel,
                count: 1
              });
            }
          }
        } catch (error) {
          console.warn('Error procesando fecha:', pub.fechaProgramada, error);
        }
      }
    });
    
    // Convertir a array y ordenar por fecha (más recientes primero)
    return Array.from(mesesMap.entries())
      .map(([value, data]) => ({
        value,
        label: `${data.label} (${data.count})`,
        count: data.count
      }))
      .sort((a, b) => b.value.localeCompare(a.value));
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      tipoPublicacion: '',
      plataforma: '',
      fechaDesde: '',
      fechaHasta: '',
      busqueda: '',
      mes: ''
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

  const [comentariosData, setComentariosData] = useState<{[key: string]: any[]}>({});
  const [loadingComentarios, setLoadingComentarios] = useState<{[key: string]: boolean}>({});
  const loadingRef = useRef<{[key: string]: boolean}>({});

  const fetchComentarios = useCallback(async (tareaId: string) => {
    // Si ya está cargando, no hacer nada
    if (loadingRef.current[tareaId]) {
      return [];
    }
    
    try {
      loadingRef.current[tareaId] = true;
      setLoadingComentarios(prev => ({ ...prev, [tareaId]: true }));
      
      const response = await fetch(`/api/cliente/${codigo}/comentarios/${tareaId}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener comentarios');
      }
      
      const data = await response.json();
      setComentariosData(prev => ({
        ...prev,
        [tareaId]: data.comentarios || []
      }));
      
      return data.comentarios || [];
    } catch (error) {
      console.error('Error obteniendo comentarios:', error);
      return [];
    } finally {
      loadingRef.current[tareaId] = false;
      setLoadingComentarios(prev => ({ ...prev, [tareaId]: false }));
    }
  }, [codigo]);

  const getComentarios = (tareaId: string) => {
    return comentariosData[tareaId] || [];
  };

  // Verificar si hay filtros activos
  const hayFiltrosActivos = () => {
    return filtros.tipoPublicacion || filtros.plataforma || filtros.fechaDesde || filtros.fechaHasta || filtros.busqueda || filtros.mes;
  };

  // Funciones para el calendario
  const obtenerTodasPublicaciones = (): TareaPublicacion[] => {
    if (!data) return [];
    const todasPublicaciones = [
      ...(data.publicacionesPorRevisar || []),
      ...(data.publicacionesPendientesCambios || []),
      ...(data.publicacionesAprobadas || [])
    ];
    // Aplicar filtros también en el calendario
    return aplicarFiltros(todasPublicaciones);
  };

  const obtenerPublicacionesPorFecha = (fecha: Date): TareaPublicacion[] => {
    const todasPublicaciones = obtenerTodasPublicaciones();
    const fechaStr = fecha.toISOString().split('T')[0];
    
    const resultado = todasPublicaciones.filter(pub => {
      if (!pub.fechaProgramada) return false;
      try {
        // Si la fecha ya está en formato YYYY-MM-DD, usarla directamente
        let fechaPub = pub.fechaProgramada;
        if (fechaPub.includes('T') || fechaPub.length > 10) {
          fechaPub = new Date(pub.fechaProgramada).toISOString().split('T')[0];
        }
        
        return fechaPub === fechaStr;
      } catch {
        return false;
      }
    });
    
    return resultado;
  };

  const obtenerDiasDelMes = (fecha: Date) => {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    
    // Primer día del mes - FORZAR horario a mediodia para evitar offset
    const primerDia = new Date(año, mes, 1, 12, 0, 0);
    // Último día del mes
    const ultimoDia = new Date(año, mes + 1, 0, 12, 0, 0);
    
    // Día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
    let inicioDiaSemana = primerDia.getDay();
    // Convertir para que lunes sea 0
    inicioDiaSemana = inicioDiaSemana === 0 ? 6 : inicioDiaSemana - 1;
    
    const dias = [];
    
    // Agregar días del mes anterior para completar la primera semana
    for (let i = inicioDiaSemana - 1; i >= 0; i--) {
      const fecha = new Date(año, mes, -i, 12, 0, 0);
      dias.push({ fecha, esDelMesActual: false });
    }
    
    // Agregar todos los días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(año, mes, dia, 12, 0, 0);
      dias.push({ fecha, esDelMesActual: true });
    }
    
    // Agregar días del siguiente mes para completar la última semana
    const diasCompletos = dias.length;
    const diasParaCompletar = 42 - diasCompletos; // 6 semanas * 7 días
    for (let dia = 1; dia <= diasParaCompletar; dia++) {
      const fecha = new Date(año, mes + 1, dia, 12, 0, 0);
      dias.push({ fecha, esDelMesActual: false });
    }
    
    return dias;
  };

  const navegarMes = (direccion: 'anterior' | 'siguiente') => {
    setFechaCalendario(prev => {
      const nuevaFecha = new Date(prev);
      if (direccion === 'anterior') {
        nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
      } else {
        nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
      }
      return nuevaFecha;
    });
  };

  // Funciones para drag & drop
  const handleDragStart = (e: React.DragEvent, publicacion: TareaPublicacion) => {
    setDraggedPublication(publicacion);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', publicacion.id);
    
    // Agregar clase visual al elemento arrastrado
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedPublication(null);
    setDragOverDay(null);
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent, fecha: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const fechaStr = fecha.toISOString().split('T')[0];
    setDragOverDay(fechaStr);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Solo limpiar si realmente salimos del contenedor
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverDay(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, fecha: Date) => {
    e.preventDefault();
    setDragOverDay(null);
    
    if (!draggedPublication) return;
    
    const nuevaFecha = fecha.toISOString().split('T')[0];
    const fechaActual = draggedPublication.fechaProgramada ? 
      (draggedPublication.fechaProgramada.includes('T') || draggedPublication.fechaProgramada.length > 10 
        ? new Date(draggedPublication.fechaProgramada).toISOString().split('T')[0] 
        : draggedPublication.fechaProgramada) : null;
    
    // Si es la misma fecha, no hacer nada
    if (fechaActual === nuevaFecha) {
      setDraggedPublication(null);
      return;
    }

    try {
      // Mostrar loading
      setActionLoading(draggedPublication.id);
      
      const response = await fetch(`/api/cliente/${codigo}/actualizar-fecha`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tareaId: draggedPublication.id,
          nuevaFecha: nuevaFecha
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error actualizando fecha');
      }

      const result = await response.json();
      console.log('✅ Fecha actualizada:', result);
      toast.success(`Publicación movida a ${fecha.toLocaleDateString('es-ES')}`);

      // Actualizar inmediatamente en el estado local para mayor responsividad
      if (data) {
        const updatePublication = (pub: TareaPublicacion) => {
          if (pub.id === draggedPublication.id) {
            return { ...pub, fechaProgramada: nuevaFecha };
          }
          return pub;
        };

        setData(prev => prev ? {
          ...prev,
          publicacionesPorRevisar: prev.publicacionesPorRevisar?.map(updatePublication) || [],
          publicacionesPendientesCambios: prev.publicacionesPendientesCambios?.map(updatePublication) || [],
          publicacionesAprobadas: prev.publicacionesAprobadas?.map(updatePublication) || []
        } : null);
      }

      // Refrescar la tarea específica para obtener los datos más frescos de ClickUp
      try {
        const refreshResponse = await fetch(`/api/cliente/${codigo}/refresh-task`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tareaId: draggedPublication.id }),
        });

        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          console.log('🔄 Tarea refrescada desde ClickUp:', refreshResult.publicacion);
          
          // Actualizar solo esta publicación específica en el estado
          if (data) {
            const updateSpecificPublication = (pub: TareaPublicacion) => {
              if (pub.id === draggedPublication.id) {
                return refreshResult.publicacion;
              }
              return pub;
            };

            setData(prev => prev ? {
              ...prev,
              publicacionesPorRevisar: prev.publicacionesPorRevisar?.map(updateSpecificPublication) || [],
              publicacionesPendientesCambios: prev.publicacionesPendientesCambios?.map(updateSpecificPublication) || [],
              publicacionesAprobadas: prev.publicacionesAprobadas?.map(updateSpecificPublication) || []
            } : null);
          }
        } else {
          console.warn('No se pudo refrescar la tarea específica, usando refresh completo');
          setTimeout(() => fetchPublicaciones(true), 1000);
        }
      } catch (refreshError) {
        console.warn('Error refrescando tarea específica, usando refresh completo:', refreshError);
        setTimeout(() => fetchPublicaciones(true), 1000);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setActionLoading(null);
      setDraggedPublication(null);
    }
  };

  // Función para renderizar tarjeta resumida para calendario
  function renderPublicacionCardResumida(publicacion: TareaPublicacion) {
    const canEdit = data?.publicacionesPorRevisar?.some(p => p.id === publicacion.id) || false;
    
    return (
      <div 
        key={publicacion.id}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, publicacion)}
        onDragEnd={handleDragEnd}
        className={`p-2 rounded-lg text-xs cursor-move transition-all duration-200 hover:shadow-md group ${
          canEdit 
            ? 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200' 
            : publicacion.estado?.toLowerCase().includes('aprobado')
              ? 'bg-green-100 border-green-300 hover:bg-green-200'
              : 'bg-orange-100 border-orange-300 hover:bg-orange-200'
        } border active:cursor-grabbing`}
        onClick={() => abrirComentarios(publicacion)}
        title="Arrastra para cambiar fecha"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-1">
            <span className="text-sm">
              {getTipoPublicacionIcon(publicacion.tipoPublicacion)}
            </span>
            <div className="flex space-x-0.5">
              {getPlataformasIcons(publicacion.plataformaPublicacion).slice(0, 2).map((icon, index) => (
                <span key={index} className="text-xs">
                  {icon}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPublicacion(publicacion);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
              title="Ver detalles"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <div className={`w-2 h-2 rounded-full ${
              canEdit 
                ? 'bg-yellow-500' 
                : publicacion.estado?.toLowerCase().includes('aprobado')
                  ? 'bg-green-500'
                  : 'bg-orange-500'
            }`} />
          </div>
        </div>
        
        <div className="font-medium text-gray-900 line-clamp-2 text-xs mb-1 group-hover:text-gray-700">
          {publicacion.nombre}
        </div>
        
        {publicacion.textoPublicacion && (
          <div className="text-gray-600 line-clamp-1 text-xs mb-1">
            {publicacion.textoPublicacion}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-gray-500 text-xs">
            {publicacion.creador.nombre}
          </div>
          {canEdit && (
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAccion(publicacion.id, 'aprobar');
                }}
                className="w-4 h-4 bg-green-500 hover:bg-green-600 rounded text-white flex items-center justify-center"
                title="Aprobar"
              >
                ✓
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

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
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPublicacion(publicacion)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Ver detalles completos"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Badge className={`${getEstadoColor(publicacion.estado)} font-medium`}>
                {publicacion.estado}
              </Badge>
            </div>
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

          {/* Botones de comentarios y refresh - siempre visibles */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex space-x-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 shadow-sm"
                onClick={() => abrirComentarios(publicacion)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Ver comentarios
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 shadow-sm"
                onClick={() => handleRefreshSingleTask(publicacion.id)}
                disabled={actionLoading === publicacion.id}
                title="Actualizar datos desde ClickUp"
              >
                <RefreshCw className={`w-4 h-4 ${actionLoading === publicacion.id ? 'animate-spin' : ''}`} />
              </Button>
            </div>

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
            {/* Logo del cliente - Solo a la izquierda */}
            <div className="flex-shrink-0">
              {data.cliente.logoUrl ? (
                <img
                  src={data.cliente.logoUrl}
                  alt={`Logo de ${data.cliente.nombre}`}
                  className="h-12 sm:h-14 w-auto max-w-48 sm:max-w-64 object-contain transition-all duration-200"
                  onError={(e) => {
                    // Si falla la carga del logo, mostrar el nombre como fallback
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).nextElementSibling;
                    if (fallback) {
                      fallback.classList.remove('hidden');
                    }
                  }}
                />
              ) : null}
              <h1 className={`text-2xl sm:text-3xl font-bold text-gray-900 ${data.cliente.logoUrl ? 'hidden' : ''}`}>
                {data.cliente.nombre}
              </h1>
            </div>
            
            {/* Centro - Pestañas de Vista */}
            <div className="flex items-center">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setVistaActiva('kanban')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    vistaActiva === 'kanban'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Columns className="h-4 w-4" />
                  <span className="hidden sm:inline">Kanban</span>
                </button>
                <button
                  onClick={() => setVistaActiva('calendario')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    vistaActiva === 'calendario'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendario</span>
                </button>
                <button
                  onClick={() => setVistaActiva('lista')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    vistaActiva === 'lista'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Lista</span>
                </button>
              </div>
            </div>
            
            {/* Derecha - Usuario y Logout */}
            <div className="flex items-center space-x-2">
              {/* Botón de Logout - Solo icono */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="p-2"
                title="Cerrar Sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              
              {/* Usuario con icono */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  {currentUser ? currentUser.nombre : 'Usuario'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`${vistaActiva === 'calendario' || vistaActiva === 'kanban' ? 'w-full' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8 py-8`}>
        {/* Header con filtros y badges */}
        <div className="">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">

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
              
              {/* Filtro rápido de meses sin mostrar panel completo */}
              {!mostrarFiltros && (() => {
                const mesesDisponibles = getMesesDisponibles();
                return mesesDisponibles.length > 1 && (
                  <>
                    <div className="hidden md:flex items-center space-x-2">
                      <span className="text-sm text-gray-600 font-medium">Mes:</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setFiltros(prev => ({ ...prev, mes: '' }))}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            !filtros.mes 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Todos
                        </button>
                        {mesesDisponibles.slice(0, 3).map((mes) => (
                          <button
                            key={mes.value}
                            onClick={() => setFiltros(prev => ({ ...prev, mes: mes.value }))}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              filtros.mes === mes.value 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {mes.label.split(' ')[0]}
                          </button>
                        ))}
                        {mesesDisponibles.length > 3 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setMostrarFiltros(true)}
                          >
                            +{mesesDisponibles.length - 3}
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
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
            </div>
            
            {/* Badges de estado */}
            <div className="flex space-x-2">
              <Badge variant="outline" className="text-sm border-yellow-300 text-yellow-700 bg-yellow-50">
                {data.total?.porRevisar || 0} por revisar
              </Badge>
              <Badge variant="outline" className="text-sm border-orange-300 text-orange-700 bg-orange-50">
                {data.total?.pendientesCambios || 0} pendientes
              </Badge>
              <Badge variant="outline" className="text-sm border-green-300 text-green-700 bg-green-50">
                {data.total?.aprobadas || 0} aprobadas
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Filtros */}
      {mostrarFiltros && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Filtro rápido de meses - prominente */}
            {(() => {
              const mesesDisponibles = getMesesDisponibles();
              return mesesDisponibles.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Filtro rápido por mes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFiltros(prev => ({ ...prev, mes: '' }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !filtros.mes 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Todos los meses
                    </button>
                    {mesesDisponibles.map((mes) => (
                      <button
                        key={mes.value}
                        onClick={() => setFiltros(prev => ({ ...prev, mes: mes.value }))}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filtros.mes === mes.value 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {mes.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
            
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
                      filtros.mes && `Mes: ${getMesesDisponibles().find(m => m.value === filtros.mes)?.label.split(' (')[0] || filtros.mes}`,
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
      <div className={`${vistaActiva === 'calendario' || vistaActiva === 'kanban' ? 'w-full' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8 py-8`}>
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
        ) : vistaActiva === 'calendario' ? (
          // Vista de Calendario
          <div className="bg-white rounded-lg shadow-lg">
            {/* Header del Calendario */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {fechaCalendario.toLocaleDateString('es-ES', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h2>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navegarMes('anterior')}
                    className="p-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navegarMes('siguiente')}
                    className="p-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFechaCalendario(new Date())}
                  >
                    Hoy
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {obtenerTodasPublicaciones().length} publicaciones
                {hayFiltrosActivos() && (
                  <span className="ml-1 text-blue-600 font-medium">(filtradas)</span>
                )}
              </div>
            </div>

            {/* Grid del Calendario */}
            <div className="p-6">
              {/* Header de días de la semana */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, index) => (
                  <div key={dia} className={`p-2 text-center text-sm font-semibold ${
                    index >= 5 ? 'text-gray-500' : 'text-gray-700'
                  }`}>
                    {dia}
                  </div>
                ))}
              </div>

              {/* Grid de días */}
              <div className="grid grid-cols-7 gap-2">
                {obtenerDiasDelMes(fechaCalendario).map((diaInfo, index) => {
                  // Usar directamente la fecha del calendario (ya tiene 12:00:00 para evitar offset)
                  const publicacionesDelDia = obtenerPublicacionesPorFecha(diaInfo.fecha);
                  const esHoy = diaInfo.fecha.toDateString() === new Date().toDateString();
                  const esFinDeSemana = index % 7 >= 5; // Sábado (5) y Domingo (6)
                  const fechaStr = diaInfo.fecha.toISOString().split('T')[0];
                  const isDragOver = dragOverDay === fechaStr;
                  
                  // Log temporal para debug
                  if (publicacionesDelDia.length > 0) {
                    console.log(`📅 CALENDARIO DEBUG - Día ${diaInfo.fecha.getDate()}:`, {
                      fechaDelDia: fechaStr,
                      numeroDelDia: diaInfo.fecha.getDate(),
                      publicaciones: publicacionesDelDia.map(p => p.nombre)
                    });
                  }
                  

                  
                  return (
                    <div
                      key={index}
                      onDragOver={(e) => handleDragOver(e, diaInfo.fecha)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, diaInfo.fecha)}
                      className={`min-h-[120px] p-2 border rounded-lg transition-colors ${
                        isDragOver
                          ? 'bg-blue-100 border-blue-300 border-dashed border-2'
                          : diaInfo.esDelMesActual
                            ? esHoy 
                              ? 'bg-blue-50 border-blue-200' 
                              : esFinDeSemana
                                ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            : esFinDeSemana
                              ? 'bg-slate-100 border-slate-200'
                              : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      {/* Número del día */}
                      <div className={`text-sm font-medium mb-2 ${
                        diaInfo.esDelMesActual
                          ? esHoy 
                            ? 'text-blue-600' 
                            : esFinDeSemana
                              ? 'text-slate-600'
                              : 'text-gray-900'
                          : esFinDeSemana
                            ? 'text-slate-400'
                            : 'text-gray-400'
                      }`}>
                        {diaInfo.fecha.getDate()}
                      </div>

                      {/* Publicaciones del día */}
                      <div className="space-y-1">
                        {publicacionesDelDia.slice(0, 3).map((publicacion) => 
                          renderPublicacionCardResumida(publicacion)
                        )}
                        
                        {/* Indicador de más publicaciones */}
                        {publicacionesDelDia.length > 3 && (
                          <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 text-center">
                            +{publicacionesDelDia.length - 3} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leyenda */}
            <div className="flex items-center justify-center space-x-6 p-4 bg-gray-50 border-t">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Por revisar</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Pendientes cambios</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Aprobadas</span>
              </div>
            </div>
          </div>
        ) : vistaActiva === 'kanban' ? (
          // Vista Kanban
          <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative">
              {/* Separador vertical derecho */}
              <div className="hidden lg:block absolute left-1/3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent transform -translate-x-1/2 z-0"></div>
              <div className="hidden lg:block absolute left-2/3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent transform -translate-x-1/2 z-0"></div>

              {/* Columna: Por Revisar */}
              <div className="space-y-4 relative z-10">
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border border-yellow-200 rounded-lg shadow-sm">
                  <div className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Por Revisar ({aplicarFiltros(data.publicacionesPorRevisar || []).length})
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {aplicarFiltros(data.publicacionesPorRevisar || [])
                    .sort((a, b) => {
                      // Ordenar por fecha más próxima primero
                      if (!a.fechaProgramada && !b.fechaProgramada) return 0;
                      if (!a.fechaProgramada) return 1;
                      if (!b.fechaProgramada) return -1;
                      return new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime();
                    })
                    .map((publicacion) => (
                      <Card key={publicacion.id} className="hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: '#eab308' }}>
                        {renderPublicacionCard(publicacion, true)}
                      </Card>
                    ))}
                  {aplicarFiltros(data.publicacionesPorRevisar || []).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📝</div>
                      <p className="text-sm">No hay publicaciones por revisar</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna: Pendientes de Cambios */}
              <div className="space-y-4 relative z-10">
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border border-orange-200 rounded-lg shadow-sm">
                  <div className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Pendientes de Cambios ({aplicarFiltros(data.publicacionesPendientesCambios || []).length})
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {aplicarFiltros(data.publicacionesPendientesCambios || [])
                    .sort((a, b) => {
                      // Ordenar por fecha más próxima primero
                      if (!a.fechaProgramada && !b.fechaProgramada) return 0;
                      if (!a.fechaProgramada) return 1;
                      if (!b.fechaProgramada) return -1;
                      return new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime();
                    })
                    .map((publicacion) => (
                      <Card key={publicacion.id} className="hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: '#f97316' }}>
                        {renderPublicacionCard(publicacion, false)}
                      </Card>
                    ))}
                  {aplicarFiltros(data.publicacionesPendientesCambios || []).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🔄</div>
                      <p className="text-sm">No hay publicaciones pendientes de cambios</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna: Aprobadas */}
              <div className="space-y-4 relative z-10">
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border border-green-200 rounded-lg shadow-sm">
                  <div className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Aprobadas ({aplicarFiltros(data.publicacionesAprobadas || []).length})
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {aplicarFiltros(data.publicacionesAprobadas || [])
                    .sort((a, b) => {
                      // Ordenar por fecha más próxima primero
                      if (!a.fechaProgramada && !b.fechaProgramada) return 0;
                      if (!a.fechaProgramada) return 1;
                      if (!b.fechaProgramada) return -1;
                      return new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime();
                    })
                    .map((publicacion) => (
                      <Card key={publicacion.id} className="hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: '#22c55e' }}>
                        {renderPublicacionCard(publicacion, false)}
                      </Card>
                    ))}
                  {aplicarFiltros(data.publicacionesAprobadas || []).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">✅</div>
                      <p className="text-sm">No hay publicaciones aprobadas</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
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
                      <Card key={publicacion.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden border-l-4" style={{ borderLeftColor: '#eab308' }}>
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
                                              <Card key={publicacion.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden border-l-4" style={{ borderLeftColor: '#f97316' }}>
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
                                              <Card key={publicacion.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden border-l-4" style={{ borderLeftColor: '#22c55e' }}>
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

      {/* Modal de detalles de publicación */}
      {selectedPublicacion && (
        <PublicacionDetailModal
          isOpen={!!selectedPublicacion}
          onClose={() => setSelectedPublicacion(null)}
          publicacion={selectedPublicacion}
          comentarios={getComentarios(selectedPublicacion.id)}
          onAprobar={() => handleAccion(selectedPublicacion.id, 'aprobar')}
          onSolicitarCambios={(comentario) => {
            setComentario(comentario);
            handleAccion(selectedPublicacion.id, 'hay_cambios');
          }}
          actionLoading={actionLoading === selectedPublicacion.id}
          canEdit={data?.publicacionesPorRevisar?.some(p => p.id === selectedPublicacion.id) || false}
          fetchComentarios={fetchComentarios}
          loadingComentarios={loadingComentarios[selectedPublicacion.id] || false}
        />
      )}
    </div>
  );
}