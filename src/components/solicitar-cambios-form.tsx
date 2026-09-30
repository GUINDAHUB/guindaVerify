'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { TipoCambio } from '@/types';

export interface SolicitudCambios {
  tipoCambio?: TipoCambio;
  comentario?: string;
  comentarioCopy?: string;
  comentarioVisual?: string;
}

const OPCIONES: Array<{ value: TipoCambio; titulo: string; detalle: string; activo: string }> = [
  { value: 'copy', titulo: '✍️ Copy', detalle: 'Texto de la publicación', activo: 'border-purple-500 bg-purple-50 text-purple-800' },
  { value: 'visual', titulo: '🎨 Visual', detalle: 'Diseño, vídeo o edición', activo: 'border-orange-500 bg-orange-50 text-orange-800' },
  { value: 'ambos', titulo: '✍️🎨 Ambos', detalle: 'Copy y visual', activo: 'border-rose-500 bg-rose-50 text-rose-800' },
];

interface SolicitarCambiosFormProps {
  // Si el cliente no tiene estado de "cambios de copy", se pide solo un comentario (como siempre)
  cambiosCopyEnabled: boolean;
  loading: boolean;
  // Devuelve true si se envió bien (entonces se vacía el formulario)
  onEnviar: (solicitud: SolicitudCambios) => Promise<boolean>;
  compacto?: boolean;
}

// Cada instancia tiene su propio estado: el texto de una tarjeta no aparece en otra.
export function SolicitarCambiosForm({ cambiosCopyEnabled, loading, onEnviar, compacto = false }: SolicitarCambiosFormProps) {
  const [tipo, setTipo] = useState<TipoCambio | null>(null);
  const [texto, setTexto] = useState('');
  const [textoCopy, setTextoCopy] = useState('');
  const [textoVisual, setTextoVisual] = useState('');

  const filas = compacto ? 3 : 4;

  const valido = !cambiosCopyEnabled
    ? texto.trim() !== ''
    : tipo === 'ambos'
      ? textoCopy.trim() !== '' && textoVisual.trim() !== ''
      : tipo !== null && texto.trim() !== '';

  const enviar = async () => {
    if (!valido || loading) return;
    const solicitud: SolicitudCambios = !cambiosCopyEnabled
      ? { comentario: texto.trim() }
      : tipo === 'ambos'
        ? { tipoCambio: 'ambos', comentarioCopy: textoCopy.trim(), comentarioVisual: textoVisual.trim() }
        : { tipoCambio: tipo!, comentario: texto.trim() };

    const ok = await onEnviar(solicitud);
    if (ok) {
      setTipo(null);
      setTexto('');
      setTextoCopy('');
      setTextoVisual('');
    }
  };

  const placeholder = tipo === 'copy'
    ? 'Describe qué hay que cambiar del texto...'
    : tipo === 'visual'
      ? 'Describe qué hay que cambiar del diseño, vídeo o edición...'
      : 'Describe los cambios que necesita esta publicación...';

  return (
    <div className="space-y-3">
      {cambiosCopyEnabled && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">¿Qué tipo de cambios necesita?</p>
          <div className="grid grid-cols-3 gap-2">
            {OPCIONES.map(opcion => (
              <button
                key={opcion.value}
                type="button"
                onClick={() => setTipo(opcion.value)}
                className={`rounded-lg border-2 px-2 py-2 text-center transition-colors ${
                  tipo === opcion.value ? opcion.activo : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="block text-sm font-semibold">{opcion.titulo}</span>
                <span className="block text-[11px] leading-tight opacity-75 mt-0.5">{opcion.detalle}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {cambiosCopyEnabled && tipo === 'ambos' ? (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-purple-800">✍️ Cambios de copy</label>
            <Textarea
              placeholder="Qué hay que cambiar del texto..."
              value={textoCopy}
              onChange={(e) => setTextoCopy(e.target.value)}
              rows={filas - 1}
              className="resize-none mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-orange-800">🎨 Cambios visuales</label>
            <Textarea
              placeholder="Qué hay que cambiar del diseño, vídeo o edición..."
              value={textoVisual}
              onChange={(e) => setTextoVisual(e.target.value)}
              rows={filas - 1}
              className="resize-none mt-1"
            />
          </div>
        </div>
      ) : (!cambiosCopyEnabled || tipo !== null) && (
        <Textarea
          placeholder={placeholder}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={filas}
          className="resize-none"
        />
      )}

      <Button
        type="button"
        onClick={enviar}
        disabled={loading || !valido}
        className="w-full bg-orange-600 hover:bg-orange-700"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Solicitar cambios
      </Button>
    </div>
  );
}

// Etiqueta del tipo de cambio pedido, para las tarjetas de "Pendientes de cambios"
const BADGES: Record<TipoCambio, { texto: string; className: string }> = {
  copy: { texto: '✍️ Copy', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  visual: { texto: '🎨 Visual', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  ambos: { texto: '✍️🎨 Copy + visual', className: 'bg-rose-100 text-rose-800 border-rose-200' },
};

export function TipoCambioBadge({ tipo, className = '' }: { tipo?: TipoCambio; className?: string }) {
  if (!tipo) return null;
  const badge = BADGES[tipo];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${badge.className} ${className}`}
      title={`Cambios pedidos: ${badge.texto}`}
    >
      {badge.texto}
    </span>
  );
}
