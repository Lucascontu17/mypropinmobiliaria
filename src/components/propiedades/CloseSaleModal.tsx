import { useState } from 'react';
import { X, Trophy, Loader2, CheckCircle2, DollarSign, Sparkles, UserPlus, Home, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { NumericInput } from '@/components/common/NumericInput';
import { toast } from 'sonner';

// Type shared between AcmPanel and CloseSaleModal
export interface AcmResult {
  testigos: AcmTestigo[];
  estadisticas: AcmEstadisticas;
  metada: AcmMetadata;
}

export interface AcmTestigo {
  uid_prop: string;
  titulo: string | null;
  direccion: string | null;
  barrio: string | null;
  mts2: string;
  ambientes: number;
  valor_venta: string | null;
  precio_cierre: string | null;
  moneda: string;
  antiguedad: number | null;
  habitaciones: number | null;
  banos: number | null;
  cocheras: number | null;
  piso: string | null;
  tipo_inmueble: string;
  status: string;
  distancia_m2?: number;
  score?: number;
}

export interface AcmEstadisticas {
  cantidad: number;
  precio_promedio: number;
  precio_mediana: number;
  precio_minimo: number;
  precio_maximo: number;
  rango_recomendado: {
    desde: number;
    hasta: number;
  };
  precio_por_m2_promedio: number;
}

export interface AcmMetadata {
  moneda: string;
  consulta: {
    tipo_inmueble: string;
    operacion: string;
    barrio: string;
    ambientes: number;
    mts2: number;
  };
}

interface CloseSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  propiedadId: string;
  acmData: AcmResult | null;
  onCierreExitoso?: (data: { puntos_otorgados: number; nuevo_balance: number }) => void;
  /** Lista de propietarios para ofrecer gestión de alquiler post-venta */
  owners?: { id: string; nombre: string }[];
  /** Moneda de la propiedad (para el precio de alquiler) */
  moneda?: string;
}

export function CloseSaleModal({
  isOpen,
  onClose,
  propiedadId,
  acmData,
  onCierreExitoso,
  owners = [],
  moneda: propMoneda,
}: CloseSaleModalProps) {
  const { apiFetch } = useApi();
  const [precioCierre, setPrecioCierre] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultado, setResultado] = useState<{
    puntos_otorgados: number;
    nuevo_balance: number;
  } | null>(null);

  // Estado para el flujo de "ofrecer gestión de alquiler"
  const [paso, setPaso] = useState<'cierre' | 'resultado' | 'oferta'>('cierre');
  const [quiereAlquiler, setQuiereAlquiler] = useState<boolean | null>(null);
  const [nuevoPropietarioId, setNuevoPropietarioId] = useState('');
  const [precioAlquiler, setPrecioAlquiler] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [alquilerConfirmado, setAlquilerConfirmado] = useState(false);

  const moneda = acmData?.metada.moneda || propMoneda || 'ARS';
  const mediana = acmData?.estadisticas.precio_mediana || 0;

  const handleSubmit = async () => {
    if (!precioCierre || parseFloat(precioCierre) <= 0) {
      toast.error('Ingresá un precio de cierre válido');
      return;
    }

    setIsSubmitting(true);
    try {
      const response: any = await apiFetch('/admin/acm/aportar-cierre', {
        method: 'POST',
        body: JSON.stringify({
          propiedad_id: propiedadId,
          precio_cierre: parseFloat(precioCierre),
        }),
      });

      if (response?.success && response?.data) {
        setResultado(response.data);
        if (onCierreExitoso) {
          onCierreExitoso(response.data);
        }
        toast.success('¡Cierre de venta registrado con éxito!', {
          icon: <Trophy className="h-4 w-4 text-yellow-500" />,
        });
        // Avanzar al paso de preguntar por alquiler
        setPaso('resultado');
      } else {
        toast.error(response?.error || 'Error al registrar el cierre');
      }
    } catch (err: any) {
      toast.error('Error de conexión: ' + (err.message || 'Intente nuevamente'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmarAlquiler = async () => {
    if (!nuevoPropietarioId) {
      toast.error('Seleccioná el nuevo propietario');
      return;
    }
    if (!precioAlquiler || parseFloat(precioAlquiler) <= 0) {
      toast.error('Ingresá un valor de alquiler válido');
      return;
    }

    setIsUpdating(true);
    try {
      // Actualizar la propiedad: cambiar owner, pasar a ALQUILER/DISPONIBLE
      const response: any = await apiFetch(`/admin/propiedades/${propiedadId}`, {
        method: 'PUT',
        body: JSON.stringify({
          owner_id: nuevoPropietarioId,
          operacion: 'alquiler',
          status: 'DISPONIBLE',
          valor_alquiler: parseFloat(precioAlquiler).toString(),
        }),
      });

      if (response?.success !== false) {
        setAlquilerConfirmado(true);
        toast.success('La propiedad ahora está disponible en alquiler con el nuevo dueño', {
          icon: <Home className="h-4 w-4 text-green-500" />,
        });
      } else {
        toast.error(response?.error || 'Error al actualizar la propiedad');
      }
    } catch (err: any) {
      toast.error('Error de conexión: ' + (err.message || 'Intente nuevamente'));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-renta-950/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-slide-up overflow-hidden">
          
          {/* ── PASO 1: FORMULARIO DE CIERRE ── */}
          {paso === 'cierre' && (
            <>
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-jakarta font-bold">Aportar Cierre de Venta</h2>
                      <p className="text-xs text-white/80">Registrá el cierre y sumá puntos</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Información del ACM */}
                {acmData && (
                  <div className="bg-renta-50 p-4 rounded-2xl space-y-2">
                    <p className="text-[10px] font-bold text-renta-500 uppercase tracking-wider">
                      Referencia de Mercado (ACM)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] text-renta-400 font-medium">Precio Mediana</p>
                        <p className="text-sm font-bold text-renta-900">
                          {moneda === 'ARS' ? '$' : moneda === 'MXN' ? 'MX$' : 'US$'}
                          {' '}
                          {mediana.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-renta-400 font-medium">Rango Recomendado</p>
                        <p className="text-sm font-bold text-renta-900">
                          {moneda === 'ARS' ? '$' : moneda === 'MXN' ? 'MX$' : 'US$'}
                          {' '}
                          {acmData.estadisticas.rango_recomendado.desde.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                          {' — '}
                          {acmData.estadisticas.rango_recomendado.hasta.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input de precio de cierre */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-renta-900 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Precio de Cierre Real
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-sm text-renta-500 font-bold z-10">
                      {moneda === 'ARS' ? '$' : moneda === 'MXN' ? 'MX$' : 'US$'}
                    </span>
                    <NumericInput
                      placeholder="0.00"
                      value={precioCierre}
                      onChange={(val) => setPrecioCierre(val)}
                      className="w-full rounded-2xl border-2 border-emerald-200 bg-emerald-50/30 pl-12 pr-4 py-3 text-lg font-bold text-renta-950 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-renta-400 font-medium">
                    Ingresá el monto final por el que se vendió la propiedad
                  </p>
                </div>

                {/* Info de puntos */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-2xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      Gamificación
                    </p>
                  </div>
                  <div className="space-y-1.5 text-xs text-amber-700">
                    <p>
                      ✓ <strong>+100 puntos base</strong> por aportar cierre
                    </p>
                    <p>
                      ✓ <strong>+1 punto</strong> por cada {moneda === 'ARS' ? '$' : moneda === 'MXN' ? 'MX$' : 'US$'}1.000 de precio
                    </p>
                    <p className="text-[10px] text-amber-500 pt-1">
                      Los puntos acumulados desbloquean beneficios en el Marketplace de Zonatia.
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl ring-1 ring-inset ring-admin-border border-transparent bg-white text-sm font-semibold text-renta-700 hover:bg-renta-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !precioCierre || parseFloat(precioCierre) <= 0}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Trophy className="h-4 w-4" />
                        Aportar Cierre
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── PASO 2: ÉXITO + OFERTA DE ALQUILER ── */}
          {(paso === 'resultado' || paso === 'oferta') && resultado && (
            <>
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-jakarta font-bold">¡Cierre Registrado!</h2>
                      <p className="text-xs text-white/80">La propiedad fue marcada como VENDIDA</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Puntos ganados */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl border border-amber-200 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <p className="text-sm font-bold text-amber-800 uppercase tracking-wider">
                      Puntos Ganados
                    </p>
                  </div>
                  <p className="text-4xl font-black text-amber-600">
                    +{resultado.puntos_otorgados}
                  </p>
                  <p className="text-xs text-amber-500 mt-1 font-medium">
                    Nuevo balance: {resultado.nuevo_balance} puntos
                  </p>
                </div>

                {/* Pregunta: ¿Gestionar alquiler? */}
                {paso === 'resultado' && quiereAlquiler === null && (
                  <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 space-y-4">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-blue-600" />
                      <p className="text-sm font-bold text-blue-900">
                        ¿El nuevo dueño quiere poner esta propiedad en alquiler con ustedes?
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setQuiereAlquiler(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Sí, gestionar alquiler
                      </button>
                      <button
                        onClick={() => setQuiereAlquiler(false)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl ring-1 ring-inset ring-admin-border border-transparent bg-white text-sm font-semibold text-renta-600 hover:bg-renta-50 transition-colors"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        No, gracias
                      </button>
                    </div>
                  </div>
                )}

                {/* ── PASO 3: FORMULARIO DE ALQUILER ── */}
                {(paso === 'oferta' || quiereAlquiler === true) && !alquilerConfirmado && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-renta-50 p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-renta-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <UserPlus className="h-3 w-3" /> Datos del nuevo alquiler
                      </p>

                      {/* Selector de nuevo propietario */}
                      <div className="space-y-1.5 mb-4">
                        <label className="text-[11px] font-bold text-renta-700 uppercase">
                          Nuevo Propietario (Comprador)
                        </label>
                        <select
                          value={nuevoPropietarioId}
                          onChange={(e) => setNuevoPropietarioId(e.target.value)}
                          className="w-full rounded-xl ring-1 ring-inset ring-admin-border border-transparent bg-white px-4 py-2.5 text-sm text-renta-950 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        >
                          <option value="">-- Seleccionar --</option>
                          {owners.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.nombre || 'Sin nombre'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Precio de alquiler */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-renta-700 uppercase">
                          Valor de Alquiler Inicial
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-renta-500 font-bold z-10">
                            {moneda === 'ARS' ? '$' : moneda === 'MXN' ? 'MX$' : 'US$'}
                          </span>
                          <NumericInput
                            placeholder="0.00"
                            value={precioAlquiler}
                            onChange={(val) => setPrecioAlquiler(val)}
                            className="w-full rounded-xl ring-1 ring-inset ring-admin-border border-transparent bg-white pl-10 pr-4 py-2.5 text-sm font-bold text-renta-950 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                          />
                        </div>
                      </div>

                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-start gap-2 mt-4">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-emerald-800 leading-tight">
                          La propiedad quedará como <strong>DISPONIBLE</strong> en modo <strong>ALQUILER</strong> con el nuevo propietario.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          setQuiereAlquiler(null);
                          setPaso('resultado');
                        }}
                        className="flex-1 py-3 rounded-xl ring-1 ring-inset ring-admin-border border-transparent bg-white text-sm font-semibold text-renta-600 hover:bg-renta-50 transition-colors"
                      >
                        Volver
                      </button>
                      <button
                        onClick={handleConfirmarAlquiler}
                        disabled={isUpdating || !nuevoPropietarioId || !precioAlquiler || parseFloat(precioAlquiler) <= 0}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Home className="h-4 w-4" />
                            Poner en Alquiler
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirmación final: alquiler activado */}
                {alquilerConfirmado && (
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-jakarta font-bold text-renta-950">
                        ¡Todo listo!
                      </h3>
                      <p className="text-sm text-renta-500 mt-1">
                        La propiedad ya está disponible en alquiler con el nuevo dueño.
                      </p>
                    </div>
                  </div>
                )}

                {/* Botón de cerrar (cuando ya no hay más acciones) */}
                {(alquilerConfirmado || quiereAlquiler === false) && (
                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-renta-950 text-white text-sm font-bold hover:bg-renta-800 transition-colors"
                  >
                    Cerrar
                  </button>
                )}

                {/* Separador y resumen */}
                <div className="bg-renta-50 p-4 rounded-xl text-xs text-renta-500">
                  <p className="font-semibold">
                    Seguí aportando cierres para subir en el ranking y desbloquear beneficios exclusivos para tu inmobiliaria.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
