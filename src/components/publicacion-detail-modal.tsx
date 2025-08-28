'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  User, 
  Tag, 
  ExternalLink, 
  MessageCircle, 
  CheckCircle, 
  XCircle,
  Clock,
  Eye,
  FileText,
  Link,
  Users,
  Zap
} from 'lucide-react';
import { TareaPublicacion, Comentario } from '@/types';
import { formatClickUpDate } from '@/lib/utils';

interface PublicacionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicacion: TareaPublicacion;
  comentarios: Comentario[];
  onAprobar: () => void;
  onSolicitarCambios: (comentario: string) => void;
  actionLoading: boolean;
  canEdit: boolean;
  fetchComentarios?: (tareaId: string) => Promise<any[]>;
  loadingComentarios?: boolean;
}

export function PublicacionDetailModal({
  isOpen,
  onClose,
  publicacion,
  comentarios,
  onAprobar,
  onSolicitarCambios,
  actionLoading,
  canEdit,
  fetchComentarios,
  loadingComentarios = false
}: PublicacionDetailModalProps) {
  const [comentario, setComentario] = useState('');
  const [hasLoadedComments, setHasLoadedComments] = useState(false);

  // Cargar comentarios cuando se abra el modal (solo una vez por publicación)
  useEffect(() => {
    if (isOpen && fetchComentarios && !hasLoadedComments) {
      fetchComentarios(publicacion.id);
      setHasLoadedComments(true);
    }
    
    // Reset cuando se cierre el modal
    if (!isOpen) {
      setHasLoadedComments(false);
    }
  }, [isOpen, publicacion.id]);

  const handleSolicitarCambios = () => {
    if (comentario.trim()) {
      onSolicitarCambios(comentario.trim());
      setComentario('');
    }
  };



  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'por revisar':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pendiente de cambios':
      case 'hay cambios':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'aprobado':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] sm:max-h-[95vh] p-0 gap-0 w-[95vw] sm:w-full bg-white">
        <DialogHeader className="p-4 sm:p-6 pb-0 bg-white border-b border-gray-100">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 pr-8 line-clamp-2">
            {publicacion.nombre}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 bg-white">
          {/* Columna Izquierda - Información Principal */}
          <div className="flex-1 p-4 sm:p-6 lg:pr-3 bg-white">
            <ScrollArea className="h-[calc(50vh-80px)] lg:h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Estado y Fecha */}
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={`${getEstadoColor(publicacion.estado)} border font-medium`}>
                    {publicacion.estado}
                  </Badge>
                  {publicacion.fechaProgramada && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatClickUpDate(publicacion.fechaProgramada)}
                    </div>
                  )}
                </div>

                {/* Descripción */}
                {publicacion.descripcion && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Descripción
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{publicacion.descripcion}</p>
                    </div>
                  </div>
                )}

                {/* Detalles de Publicación */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Detalles
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tipo de Publicación */}
                    {publicacion.tipoPublicacion && (
                      <div className="bg-white border rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-500 mb-1">Tipo</div>
                        <div className="text-gray-900">{publicacion.tipoPublicacion}</div>
                      </div>
                    )}

                    {/* Plataformas */}
                    {publicacion.plataformaPublicacion && publicacion.plataformaPublicacion.length > 0 && (
                      <div className="bg-white border rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-500 mb-2">Plataformas</div>
                        <div className="flex flex-wrap gap-1">
                          {publicacion.plataformaPublicacion.map((plataforma, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {plataforma}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Texto de Publicación */}
                {publicacion.textoPublicacion && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Texto de la Publicación
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-gray-800 whitespace-pre-wrap">{publicacion.textoPublicacion}</p>
                    </div>
                  </div>
                )}

                {/* Descripción de la Publicación (Copy para redes) */}
                {publicacion.descripcionPublicacion && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Copy para Redes Sociales
                    </h3>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-gray-800 whitespace-pre-wrap">{publicacion.descripcionPublicacion}</p>
                    </div>
                  </div>
                )}

                {/* URL de Stories */}
                {publicacion.urlStories && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Link className="w-5 h-5 mr-2" />
                      URL para Stories
                    </h3>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <a 
                        href={publicacion.urlStories} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-700 hover:text-purple-900 underline break-all"
                      >
                        {publicacion.urlStories}
                      </a>
                    </div>
                  </div>
                )}

                {/* Enlaces */}
                {publicacion.enlaceDrive && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Link className="w-5 h-5 mr-2" />
                      Enlaces
                    </h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open(publicacion.enlaceDrive, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver archivos en Drive
                      </Button>
                    </div>
                  </div>
                )}

                {/* Metadatos */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Metadatos
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Creado:</span>
                      <span className="text-gray-900">{formatClickUpDate(publicacion.fechaCreacion)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Última actualización:</span>
                      <span className="text-gray-900">{formatClickUpDate(publicacion.fechaActualizacion)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Creador:</span>
                      <span className="text-gray-900">{publicacion.creador.nombre}</span>
                    </div>
                    {publicacion.asignados.length > 0 && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">Asignados:</span>
                        <span className="text-gray-900">
                          {publicacion.asignados.map(a => a.nombre).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Etiquetas */}
                {publicacion.etiquetas && publicacion.etiquetas.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Tag className="w-5 h-5 mr-2" />
                      Etiquetas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {publicacion.etiquetas.map((etiqueta, index) => (
                        <Badge 
                          key={index} 
                          variant="outline"
                          style={{ 
                            backgroundColor: etiqueta.color + '20',
                            borderColor: etiqueta.color,
                            color: etiqueta.color 
                          }}
                        >
                          {etiqueta.nombre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Separador */}
          <Separator orientation="vertical" className="bg-gray-200 hidden lg:block" />

          {/* Columna Derecha - Comentarios y Acciones */}
          <div className="w-full lg:w-96 p-4 sm:p-6 lg:pl-3 bg-gray-50/50">
            <div className="h-[calc(40vh-80px)] lg:h-[calc(90vh-120px)] flex flex-col">
              {/* Comentarios */}
              <div className="flex-1 min-h-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Comentarios ({comentarios.length})
                </h3>
                
                <ScrollArea className="h-full">
                  {loadingComentarios ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-sm">Cargando comentarios...</p>
                    </div>
                  ) : comentarios.length > 0 ? (
                    <div className="space-y-3">
                      {comentarios.map((comentario) => (
                        <div 
                          key={comentario.id} 
                          className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-sm font-medium text-gray-900">
                              {comentario.autor.nombre}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatClickUpDate(comentario.fechaCreacion.toString())}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {comentario.contenido}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No hay comentarios aún</p>
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Acciones */}
              {canEdit && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="space-y-3">
                    {/* Aprobar */}
                    <Button
                      onClick={onAprobar}
                      disabled={actionLoading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aprobar
                    </Button>

                    {/* Solicitar Cambios */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Describe los cambios necesarios..."
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <Button
                        onClick={handleSolicitarCambios}
                        disabled={actionLoading || !comentario.trim()}
                        variant="outline"
                        className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Solicitar cambios
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Indicador de solo lectura */}
              {!canEdit && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="text-center text-sm text-gray-500 italic p-3 bg-gray-100 rounded-lg">
                    {publicacion.estado === 'Aprobado' 
                      ? '✅ Publicación aprobada' 
                      : '🔄 Esperando cambios del equipo'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
