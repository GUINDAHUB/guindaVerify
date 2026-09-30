'use client';

import { RefreshCw, AlertTriangle } from 'lucide-react';

// Qué significa cada estado de ClickUp dentro del Verify
export type RolEstado = 'oculto' | 'sin_empezar' | 'revisar' | 'cambios_visual' | 'cambios_copy' | 'aprobado';

export type EstadosMapping = Record<string, RolEstado>;

export interface ClickUpStatus {
  id?: string;
  status: string;
  color?: string;
  orderindex?: number | string;
}

// Campos de la tabla `clientes` que salen del mapeo
export interface ConfigEstados {
  clickupStatusNotStarted: string | null;
  estadosVisibles: string[];
  estadosRechazo: string[];
  estadosAprobacion: string[];
  estadoCambiosCopy: string | null;
}

const ROLES: Array<{ value: RolEstado; label: string; className: string }> = [
  { value: 'oculto', label: 'Oculto (interno)', className: 'text-gray-500' },
  { value: 'sin_empezar', label: 'Sin empezar', className: 'text-gray-700' },
  { value: 'revisar', label: 'Por revisar', className: 'text-amber-700' },
  { value: 'cambios_visual', label: 'Cambios visuales', className: 'text-orange-700' },
  { value: 'cambios_copy', label: 'Cambios de copy', className: 'text-purple-700' },
  { value: 'aprobado', label: 'Aprobado', className: 'text-emerald-700' },
];

const ROL_LABEL: Record<RolEstado, string> = Object.fromEntries(ROLES.map(r => [r.value, r.label])) as Record<RolEstado, string>;

// Sugerencia por nombre del estado (solo se aplica sola en clientes nuevos)
export function sugerirRol(nombre: string): RolEstado {
  const n = nombre.toLowerCase().trim();
  if (n.includes('falta')) return 'oculto'; // falta contenido, falta copy: internos
  if (n.includes('copy') && (n.includes('pendiente') || n.includes('cambio'))) return 'cambios_copy';
  if (n.includes('cambio') || n.includes('rechaz')) return 'cambios_visual';
  if (n.includes('revis')) return 'revisar';
  if (n.includes('aprobad') || n.includes('programad')) return 'aprobado';
  if (n === 'sin empezar') return 'sin_empezar';
  return 'oculto';
}

export function sugerirMapping(statuses: ClickUpStatus[]): EstadosMapping {
  const mapping: EstadosMapping = {};
  for (const s of statuses) mapping[s.status] = sugerirRol(s.status);
  return mapping;
}

// Configuración guardada del cliente -> mapeo. Si un estado tenía dos funciones
// (p. ej. "sin empezar" y "por revisar" a la vez) se queda la que permite actuar al cliente.
export function mappingDesdeConfig(config: ConfigEstados): EstadosMapping {
  const mapping: EstadosMapping = {};
  if (config.clickupStatusNotStarted) mapping[config.clickupStatusNotStarted] = 'sin_empezar';
  for (const e of config.estadosAprobacion) mapping[e] = 'aprobado';
  if (config.estadoCambiosCopy) mapping[config.estadoCambiosCopy] = 'cambios_copy';
  for (const e of config.estadosRechazo) mapping[e] = 'cambios_visual';
  for (const e of config.estadosVisibles) mapping[e] = 'revisar';
  return mapping;
}

// Estados configurados que tenían más de una función (se avisa en la tabla)
export function estadosConVariasFunciones(config: ConfigEstados): string[] {
  const todos = [
    ...(config.clickupStatusNotStarted ? [config.clickupStatusNotStarted] : []),
    ...config.estadosVisibles,
    ...config.estadosRechazo,
    ...config.estadosAprobacion,
    ...(config.estadoCambiosCopy ? [config.estadoCambiosCopy] : []),
  ];
  return [...new Set(todos.filter((e, i) => todos.indexOf(e) !== i))];
}

// Mapeo -> campos de `clientes`, respetando el orden de ClickUp (el primero de cada
// grupo es el estado al que se mueve la tarea al aprobar / pedir cambios)
export function configDesdeMapping(mapping: EstadosMapping, orden: string[]): ConfigEstados {
  const nombres = [...orden, ...Object.keys(mapping).filter(n => !orden.includes(n))];
  const con = (rol: RolEstado) => nombres.filter(n => mapping[n] === rol);
  return {
    clickupStatusNotStarted: con('sin_empezar')[0] || null,
    estadosVisibles: con('revisar'),
    estadosRechazo: con('cambios_visual'),
    estadosAprobacion: con('aprobado'),
    estadoCambiosCopy: con('cambios_copy')[0] || null,
  };
}

export function validarMapping(mapping: EstadosMapping): string | null {
  const cuenta = (rol: RolEstado) => Object.values(mapping).filter(r => r === rol).length;
  if (cuenta('revisar') === 0) return 'Asigna al menos un estado a "Por revisar"';
  if (cuenta('cambios_visual') === 0) return 'Asigna al menos un estado a "Cambios visuales"';
  if (cuenta('aprobado') === 0) return 'Asigna al menos un estado a "Aprobado"';
  if (cuenta('sin_empezar') > 1) return 'Solo puede haber un estado "Sin empezar"';
  if (cuenta('cambios_copy') > 1) return 'Solo puede haber un estado "Cambios de copy"';
  return null;
}

interface EstadosMappingTableProps {
  statuses: ClickUpStatus[];
  mapping: EstadosMapping;
  onChange: (mapping: EstadosMapping) => void;
  loading: boolean;
  hayLista: boolean;
  avisos?: string[];
}

export function EstadosMappingTable({ statuses, mapping, onChange, loading, hayLista, avisos = [] }: EstadosMappingTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 border rounded-md bg-gray-50">
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-gray-500">Cargando estados de ClickUp...</span>
      </div>
    );
  }

  const nombresClickUp = statuses.map(s => s.status);
  // Estados guardados en el cliente que ya no existen en la lista de ClickUp
  const huerfanos = Object.keys(mapping).filter(n => !nombresClickUp.includes(n) && mapping[n] !== 'oculto');
  const filas: Array<ClickUpStatus & { huerfano?: boolean }> = [
    ...statuses,
    ...huerfanos.map(status => ({ status, huerfano: true })),
  ];

  if (filas.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-6 text-center border rounded-md bg-gray-50">
        {hayLista ? 'No se encontraron estados en esta lista' : 'Selecciona una lista de ClickUp primero'}
      </p>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500">
          <tr>
            <th className="text-left font-medium px-3 py-2">Estado en ClickUp</th>
            <th className="text-left font-medium px-3 py-2">En el Verify es…</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {filas.map((fila) => {
            const rol = mapping[fila.status] || 'oculto';
            const sugerido = sugerirRol(fila.status);
            const rolInfo = ROLES.find(r => r.value === rol);
            return (
              <tr key={fila.status} className={fila.huerfano ? 'bg-red-50' : ''}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: fila.color || '#d1d5db' }}
                    />
                    <span className="font-medium text-gray-800">{fila.status}</span>
                  </div>
                  {fila.huerfano && (
                    <p className="text-xs text-red-600 mt-0.5">Ya no existe en ClickUp</p>
                  )}
                  {avisos.includes(fila.status) && (
                    <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Tenía varias funciones; revisa cuál quieres
                    </p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={rol}
                      onChange={(e) => onChange({ ...mapping, [fila.status]: e.target.value as RolEstado })}
                      className={`border rounded-md px-2 py-1 text-sm bg-white ${rolInfo?.className || ''}`}
                    >
                      {ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    {sugerido !== rol && sugerido !== 'oculto' && !fila.huerfano && (
                      <button
                        type="button"
                        onClick={() => onChange({ ...mapping, [fila.status]: sugerido })}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Sugerido: {ROL_LABEL[sugerido]}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
