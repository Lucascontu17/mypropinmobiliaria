import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tenantSchema, type TenantFormValues } from '@/lib/validations/actores';
import { useInmobiliaria } from '../../hooks/useInmobiliaria';
import { useEden } from '@/services/eden';
import { toast } from 'sonner';
import { Save, X, AlertTriangle, Search, Link as LinkIcon, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CountryPhoneSelector } from '../common/CountryPhoneSelector';

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
  const { inmobiliaria_id, country_code } = useInmobiliaria();
  const { client: eden } = useEden();

  // 🛡️ BÚNKER GUARD (GRACEFUL DEGRADATION)
  // Bloquea el componente si no hay country_code, previniendo corrupción regional.
  const isRegionMissing = !country_code;

  const [isLinking, setIsLinking] = useState(false);
  const [foundClient, setFoundClient] = useState<any>(null);
  const [clientSearch, setClientSearch] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    control,
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

  const handleLookupClient = async () => {
    if (!clientSearch) return;
    setIsLinking(true);
    try {
      // @ts-ignore
      const { data, error } = await eden.clients.lookup[clientSearch].get();
      
      if (error) throw new Error('Cliente no encontrado en la plataforma global');

      setFoundClient(data);
      setValue('nombre', data.nombre);
      setValue('email', data.email || '');
      setValue('celular', data.celular || '');
      if (data.dni) setValue('dni', data.dni);

      toast.success('Cliente Localizado', {
        description: `Se han cargado los datos de ${data.nombre} vinculados al ID #${data.client_number}`
      });
    } catch (err: any) {
      toast.error('Error de Búsqueda', { description: err.message });
    } finally {
      setIsLinking(false);
    }
  };

  const onSubmit = async (data: TenantFormValues) => {
    if (isRegionMissing) {
      toast.error('Error Regional', {
        description: 'La inmobiliaria no tiene un país asignado. Contacte a soporte.'
      });
      return;
    }

    try {
      if (foundClient) {
        // 🚀 LINKING FLOW: Promocionar Cliente Global a Inquilino Activo
        // @ts-ignore
        const { error } = await eden.clients.activate[foundClient.id].patch({
          inmobiliaria_id: inmobiliaria_id!,
          dni: data.dni
        });

        if (error) throw new Error('No se pudo vincular el cliente global.');

        toast.success('Cliente Vinculado', {
          description: `${data.nombre} ahora es inquilino activo de tu inmobiliaria.`
        });
      } else {
        // 🚨 STANDARD FLOW: Crear inquilino desde cero (auto-genera cuenta global)
        // @ts-ignore
        const { data: response, error } = await eden.admin.inquilinos.post({
          nombre: data.nombre,
          email: data.email || undefined,
          celular: data.celular || undefined,
          dni: data.dni || undefined
        });

        if (error) throw new Error(error.value?.message || error.value?.error || 'Error al crear inquilino');

        const clientCode = response?.client_number;
        toast.success('Inquilino Guardado', {
          description: clientCode
            ? `${data.nombre} registrado con código ${clientCode}.`
            : `${data.nombre} ha sido registrado con éxito.`,
          duration: 6000
        });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Error de Guardado', {
        description: error instanceof Error ? error.message : 'No se pudo procesar la solicitud.'
      });
      console.error('Error: ', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-inter bg-white p-6 rounded-2xl border border-admin-border shadow-sm">
      <div className="flex justify-between items-center border-b border-admin-border-subtle pb-4">
        <h2 className="text-xl font-bold font-jakarta text-renta-950">
          {initialData ? 'Editar Inquilino' : 'Nuevo Inquilino'}
        </h2>
        <div className="flex gap-2">
          {foundClient && (
            <span className="text-[10px] font-black text-white bg-emerald-600 px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase">
              <UserCheck className="w-3 h-3" /> Vinculado a #{foundClient.client_number}
            </span>
          )}
          <p className="text-xs font-semibold text-renta-500 bg-renta-50 px-2.5 py-1 rounded-full border border-renta-200">
            * DNI Requerido Obligatorio
          </p>
        </div>
      </div>

      {/* Zonatia Global Lookup */}
      {!initialData && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <LinkIcon className="w-3 h-3" /> Vincular desde Plataforma Zonatia
          </label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Ej: 001"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-renta-500"
            />
            <button 
              type="button"
              onClick={handleLookupClient}
              disabled={isLinking}
              className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              {isLinking ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>
          </div>
          <p className="text-[10px] text-slate-400">Si el inquilino ya se registró en la landing page, ingrese su número de cliente para importar sus datos.</p>
        </div>
      )}

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
          <Controller
            name="celular"
            control={control}
            render={({ field: { value, onChange } }) => (
              <CountryPhoneSelector
                value={value}
                onChange={onChange}
              />
            )}
          />
          {errors.celular && <p className="text-xs text-red-500 font-medium">{errors.celular.message}</p>}
        </div>

        {/* DNI Upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-renta-900">DNI Adjunto (Frente y Dorso)</label>
          <input
            {...register('dni_url')}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className={cn(
              "w-full rounded-xl border border-admin-border bg-white pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-renta-200 transition-all text-renta-950 file:mr-4 file:-my-1.5 file:py-2.5 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-renta-100 file:text-renta-700 hover:file:bg-renta-200 file:cursor-pointer",
              errors.dni_url ? "border-red-400" : ""
            )}
          />
          {errors.dni_url && <p className="text-xs text-red-500 font-medium">{errors.dni_url.message as string}</p>}
        </div>

        {/* Contrato Upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-renta-900">Contrato Firmado</label>
          <input
            {...register('contrato_url')}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className={cn(
              "w-full rounded-xl border border-admin-border bg-white pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-renta-200 transition-all text-renta-950 file:mr-4 file:-my-1.5 file:py-2.5 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-renta-100 file:text-renta-700 hover:file:bg-renta-200 file:cursor-pointer",
              errors.contrato_url ? "border-red-400" : ""
            )}
          />
          {errors.contrato_url && <p className="text-xs text-red-500 font-medium">{errors.contrato_url.message as string}</p>}
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
              <Save className="h-4 w-4" /> Guardar Inquilino
            </>
          )}
        </button>
      </div>
    </form>
  );
}
