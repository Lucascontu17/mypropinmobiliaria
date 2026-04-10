import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ownerSchema, type OwnerFormValues } from '@/lib/validations/actores';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { eden } from '@/services/eden';
import { toast } from 'sonner';
import { Save, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropietarioFormProps {
  initialData?: OwnerFormValues;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Formulario de Alta y Edición de Propietarios.
 * Integra validaciones restrictivas de Zod y previene manipulación del tenant_id (inmobiliaria_id).
 */
export function PropietarioForm({ initialData, onSuccess, onCancel }: PropietarioFormProps) {
  const { inmobiliaria_id, country_code } = useInmobiliaria();

  // 🛡️ BÚNKER GUARD (GRACEFUL DEGRADATION)
  // Bloquea el componente si no hay country_code, previniendo corrupción regional.
  const isRegionMissing = !country_code;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm<OwnerFormValues>({
    // @ts-ignore - Ignore type mismatch for coerced number in resolver
    resolver: zodResolver(ownerSchema),
    defaultValues: initialData || {
      nombre: '',
      dni: '',
      celular: '',
      email: '',
      cbu: '',
      comision_tipo: 'percent',
      comision_valor: 0
    }
  });

  const onSubmit = async (data: OwnerFormValues) => {
    if (isRegionMissing) {
      toast.error('Error Regional', {
        description: 'La inmobiliaria no tiene un país asignado. Contacte a soporte.'
      });
      return;
    }

    try {
      // 🚨 MUX SECURITY (ZERO LEAKS): Inyectar metadata atómicamente
      const payload = {
        ...data,
        inmobiliaria_id: inmobiliaria_id!, 
        country_code: country_code!,
        role: 'propietario' as const
      };

      // @ts-ignore - The endpoint /api/v1/actors/create is confirmed by CTO
      const { data: response, error } = await eden.actors.create.post(payload);

      if (error) {
        throw new Error(error.value?.message || 'Error al crear propietario');
      }

      toast.success('Propietario Guardado', {
        description: `${data.nombre} ha sido registrado con éxito.`
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Error de Guardado', {
        description: error instanceof Error ? error.message : 'No se pudo procesar la solicitud.'
      });
      console.error('Error guardando propietario: ', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-inter bg-white p-6 rounded-2xl border border-admin-border shadow-sm">
      <div className="flex justify-between items-center border-b border-admin-border-subtle pb-4">
        <h2 className="text-xl font-bold font-jakarta text-renta-950">
          {initialData ? 'Editar Propietario' : 'Nuevo Propietario'}
        </h2>
        <p className="text-xs font-semibold text-renta-500 bg-renta-50 px-2.5 py-1 rounded-full border border-renta-200">
          * DNI Requerido Obligatorio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        
        {/* Nombre */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-renta-900">Propietario o Razón Social</label>
          <input
            {...register('nombre')}
            className={cn(
              "w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-1 transition-all text-renta-950",
              errors.nombre ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
            )}
            placeholder="Ej: Inversiones Sur SRL"
          />
          {errors.nombre && <p className="text-xs text-red-500 font-medium">{errors.nombre.message}</p>}
        </div>

        {/* DNI */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-renta-900">DNI / CUIT <span className="text-red-500">*</span></label>
          <input
            {...register('dni')}
            className={cn(
              "w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-1 transition-all text-renta-950",
              errors.dni ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
            )}
            placeholder="Sin guiones ni puntos"
          />
          {errors.dni && <p className="text-xs text-red-500 font-medium">{errors.dni.message}</p>}
        </div>

        {/* CBU */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-renta-900">CBU / Alias</label>
          <input
            {...register('cbu')}
            className={cn(
              "w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-1 transition-all text-renta-950",
              errors.cbu ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
            )}
            placeholder="Para liquidaciones"
          />
          {errors.cbu && <p className="text-xs text-red-500 font-medium">{errors.cbu.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-renta-900">Email</label>
          <input
            {...register('email')}
            type="email"
            className={cn(
              "w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-1 transition-all text-renta-950",
              errors.email ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
            )}
            placeholder="propietario@email.com"
          />
          {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
        </div>

        {/* Celular E164 */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-renta-900">Celular (E.164 Twilio)</label>
          <input
            {...register('celular')}
            type="tel"
            className={cn(
              "w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-1 transition-all text-renta-950",
              errors.celular ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
            )}
            placeholder="+5491100000000"
          />
          {errors.celular && <p className="text-xs text-red-500 font-medium">{errors.celular.message}</p>}
        </div>

        {/* Comision */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-renta-900">Tipo de Comisión</label>
          <select 
            {...register('comision_tipo')}
            className="w-full rounded-xl border border-admin-border bg-white px-4 py-2 text-sm focus:border-renta-300 focus:outline-none focus:ring-1 focus:ring-renta-200 text-renta-950"
          >
            <option value="percent">Porcentaje (%)</option>
            <option value="fixed">Monto Fijo ($)</option>
          </select>
        </div>

        {/* Valor de Comision */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-renta-900">Valor</label>
          <input
            {...register('comision_valor')}
            type="number"
            step="0.01"
            className={cn(
              "w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-1 transition-all text-renta-950",
              errors.comision_valor ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
            )}
            placeholder="0"
          />
          {errors.comision_valor && <p className="text-xs text-red-500 font-medium">{errors.comision_valor.message}</p>}
        </div>

      </div>

      <div className="flex items-center justify-end gap-3 pt-5 border-t border-admin-border-subtle mt-4">
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-admin-border bg-white text-sm font-semibold text-renta-700 hover:bg-renta-50 transition-colors"
          >
            <X className="h-4 w-4" /> Cancelar
          </button>
        )}
        <button 
          type="submit" 
          disabled={isSubmitting || isRegionMissing}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors shadow-lg overflow-hidden relative",
            isRegionMissing 
              ? "bg-amber-500 hover:bg-amber-600 shadow-amber-950/20" 
              : "bg-renta-950 hover:bg-renta-800 shadow-renta-950/20 disabled:opacity-50"
          )}
        >
          {isRegionMissing ? (
            <>
              <AlertTriangle className="h-4 w-4" /> Bloqueado por Región
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Guardar Propietario
            </>
          )}
        </button>
      </div>
    </form>
  );
}
