import { useState, useMemo } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/common/Tooltip';
import { useApi } from '@/hooks/useApi';

interface AcmButtonProps {
  tipo_inmueble: string;
  operacion: string;
  barrio: string | null | undefined;
  ambientes: number;
  mts2: string;
  onResults: (data: any) => void;
  disabled?: boolean;
}

export function AcmButton({
  tipo_inmueble,
  operacion,
  barrio,
  ambientes,
  mts2,
  onResults,
  disabled
}: AcmButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { apiFetch } = useApi();

  const isEnabled = useMemo(() => {
    if (disabled) return false;
    if (!tipo_inmueble) return false;
    if (operacion !== 'venta') return false;
    if (!barrio || barrio.trim().length === 0) return false;
    if (!ambientes || ambientes < 1) return false;
    if (!mts2 || parseFloat(mts2) <= 0) return false;
    return true;
  }, [tipo_inmueble, operacion, barrio, ambientes, mts2, disabled]);

  const handleConsultar = async () => {
    if (!isEnabled || isLoading) return;

    setIsLoading(true);
    try {
      const response: any = await apiFetch('/admin/acm/consultar', {
        method: 'POST',
        body: JSON.stringify({
          tipo_inmueble,
          operacion,
          barrio,
          ambientes,
          mts2: parseFloat(mts2)
        })
      });

      if (response?.success && response?.data) {
        onResults(response.data);
      } else {
        console.error('[ACM] Error en consulta:', response?.error);
        onResults({ error: response?.error || 'Error al consultar el ACM' });
      }
    } catch (err: any) {
      console.error('[ACM] Error:', err);
      onResults({ error: err.message || 'Error de conexión' });
    } finally {
      setIsLoading(false);
    }
  };

  const button = (
    <button
      type="button"
      onClick={handleConsultar}
      disabled={!isEnabled || isLoading}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
        isEnabled && !isLoading
          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-200"
          : "bg-gray-100 text-gray-400 cursor-not-allowed"
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <BarChart3 className="h-4 w-4" />
      )}
      {isLoading ? 'Consultando...' : 'Consultar ACM'}
    </button>
  );

  return (
    <div className="space-y-1">
      {!isEnabled && !disabled ? (
        <Tooltip content="Completá los campos obligatorios (tipo, operación Venta, barrio, ambientes y superficie) para activar el ACM">
          {button}
        </Tooltip>
      ) : (
        button
      )}
      <p className="text-[10px] text-renta-400 font-medium leading-tight">
        ¿No sabés qué precio poner? Compará tu propiedad con inmuebles similares de la zona para definir el valor ideal de salida.
      </p>
    </div>
  );
}
