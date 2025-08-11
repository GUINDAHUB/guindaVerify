'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, RefreshCw, Clock, User } from 'lucide-react';
import { toast } from 'sonner';

interface Comentario {
  id: string;
  contenido: string;
  fechaCreacion: Date;
  autor: {
    nombre: string;
    email: string;
    avatar?: string | null;
  };
  fuente: 'clickup' | 'sistema';
  tipo: 'comentario' | 'accion_cliente';
}

interface ComentariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  tareaId: string;
  tareaNombre: string;
  clienteCodigo: string;
}

export function ComentariosModal({ 
  isOpen, 
  onClose, 
  tareaId, 
  tareaNombre, 
  clienteCodigo 
}: ComentariosModalProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComentarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/cliente/${clienteCodigo}/comentarios/${tareaId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error cargando comentarios');
      }

      const data = await response.json();
      setComentarios(data.comentarios.map((c: {
        id: string;
        contenido: string;
        fechaCreacion: string;
        autor: { nombre: string; email: string; avatar?: string | null };
        fuente: string;
        tipo: string;
      }) => ({
        ...c,
        fechaCreacion: new Date(c.fechaCreacion)
      })));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error(`Error al cargar comentarios: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [clienteCodigo, tareaId]);

  useEffect(() => {
    if (isOpen && tareaId) {
      fetchComentarios();
    }
  }, [isOpen, tareaId, fetchComentarios]);

  const formatearFecha = (fecha: Date) => {
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias}d`;
    
    return fecha.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: fecha.getFullYear() !== ahora.getFullYear() ? 'numeric' : undefined
    });
  };

  const getComentarioIcon = (fuente: string, tipo: string) => {
    if (fuente === 'sistema' && tipo === 'accion_cliente') {
      return '👤'; // Acción del cliente
    }
    if (fuente === 'clickup') {
      return '💬'; // Comentario de ClickUp
    }
    return '📝'; // Otros
  };

  const getComentarioColor = (fuente: string, tipo: string) => {
    if (fuente === 'sistema' && tipo === 'accion_cliente') {
      return 'bg-blue-50 border-blue-200';
    }
    if (fuente === 'clickup') {
      return 'bg-gray-50 border-gray-200';
    }
    return 'bg-green-50 border-green-200';
  };

  const getBadgeVariant = (fuente: string, tipo: string): "default" | "secondary" | "destructive" | "outline" => {
    if (fuente === 'sistema' && tipo === 'accion_cliente') {
      return 'default';
    }
    if (fuente === 'clickup') {
      return 'secondary';
    }
    return 'outline';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center space-x-2 text-lg">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <span>Historial de comentarios</span>
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {tareaNombre}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchComentarios}
                disabled={loading}
                className="flex items-center space-x-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 min-h-0">
          {loading && comentarios.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Cargando comentarios...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-2">⚠️</div>
                <p className="text-sm text-gray-600 mb-3">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchComentarios}>
                  Intentar de nuevo
                </Button>
              </div>
            </div>
          ) : comentarios.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">💬</div>
                <p className="text-sm text-gray-600">No hay comentarios aún</p>
                <p className="text-xs text-gray-500 mt-1">
                  Los comentarios y acciones aparecerán aquí
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[400px] px-6">
              <div className="space-y-4 py-4">
                {comentarios.map((comentario) => (
                  <div
                    key={comentario.id}
                    className={`p-4 rounded-lg border ${getComentarioColor(comentario.fuente, comentario.tipo)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        {comentario.autor.avatar ? (
                          <AvatarImage src={comentario.autor.avatar} alt={comentario.autor.nombre} />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {comentario.autor.nombre.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm text-gray-900">
                              {comentario.autor.nombre}
                            </span>
                            <Badge 
                              variant={getBadgeVariant(comentario.fuente, comentario.tipo)}
                              className="text-xs"
                            >
                              {getComentarioIcon(comentario.fuente, comentario.tipo)}
                              {comentario.fuente === 'sistema' ? 'Cliente' : 'ClickUp'}
                            </Badge>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatearFecha(comentario.fechaCreacion)}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {comentario.contenido}
                        </div>
                        
                        {comentario.autor.email && (
                          <div className="flex items-center text-xs text-gray-500 mt-2">
                            <User className="w-3 h-3 mr-1" />
                            {comentario.autor.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <Separator />
        
        <div className="p-6 pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {comentarios.length === 0 
                ? 'Sin comentarios' 
                : comentarios.length === 1 
                  ? '1 comentario' 
                  : `${comentarios.length} comentarios`}
            </div>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
