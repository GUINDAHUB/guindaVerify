import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, MessageCircle, MessageSquare, HelpCircle, Columns, Calendar, X } from 'lucide-react';

interface WikiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WikiModal({ isOpen, onClose }: WikiModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden bg-white border-0 shadow-2xl rounded-xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 -m-6 mb-6 rounded-t-xl">
          <DialogTitle className="flex items-center space-x-3 text-xl font-bold">
            <div className="bg-white/20 p-2 rounded-lg">
              <HelpCircle className="h-6 w-6" />
            </div>
            <span>Guía de Uso - Portal de Revisión</span>
          </DialogTitle>
          <DialogDescription className="text-blue-100 mt-2 text-base">
            Aprende a usar todas las funciones del portal de manera rápida y eficiente
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh] px-1">
          <div className="space-y-8">
            {/* Vista General */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-3">🎯</span>
                ¿Qué es esto?
              </h3>
              <p className="text-gray-700 text-base leading-relaxed">
                Este portal te permite revisar y aprobar las publicaciones de redes sociales antes de que se publiquen.
              </p>
            </div>

            {/* Estados de Publicaciones */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">📊</span>
                Estados de las Publicaciones
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold min-w-fit">Por Revisar</div>
                  <span className="text-gray-700 font-medium">Publicaciones nuevas que necesitan tu aprobación</span>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold min-w-fit">Pendientes</div>
                  <span className="text-gray-700 font-medium">Publicaciones que solicitaste modificar</span>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold min-w-fit">Aprobadas</div>
                  <span className="text-gray-700 font-medium">Publicaciones listas para publicar</span>
                </div>
              </div>
            </div>

            {/* Acciones Principales */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">⚡</span>
                Acciones Disponibles
              </h3>
              <div className="grid gap-4">
                <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 text-base">Aprobar</span>
                    <p className="text-gray-700 mt-1">La publicación está perfecta y puede publicarse</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="bg-orange-500 p-2 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 text-base">Solicitar Cambios</span>
                    <p className="text-gray-700 mt-1">Indica qué necesita modificarse (incluye comentario obligatorio)</p>
                  </div>
                </div>
                
              </div>
            </div>

            {/* Tipos de Vista */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">👁️</span>
                Tipos de Vista
              </h3>
              <div className="grid gap-3">
                <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Columns className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">Kanban</span>
                    <span className="text-gray-700 ml-2">Tarjetas organizadas por estado (recomendado)</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-3 bg-purple-50 rounded-lg">
                  <div className="bg-purple-500 p-2 rounded-lg">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">Calendario</span>
                    <span className="text-gray-700 ml-2">Ve las publicaciones organizadas por fecha</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">🔍</span>
                Filtros Útiles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="font-bold text-gray-900">Por mes</span>
                  <p className="text-gray-700 text-sm mt-1">Filtra publicaciones de un mes específico</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="font-bold text-gray-900">Por plataforma</span>
                  <p className="text-gray-700 text-sm mt-1">Instagram, Facebook, TikTok, etc.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="font-bold text-gray-900">Por tipo</span>
                  <p className="text-gray-700 text-sm mt-1">Post, Story, Reel, etc.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="font-bold text-gray-900">Búsqueda</span>
                  <p className="text-gray-700 text-sm mt-1">Busca por texto en el título</p>
                </div>
              </div>
            </div>

            {/* Consejos */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border-l-4 border-emerald-500">
              <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">💡</span>
                Consejos Rápidos
              </h3>
              <div className="grid gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <p className="text-emerald-800 font-medium">Usa el botón "Actualizar" si no ves cambios recientes</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <p className="text-emerald-800 font-medium">En vista calendario, arrastra publicaciones para cambiar fechas</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <p className="text-emerald-800 font-medium">Los comentarios se sincronizan automáticamente con el equipo</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <p className="text-emerald-800 font-medium">Las publicaciones aprobadas se procesan automáticamente</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-gray-50 p-6 -m-6 mt-6 rounded-b-xl border-t">
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-2 rounded-lg shadow-lg transition-all duration-200"
          >
            ¡Entendido!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
