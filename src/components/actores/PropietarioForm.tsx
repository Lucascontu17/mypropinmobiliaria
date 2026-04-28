import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ownerSchema, type OwnerFormValues } from '@/lib/validations/actores';
import { useInmobiliaria } from '../../hooks/useInmobiliaria';
import { useEden } from '@/services/eden';
import { toast } from 'sonner';
import { Save, X, AlertTriangle, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountryPhoneSelector } from '../common/CountryPhoneSelector';

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
  const { client: eden } = useEden();

  // 🛡️ BÚNKER GUARD (GRACEFUL DEGRADATION)
  // Bloquea el componente si no hay country_code, previniendo corrupción regional.
  const isRegionMissing = !country_code;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    setValue
  } = useForm<OwnerFormValues>({
    // @ts-ignore - Ignore type mismatch for coerced number in resolver
    resolver: zodResolver(ownerSchema),
    defaultValues: initialData ? {
      ...initialData,
      comision_tipo: (initialData as any).commission_type || 'percent',
      comision_valor: (initialData as any).commission_value || 0
    } : {
      nombre: '',
      dni: '',
      celular: '',
      email: '',
      cbu: '',
      client_number: '',
      comision_tipo: 'percent',
      comision_valor: 0
    }
  });

  const [searchCode, setSearchCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchClient = async () => {
    if (!searchCode || searchCode.length < 3) {
      toast.error('Código inválido', { description: 'Ingrese al menos 3 caracteres.' });
      return;
    }

    setIsSearching(true);
    try {
      // @ts-ignore
      const { data, error } = await eden.admin.clients.search[searchCode].get();
      
      if (error || !data.success) {
        throw new Error(error?.value?.error || data?.error || 'Cliente no encontrado');
      }

      const client = data.data;
      
      // Auto-completar campos
      setValue('nombre', client.nombre);
      setValue('email', client.email);
      setValue('celular', client.celular);
      setValue('dni', client.dni || '');
      setValue('client_number', client.client_number);

      toast.success('Cliente Encontrado', {
        description: `Se han cargado los datos de ${client.nombre}.`
      });
    } catch (err: any) {
      toast.error('Búsqueda fallida', { description: err.message });
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = async (data: OwnerFormValues) => {
    if (isRegionMissing) {
      toast.error('Error Regional', {
        description: 'La inmobiliaria no tiene un país asignado. Contacte a soporte.'
      });
      return;
    }

    try {
      const payload = {
        nombre: data.nombre,
        email: data.email,
        dni: data.dni,
        celular: data.celular,
        cbu: data.cbu || undefined,
        commission_type: data.comision_tipo as any,
        commission_value: data.comision_valor ? Number(data.comision_valor) : undefined,
        client_number: data.client_number || undefined
      };

      const ownerId = (initialData as any)?.id;
      let response;
      let error;

      if (ownerId) {
        // Editar propietario existente
        // @ts-ignore
        const result = await eden.admin.owners[ownerId].put(payload);
        response = result.data;
        error = result.error;
      } else {
        // Enviar al endpoint de creación de owners (auto-genera cuenta global)
        // @ts-ignore
        const result = await eden.admin.owners.post(payload);
        response = result.data;
        error = result.error;
      }

      if (error) {
        throw new Error(error.value?.message || error.value?.error || 'Error al guardar propietario');
      }

      const clientCode = response?.client_number;
      toast.success('Propietario Guardado', {
        description: clientCode 
          ? `${data.nombre} registrado con código ${clientCode}.`
          : `${data.nombre} ha sido registrado con éxito.`,
        duration: 6000
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

      {/* 🔍 Global Client Search (Only for New Owners) */}
      {!initialData && (
        <div className="bg-renta-50/50 p-4 rounded-xl border border-renta-100 space-y-3">
          <div className="flex items-center gap-2 text-renta-900 font-bold text-sm">
            <Search className="h-4 w-4" /> Importar Cliente Zonatia
          </div>
          <p className="text-[10px] text-renta-600 font-medium uppercase tracking-wider">
            Si el propietario ya tiene cuenta en Zonatia, ingrese su 'ID CLIENTE' para importar sus datos.
          </p>
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="Ej: AR001"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              className="flex-1 rounded-xl border border-admin-border px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-renta-200 uppercase"
            />
            <button
              type="button"
              onClick={handleSearchClient}
              disabled={isSearching}
              className="bg-renta-950 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-renta-800 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      )}

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
            disabled={!!initialData || !!watch('client_number')}
            className={cn(
              "w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-1 transition-all text-renta-950",
              (!!initialData || !!watch('client_number')) ? "bg-renta-50 text-renta-400 cursor-not-allowed border-admin-border-subtle" : 
              errors.email ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
            )}
            placeholder="propietario@email.com"
          />
          {(!!initialData || !!watch('client_number')) && (
            <p className="text-[10px] text-renta-400 font-medium italic">
              El email no puede modificarse una vez vinculado a una cuenta Zonatia.
            </p>
          )}
          {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
        </div>

        {/* Celular E164 */}
        <div className="space-y-1.5">
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
