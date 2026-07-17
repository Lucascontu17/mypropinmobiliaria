import { useState, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Minus, BarChart3, MapPin, Home, DollarSign, Percent, Trophy, Target, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AcmResult } from './CloseSaleModal';

interface AcmPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: AcmResult | null;
  isLoading: boolean;
  error?: string;
  onOpenCloseSale?: () => void;
}

function formatPrice(value: number, moneda: string = 'ARS'): string {
  const symbol = moneda === 'ARS' ? '$' : moneda === 'MXN' ? 'MX$' : 'US$';
  if (value >= 1_000_000) {
    return `${symbol} ${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${symbol} ${(value / 1_000).toFixed(1)}K`;
  }
  return `${symbol} ${value.toLocaleString('es-AR')}`;
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-gray-400';
}

function getScoreBg(score: number): string {
  if (score >= 75) return 'bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-gray-50 border-gray-200';
}

export function AcmPanel({ isOpen, onClose, data, isLoading, error, onOpenCloseSale }: AcmPanelProps) {
  const [selectedTestigo, setSelectedTestigo] = useState<string | null>(null);

  // Resetear selección cuando cambian los datos
  useMemo(() => {
    setSelectedTestigo(null);
  }, [data]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[80] bg-renta-950/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel lateral */}
      <div className="fixed inset-y-0 right-0 z-[90] w-full max-w-lg bg-white shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-jakarta font-bold text-renta-950">ACM</h2>
              <p className="text-[10px] text-renta-500 font-medium">Análisis Comparativo de Mercado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-renta-50 rounded-xl transition-colors"
          >
            <X className="h-4 w-4 text-renta-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold text-renta-600">Analizando el mercado...</p>
              <p className="text-xs text-renta-400">Buscando propiedades testigo similares</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-semibold text-red-700">Error al consultar ACM</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
            </div>
          )}

          {!data && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BarChart3 className="h-16 w-16 text-renta-200 mb-4" />
              <p className="text-sm font-semibold text-renta-600">Completá los datos de la propiedad</p>
              <p className="text-xs text-renta-400 mt-1 max-w-xs">
                Hacé clic en "Consultar ACM" para obtener un análisis del mercado basado en propiedades testigo similares.
              </p>
            </div>
          )}

          {data && !isLoading && (
            <>
              {/* Estadísticas principales */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 p-3 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Promedio</p>
                  <p className="text-lg font-bold text-emerald-900 mt-1">
                    {formatPrice(data.estadisticas.precio_promedio, data.metada.moneda)}
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Mediana</p>
                  <p className="text-lg font-bold text-amber-900 mt-1">
                    {formatPrice(data.estadisticas.precio_mediana, data.metada.moneda)}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">m² Promedio</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">
                    {formatPrice(data.estadisticas.precio_por_m2_promedio, data.metada.moneda)}
                  </p>
                </div>
              </div>

              {/* Rango recomendado */}
              {data.estadisticas.cantidad > 0 && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-2xl text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4" />
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Rango Recomendado</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-xs opacity-70">Desde</p>
                      <p className="text-2xl font-bold">{formatPrice(data.estadisticas.rango_recomendado.desde, data.metada.moneda)}</p>
                    </div>
                    <div className="text-3xl font-thin opacity-40">→</div>
                    <div className="text-center">
                      <p className="text-xs opacity-70">Hasta</p>
                      <p className="text-2xl font-bold">{formatPrice(data.estadisticas.rango_recomendado.hasta, data.metada.moneda)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen */}
              <div className="flex items-center justify-between text-xs text-renta-500 bg-renta-50 p-3 rounded-xl">
                <span className="font-semibold">{data.estadisticas.cantidad} propiedades testigo encontradas</span>
                <span className="font-bold">{data.metada.moneda}</span>
              </div>

              {/* Lista de testigos */}
              <div>
                <h3 className="text-sm font-bold text-renta-900 mb-3 flex items-center gap-2">
                  <Home className="h-4 w-4 text-renta-500" />
                  Propiedades Testigo
                </h3>
                
                {data.testigos.length === 0 && (
                  <p className="text-xs text-renta-400 text-center py-8">
                    No se encontraron propiedades testigo similares.
                  </p>
                )}

                <div className="space-y-2">
                  {data.testigos.slice(0, 10).map((testigo) => (
                    <button
                      key={testigo.uid_prop}
                      type="button"
                      onClick={() => setSelectedTestigo(
                        selectedTestigo === testigo.uid_prop ? null : testigo.uid_prop
                      )}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all",
                        selectedTestigo === testigo.uid_prop
                          ? "border-emerald-300 bg-emerald-50/50"
                          : "border-admin-border hover:border-renta-200 bg-white"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-renta-900 truncate">
                              {testigo.titulo || testigo.direccion || 'Propiedad'}
                            </p>
                            {testigo.score !== undefined && (
                              <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                                getScoreColor(testigo.score),
                                getScoreBg(testigo.score)
                              )}>
                                {testigo.score}%
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {testigo.barrio && (
                              <span className="text-[10px] text-renta-500 flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />{testigo.barrio}
                              </span>
                            )}
                            <span className="text-[10px] text-renta-400">{testigo.mts2} m²</span>
                            <span className="text-[10px] text-renta-400">{testigo.ambientes} amb.</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {(() => {
                            const valorVenta = parseFloat(testigo.valor_venta || '0');
                            const precioCierre = parseFloat(testigo.precio_cierre || '0');
                            const precioMostrar = precioCierre > 0 ? precioCierre : valorVenta;
                            return (
                              <p className="text-sm font-bold text-renta-950">
                                {formatPrice(precioMostrar, testigo.moneda)}
                              </p>
                            );
                          })()}
                          {testigo.precio_cierre && parseFloat(testigo.precio_cierre) > 0 && (
                            <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5 justify-end">
                              <ExternalLink className="h-2.5 w-2.5" /> Cierre real
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer con acción de cierre */}
        {data && !isLoading && data.estadisticas.cantidad > 0 && onOpenCloseSale && (
          <div className="px-6 py-4 border-t border-admin-border-subtle shrink-0">
            <button
              type="button"
              onClick={onOpenCloseSale}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-200 transition-all"
            >
              <Trophy className="h-4 w-4" />
              Aportar Cierre de Venta
            </button>
            <p className="text-[9px] text-renta-400 text-center mt-1.5 font-medium">
              Registrá el cierre de esta venta y sumá puntos para tu inmobiliaria
            </p>
          </div>
        )}
      </div>
    </>
  );
}
