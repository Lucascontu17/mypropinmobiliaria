import { useState, useEffect } from 'react';
import { useRegion } from '@/hooks/useRegion';
import { useEden } from '@/services/eden';
import { toast } from 'sonner';
import { TrendingUp, ArrowUpRight, Percent, BarChart3, AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type TipoAumento = 'PORCENTAJE_MANUAL' | 'INDICE_IPC' | 'INDICE_ICL' | 'INDICE_ICL_IPC';

interface ProyeccionItem {
  contrato_id: string;
  periodo_proyectado: string;
  inquilino_nombre: string;
  inquilino_email: string | null;
  detalle_propiedad: string;
  tipo_inmueble: string;
  monto_actual: number;
  monto_proyectado: number;
  diferencia: number;
  tipo_aumento: TipoAumento;
  porcentaje_aplicado: number;
  indice_usado: string | null;
  periodicidad: string;
  meses_transcurridos: number;
}

interface ProyeccionData {
  periodo_proyectado: string;
  total_contratos_con_aumento: number;
  total_incremento_recaudacion: number;
  indices_vigentes: Record<string, number>;
  proyecciones: ProyeccionItem[];
}

const TIPO_AUMENTO_CONFIG: Record<TipoAumento, { label: string; color: string; bg: string; border: string }> = {
  PORCENTAJE_MANUAL: { label: 'Manual', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  INDICE_IPC:        { label: 'IPC',    color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  INDICE_ICL:        { label: 'ICL',    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  INDICE_ICL_IPC:    { label: 'ICL+IPC', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
};

// Helper: YYYY-MM → YYYY-MM offset by N months
function offsetPeriod(periodo: string, delta: number): string {
  const [y, m] = periodo.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Helper: YYYY-MM → "Julio 2027"
function formatPeriodo(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number);
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${meses[m - 1]} ${y}`;
}

// Default next month
function nextMonthPeriodo(): string {
  return offsetPeriod(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    1
  );
}

export function ProyeccionAumentosPage() {
  const { formatCurrency } = useRegion();
  const { client: eden, isReady } = useEden();
  const [data, setData] = useState<ProyeccionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState(nextMonthPeriodo());

  const fetchData = async (p: string) => {
    setIsLoading(true);
    try {
      // @ts-ignore
      const { data: res, error } = await eden.admin['cobranzas']['proyeccion-aumentos'].get({
        query: { periodo: p },
      });
      if (error) {
        toast.error('No se pudo cargar la proyección de aumentos');
      } else {
        // @ts-ignore
        setData(res?.data ?? null);
      }
    } catch {
      toast.error('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isReady) fetchData(periodo);
  }, [isReady, periodo]);

  const proyecciones = data?.proyecciones ?? [];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-renta-950 font-jakarta flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-renta-600" />
            Proyección de Aumentos
          </h1>
          <p className="text-sm text-renta-500 font-inter mt-1">
            Contratos que recibirán un aumento de alquiler en el periodo seleccionado.
          </p>
        </div>

        {/* ── Selector de Periodo ── */}
        <div className="flex items-center gap-2 bg-white ring-1 ring-inset ring-admin-border border-transparent rounded-xl px-3 py-2 shadow-sm">
          <button
            onClick={() => setPeriodo(p => offsetPeriod(p, -1))}
            className="p-1 rounded-lg hover:bg-renta-50 text-renta-500 hover:text-renta-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-renta-900 w-40 text-center tabular-nums">
            {isLoading ? '...' : formatPeriodo(periodo)}
          </span>
          <button
            onClick={() => setPeriodo(p => offsetPeriod(p, 1))}
            className="p-1 rounded-lg hover:bg-renta-50 text-renta-500 hover:text-renta-900 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => fetchData(periodo)}
            className="ml-1 p-1.5 rounded-lg hover:bg-renta-50 text-renta-400 hover:text-renta-700 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        {/* Contratos con aumento */}
        <div className="bg-white ring-1 ring-inset ring-admin-border border-transparent p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-renta-500 uppercase flex items-center gap-1.5">
            <BarChart3 className="h-3 w-3" /> Contratos con Aumento
          </p>
          {isLoading ? (
            <div className="h-8 w-16 bg-renta-50 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-3xl font-bold text-renta-950 font-jakarta mt-1">
              {data?.total_contratos_con_aumento ?? 0}
            </p>
          )}
          <p className="text-xs text-renta-400 mt-1">de {proyecciones.length || '—'} contratos activos con regla</p>
        </div>

        {/* Incremento total en recaudación */}
        <div className="bg-white ring-1 ring-inset ring-admin-border border-transparent p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-renta-500 uppercase flex items-center gap-1.5">
            <ArrowUpRight className="h-3 w-3 text-emerald-500" /> Incremento en Recaudación
          </p>
          {isLoading ? (
            <div className="h-8 w-28 bg-emerald-50 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-3xl font-bold text-emerald-600 font-jakarta mt-1">
              +{formatCurrency(data?.total_incremento_recaudacion ?? 0)}
            </p>
          )}
          <p className="text-xs text-renta-400 mt-1">respecto al periodo anterior</p>
        </div>

        {/* Índices vigentes */}
        <div className="bg-white ring-1 ring-inset ring-admin-border border-transparent p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-renta-500 uppercase flex items-center gap-1.5">
            <Percent className="h-3 w-3 text-orange-500" /> Índices Vigentes
          </p>
          {isLoading ? (
            <div className="space-y-1 mt-1">
              <div className="h-5 w-24 bg-renta-50 animate-pulse rounded" />
              <div className="h-5 w-20 bg-renta-50 animate-pulse rounded" />
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              {Object.entries(data?.indices_vigentes ?? {}).length === 0 ? (
                <p className="text-sm text-renta-400">Sin índices cargados</p>
              ) : (
                Object.entries(data?.indices_vigentes ?? {}).map(([code, value]) => (
                  <div key={code} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-renta-600 uppercase">{code}</span>
                    <span className="text-sm font-bold text-renta-900">{value.toFixed(2)}%</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabla ── */}
      <div
        className="rounded-2xl ring-1 ring-inset ring-admin-border border-transparent bg-white shadow-sm overflow-hidden animate-fade-in-up"
        style={{ animationDelay: '150ms' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-inter">
            <thead className="bg-renta-50/50 text-renta-600 border-b border-admin-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Inquilino / Propiedad</th>
                <th className="px-6 py-4 font-semibold text-center">Tipo Aumento</th>
                <th className="px-6 py-4 font-semibold text-right">Alquiler Actual</th>
                <th className="px-6 py-4 font-semibold text-right">Porcentaje</th>
                <th className="px-6 py-4 font-semibold text-right">Alquiler Proyectado</th>
                <th className="px-6 py-4 font-semibold text-right">Diferencia</th>
                <th className="px-6 py-4 font-semibold text-center">Periodicidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border-subtle">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-4 w-36 bg-renta-50 rounded" />
                        <div className="h-3 w-28 bg-renta-50 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center"><div className="h-6 w-16 bg-renta-50 rounded-full mx-auto" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 w-20 bg-renta-50 rounded ml-auto" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 w-14 bg-renta-50 rounded ml-auto" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 w-20 bg-renta-50 rounded ml-auto" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 w-16 bg-emerald-50 rounded ml-auto" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-4 w-16 bg-renta-50 rounded mx-auto" /></td>
                  </tr>
                ))
              ) : proyecciones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-renta-200 mb-3" />
                    <p className="text-renta-500 font-medium">
                      No hay aumentos programados para {formatPeriodo(periodo)}.
                    </p>
                    <p className="text-xs text-renta-400 mt-1">
                      Los aumentos dependen de las reglas configuradas en cada contrato y su periodicidad.
                    </p>
                  </td>
                </tr>
              ) : (
                proyecciones.map((p) => {
                  const config = TIPO_AUMENTO_CONFIG[p.tipo_aumento] ?? TIPO_AUMENTO_CONFIG.PORCENTAJE_MANUAL;
                  return (
                    <tr key={p.contrato_id} className="hover:bg-admin-surface-hover transition-colors">
                      {/* Inquilino / Propiedad */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-renta-950">{p.inquilino_nombre}</div>
                        <div className="text-[11px] text-renta-500 mt-0.5">{p.detalle_propiedad}</div>
                      </td>

                      {/* Tipo Aumento Badge */}
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border',
                          config.color, config.bg, config.border
                        )}>
                          {config.label}
                          {p.indice_usado && <span className="opacity-60">({p.indice_usado})</span>}
                        </span>
                      </td>

                      {/* Monto Actual */}
                      <td className="px-6 py-4 text-right font-medium text-renta-700">
                        {formatCurrency(p.monto_actual)}
                      </td>

                      {/* Porcentaje Aplicado */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-renta-900">
                          +{p.porcentaje_aplicado.toFixed(2)}%
                        </span>
                      </td>

                      {/* Monto Proyectado */}
                      <td className="px-6 py-4 text-right font-bold text-renta-950">
                        {formatCurrency(p.monto_proyectado)}
                      </td>

                      {/* Diferencia */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-emerald-600">
                          +{formatCurrency(p.diferencia)}
                        </span>
                      </td>

                      {/* Periodicidad */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-medium text-renta-500 capitalize">
                          {p.periodicidad}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer con totales */}
        {!isLoading && proyecciones.length > 0 && (
          <div className="border-t border-admin-border bg-renta-50/40 px-6 py-3 flex justify-between items-center">
            <p className="text-xs text-renta-500 font-medium">
              {proyecciones.length} contrato{proyecciones.length !== 1 ? 's' : ''} con aumento en {formatPeriodo(periodo)}
            </p>
            <p className="text-sm font-bold text-emerald-600">
              +{formatCurrency(data?.total_incremento_recaudacion ?? 0)} / mes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
