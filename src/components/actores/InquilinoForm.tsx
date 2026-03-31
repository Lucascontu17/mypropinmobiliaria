import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tenantSchema, type TenantFormValues } from '@/lib/validations/actores';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InquilinoFormProps {
  initialData?: TenantFormValues;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Formulario de Alta y Edición de Inquilinos.
 * Incluye campos string temporales para DNI URL y Contrato URL.
 */
export function InquilinoForm({ initialData, onSuccess, onCancel }: InquilinoFormProps) {
  const { inmobiliaria_id } = useInmobiliaria();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: initialData || {
      nombre: '',
      dni: '',
      celular: '',
      email: '',
      dni_url: '',
      contrato_url: ''
    }
  });

  const onSubmit = async (data: TenantFormValues) => {
    try {
      const payload = { ...data, inmobiliaria_id };
      console.log('Enviando Tenant -> ', JSON.stringify(payload));
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-inter bg-white p-6 rounded-2xl border border-admin-border shadow-sm">
      <div className="flex justify-between items-center border-b border-admin-border-subtle pb-4">
        <h2 className="text-xl font-bold font-jakarta text-renta-950">
          {initialData ? 'Editar Inquilino' : 'Nuevo Inquilino'}
        </h2>
        <p className="text-xs font-semibold text-renta-500 bg-renta-50 px-2.5 py-1 rounded-full border border-renta-200">
          * DNI Requerido Obligatorio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        
        {/* Nombre */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-renta-900">Inquilino <span className="text-red-500">*</span></label>
          <input
            {...register('nombre')}
            className={cn(
              "w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-1 transition-all text-renta-950",
              errors.nombre ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
            )}
            placeholder="Nombre completo"
          />
          {errors.nombre && <p className="text-xs text-red-500 font-medium">{errors.nombre.message}</p>}
        </div>

        {/* DNI */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-renta-900">DNI <span className="text-red-500">*</span></label>
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
            placeholder="inquilino@email.com"
          />
          {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
        </div>

        {/* Celular E164 */}
        <div className="space-y-1.5 md:col-span-2">
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

        {/* DNI URL */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-renta-900">Ruta / URL del DNI</label>
          <input
            {...register('dni_url')}
            className={cn(
              "w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-1 transition-all text-renta-950",
              errors.dni_url ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
            )}
            placeholder="https://storage..."
          />
          {errors.dni_url && <p className="text-xs text-red-500 font-medium">{errors.dni_url.message}</p>}
        </div>

        {/* Contrato URL */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-renta-900">Ruta / URL del Contrato</label>
          <input
            {...register('contrato_url')}
            className={cn(
              "w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-1 transition-all text-renta-950",
              errors.contrato_url ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
            )}
            placeholder="https://storage..."
          />
          {errors.contrato_url && <p className="text-xs text-red-500 font-medium">{errors.contrato_url.message}</p>}
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
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-renta-950 text-white text-sm font-semibold hover:bg-renta-800 disabled:opacity-50 transition-colors shadow-lg shadow-renta-950/20"
        >
          <Save className="h-4 w-4" /> Guardar Inquilino
        </button>
      </div>
    </form>
  );
}
