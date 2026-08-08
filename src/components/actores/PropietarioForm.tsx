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
    // @ts-expect-error - Eden Treaty dynamic path - Ignore type mismatch for coerced number in resolver
    resolver: zodResolver(ownerSchema),
    defaultValues: initialData ? sanitizeInitialData(initialData) : {
      nombre: '',
      dni: '',
      celular: '',
      email: '',
      cbu: '',
      client_number: '',
      comision_tipo: 'percent' as const,
      comision_valor: 0,
      password: '',
      clerk_id: '',
    }
  });

  // 🛡️ Sanitiza valores null/undefined de la API a string vacío para evitar que Zod rechace la validación
  function sanitizeInitialData(data: any): OwnerFormValues {
    const n = (v: any) => v ?? '';
    return {
      nombre: n(data.nombre),
      dni: n(data.dni),
      celular: n(data.celular),
      email: n(data.email),
      cbu: n(data.cbu),
      client_number: n(data.client_number),
      comision_tipo: data.commission_type || 'percent',
      comision_valor: data.commission_value ?? 0,
      password: n(data.password),
      clerk_id: n(data.clerk_id),
    };
  }

  const [searchCode, setSearchCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 🧠 Indicador real de "tiene cuenta Zonatia": clerk_id (no client_number)
  // client_number se asigna a TODOS los que tienen email, incluso sin cuenta real.
  // clerk_id solo existe cuando el usuario realmente se registró en Zonatia.
  // Por eso: si tiene clerk_id → NO se puede editar el email.
  // Si NO tiene clerk_id → se puede editar el email libremente.
  
  // 🧠 Inicializar sinCuenta según si el propietario YA tiene cuenta Zonatia o no
  // Si está en edición y no tiene clerk_id → no tiene cuenta → sinCuenta = true
  // Si está en creación → sinCuenta = false (se espera email por defecto)
  const [sinCuenta, setSinCuenta] = useState(
    initialData ? !(initialData as any)?.clerk_id : false
  );

  const handleSearchClient = async () => {
    if (!searchCode || searchCode.length < 3) {
      toast.error('Código inválido', { description: 'Ingrese al menos 3 caracteres.' });
      return;
    }

    setIsSearching(true);
    try {
      // @ts-expect-error - Eden Treaty dynamic path
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
      const ownerId = (initialData as any)?.id;
      // Construir payload base
      const basePayload: Record<string, any> = {
        nombre: data.nombre,
        dni: data.dni,
        celular: data.celular,
        cbu: data.cbu || undefined,
        commission_type: data.comision_tipo as any,
        commission_value: data.comision_valor ? Number(data.comision_valor) : undefined,
        client_number: data.client_number || undefined,
      };
      
      // Email: se envía siempre tal cual lo ingresó el usuario
      // El email puede cargarse incluso en "Solo Ficha" — la cuenta Clerk solo se crea si hay password
      basePayload.email = data.email || "";
      
      // sin_cuenta: se envía siempre (tanto en POST como PUT) para actualizar el estado de la cuenta
      basePayload.sin_cuenta = sinCuenta;
      
      // Password: obligatorio cuando NO está en modo "Sin cuenta" y se quiere crear/actualizar la cuenta
      // Se envía en POST y PUT (si se proporcionó una contraseña)
      if (!sinCuenta && data.password) {
        basePayload.password = data.password;
      }
      
      // Clerk ID no se envía, se usa solo como indicador local para deshabilitar el email

      const payload = basePayload;

      let response;
      let error;

      if (ownerId) {
        // Editar propietario existente
        // @ts-expect-error - Eden Treaty dynamic path
        const result = await eden.admin.owners[ownerId].put(payload);
        response = result.data;
        error = result.error;
      } else {
        // Enviar al endpoint de creación de owners (auto-genera cuenta global)
        // @ts-expect-error - Eden Treaty dynamic path
        const result = await eden.admin.owners.post(payload);
        response = result.data;
        error = result.error;
      }

      if (error) {
        throw new Error(error.value?.message || error.value?.error || 'Error al guardar propietario');
      }

      // 🚨 Advertir si se creó cuenta: el email queda bloqueado permanentemente
      const seCreoCuenta = !sinCuenta && data.password;
      const clientCode = response?.client_number;
      
      if (seCreoCuenta) {
        toast.success('Propietario Guardado — Cuenta Creada', {
          description: `${data.nombre} registrado con código ${clientCode || ''}. ⚠️ El email ${data.email} quedó vinculado permanentemente a la cuenta de Zonatia y NO podrá modificarse después.`,
          duration: 8000
        });
      } else {
        toast.success('Propietario Guardado', {
          description: sinCuenta 
            ? `${data.nombre} registrado como ficha local (sin cuenta Zonatia). Se le asignará un ID de cliente cuando se cree su cuenta.`
            : clientCode 
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
      console.error('Error guardando propietario: ', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 font-inter bg-white p-6 rounded-2xl ring-1 ring-inset ring-admin-border border-transparent shadow-sm">
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
              className="flex-1 rounded-xl ring-1 ring-inset ring-admin-border border-transparent px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-renta-200 uppercase"
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

          {/* Password — SOLO visible cuando NO está en "Sin cuenta" y NO tiene clerk_id */}
          {!sinCuenta && !watch('clerk_id') && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-renta-900">Contraseña</label>
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                className={cn(
                  "w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-1 transition-all text-renta-950",
                  errors.password ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
                )}
                placeholder="Mínimo 6 caracteres"
              />
              {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
              <p className="text-[10px] text-renta-400 font-medium italic">
                Al completar la contraseña se creará la cuenta de acceso del propietario en Zonatia.
                El propietario usará su email y esta contraseña para ingresar al panel de propietarios.
              </p>
            </div>
          )}

        {/* Email */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-renta-900">Email</label>
            {(!initialData || !(initialData as any)?.clerk_id) && (
              <div className="flex flex-col items-end gap-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={sinCuenta}
                    onChange={(e) => {
                      setSinCuenta(e.target.checked);
                      // NO se limpia el email — el usuario puede poner correo incluso en "Solo Ficha"
                    }}
                    className="rounded border-admin-border text-renta-900 focus:ring-renta-900"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-renta-500 group-hover:text-renta-900 transition-colors">
                    Sin cuenta (Solo Ficha)
                  </span>
                </label>
                {/* 📘 Texto explicativo: aclara la diferencia entre ficha y cuenta con acceso */}
                <div className={cn(
                  "text-[9px] leading-tight text-right max-w-[220px] px-2 py-1 rounded-md transition-all",
                  sinCuenta 
                    ? "bg-amber-50 text-amber-700 border border-amber-200" 
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                )}>
                  {sinCuenta 
                    ? "🟡 Solo guarda la ficha. No tendrá acceso al sistema. Se puede crear la cuenta después agregando una contraseña."
                    : "🟢 Se creará una cuenta con acceso. Complete la contraseña para habilitar el ingreso del propietario a Zonatia."
                  }
                </div>
              </div>
            )}
          </div>
          <input
            {...register('email')}
            type="email"
            disabled={!!watch('clerk_id')}
            className={cn(
              "w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-1 transition-all text-renta-950",
              !!watch('clerk_id') ? "bg-renta-50 text-renta-400 cursor-not-allowed border-admin-border-subtle" : 
              errors.email ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
            )}
            placeholder={sinCuenta ? "Email (opcional, solo ficha)" : "propietario@email.com"}
          />
          {!!watch('clerk_id') && (
            <p className="text-[10px] text-renta-400 font-medium italic">
              El email no puede modificarse una vez vinculado a una cuenta Zonatia.
            </p>
          )}
          {errors.email && !sinCuenta && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
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
            className="w-full rounded-xl ring-1 ring-inset ring-admin-border border-transparent bg-white px-4 py-2 text-sm focus:border-renta-300 focus:outline-none focus:ring-1 focus:ring-renta-200 text-renta-950"
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl ring-1 ring-inset ring-admin-border border-transparent bg-white text-sm font-semibold text-renta-700 hover:bg-renta-50 transition-colors"
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
