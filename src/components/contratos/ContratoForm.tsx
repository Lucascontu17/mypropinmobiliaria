import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useEden } from '@/services/eden';
import { toast } from 'sonner';
import { Save, X, FileText, Calendar, Building, User, TrendingUp, AlertTriangle, Info, Search, Link as LinkIcon, UserCheck } from 'lucide-react';
import { useForm, FormProvider, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contratoSchema, type ContratoFormData } from '@/types/contrato';
import { useInmobiliaria } from '../../hooks/useInmobiliaria';
import { CountryPhoneSelector } from '../common/CountryPhoneSelector';
import { useRegion } from '@/hooks/useRegion';

interface ContratoFormProps {
  propiedadesDisponibles: { uid_prop: string; direccion: string; valor_alquiler?: string | number }[];
  inquilinosSeleccionables: { uid_inq: string; nombre: string; dni: string }[];
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

export function ContratoForm({ propiedadesDisponibles, inquilinosSeleccionables, onCancel, onSubmitSuccess }: ContratoFormProps) {
  const { inmobiliaria_id, country_code } = useInmobiliaria();
  const { config } = useRegion();
  const { client: eden } = useEden();
  const navigate = useNavigate();

  const [isLinking, setIsLinking] = useState(false);
  const [foundClient, setFoundClient] = useState<any>(null);
  const [clientSearch, setClientSearch] = useState('');

  const methods = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      inmobiliaria_id: inmobiliaria_id || '',
      uid_propiedad: '',
      is_nuevo_inquilino: false,
      uid_inquilino: '',
      nuevo_inquilino: {
        nombre: '',
        dni: '',
        email: '',
        celular: '',
      },
      fecha_inicio: '',
      fecha_fin: '',
      monto_inicial: 0,
      pago_mes_curso: false,
      reglas_aumento: {
        aplicar_aumento: false,
      },
      reglas_mora: {
        aplicar_mora: false,
        dias_gracia: 5,
        periodicidad: 'diario'
      }
    }
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, control, setValue, watch } = methods;

  const isNuevoInquilino = useWatch({ control, name: 'is_nuevo_inquilino' });
  const selectedUidPropiedad = watch('uid_propiedad');

  // Auto-completar el valor del alquiler cuando se selecciona una propiedad
  useEffect(() => {
    if (selectedUidPropiedad) {
      const prop = propiedadesDisponibles.find(p => p.uid_prop === selectedUidPropiedad);
      if (prop && prop.valor_alquiler) {
        setValue('monto_inicial', Number(prop.valor_alquiler), { shouldValidate: true });
      }
    }
  }, [selectedUidPropiedad, propiedadesDisponibles, setValue]);

  const handleLookupClient = async () => {
    if (!clientSearch) return;
    setIsLinking(true);
    try {
      // @ts-ignore
      const { data, error } = await eden.admin.clients.search[clientSearch].get();
      
      if (error || !data?.success) {
        throw new Error(error?.value?.error || data?.error || 'Cliente no encontrado');
      }

      const client = data.data;
      setFoundClient(client);
      setValue('nuevo_inquilino.nombre', client.nombre);
      setValue('nuevo_inquilino.email', client.email || '');
      setValue('nuevo_inquilino.celular', client.celular || '');
      if (client.dni) setValue('nuevo_inquilino.dni', client.dni);
      setValue('nuevo_inquilino.client_number', client.client_number);

      toast.success('Cliente Localizado', {
        description: `Se han cargado los datos de ${client.nombre}`
      });
    } catch (err: any) {
      toast.error('Error de Búsqueda', { description: err.message });
    } finally {
      setIsLinking(false);
    }
  };

  const onSubmit = async (data: ContratoFormData) => {
    console.group('🚀 [CONTRATO-DEBUG] Iniciando Transacción Atómica');
    console.log('📦 Form Data:', data);
    console.log('🏢 Inmobiliaria ID:', inmobiliaria_id);
    
    try {
      let finalUidInquilino = data.uid_inquilino;

      if (data.is_nuevo_inquilino && data.nuevo_inquilino) {
        console.log('👤 Procesando Inquilino Nuevo/Global...');
        
        if (foundClient) {
          console.log('🔗 Vinculando Cliente Global Existente:', foundClient.id);
          // @ts-ignore
          const { data: linkData, error: linkError } = await eden.admin.clients.activate[foundClient.id].patch({
            inmobiliaria_id: inmobiliaria_id!,
            dni: data.nuevo_inquilino.dni
          });

          if (linkError) {
            console.error('❌ [VINCULACIÓN-ERROR]', {
              status: linkError.status,
              value: linkError.value,
              msg: linkError.statusText
            });
            const serverMsg = linkError.value?.error || linkError.value?.message || linkError.statusText || 'Error de conexión (500)';
            throw new Error(`Error ${linkError.status}: ${serverMsg}`);
          }
          
          console.log('✅ Vinculación exitosa:', linkData);
          finalUidInquilino = foundClient.id;
          toast.success('Cliente vinculado con éxito');
        } else {
          console.log('🆕 Creando nuevo registro de inquilino local...');
          // @ts-ignore
          const { data: response, error: inqError } = await eden.admin.inquilinos.post({
            nombre: data.nuevo_inquilino.nombre,
            dni: data.nuevo_inquilino.dni,
            email: data.nuevo_inquilino.email,
            celular: data.nuevo_inquilino.celular,
            country_code: country_code!
          });

          if (inqError) {
             console.error('❌ [CREACIÓN-INQUILINO-ERROR]', inqError);
             throw new Error(inqError.value?.message || inqError.value?.error || 'Error al crear inquilino');
          }
          
          console.log('✅ Inquilino creado:', response);
          finalUidInquilino = response?.data?.id || response?.id;
          toast.success('Inquilino creado con éxito');
        }
      }

      console.log('📝 Creando Contrato con Inquilino:', finalUidInquilino);
      const contratoPayload = {
        ...data,
        propiedad_uid: (data as any).uid_propiedad,
        inquilino_id: finalUidInquilino,
        monto_actual: data.monto_inicial, // Usamos el monto inicial como actual
        inmobiliaria_id: inmobiliaria_id!
      };
      
      // Limpiamos campos auxiliares del frontend
      delete (contratoPayload as any).uid_propiedad;
      delete (contratoPayload as any).uid_inquilino;

      console.table(contratoPayload);

      // @ts-ignore
      const { data: result, error: contratoError } = await eden.admin.contratos.post(contratoPayload);
      
      if (contratoError) throw new Error('Error al generar el contrato.');

      toast.success('Contrato Generado Correctamente');
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error: any) {
       toast.error('Error en la Transacción', { description: error.message });
       console.error('Error: ', error);
    }
  };

  // Observamos los switches para mostrar condicionalmente el form
  const aplicarAumento = useWatch({ control, name: 'reglas_aumento.aplicar_aumento' });
  const tipoAumento = useWatch({ control, name: 'reglas_aumento.tipo_aumento' });
  const aplicarMora = useWatch({ control, name: 'reglas_mora.aplicar_mora' });
  const pagoMesCurso = useWatch({ control, name: 'pago_mes_curso' });

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-inter bg-white p-6 md:p-8 rounded-2xl border border-admin-border shadow-sm max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center border-b border-admin-border-subtle pb-5">
          <h2 className="text-xl font-bold font-jakarta text-renta-950 flex items-center gap-2">
            <FileText className="h-6 w-6 text-renta-600" />
            Nuevo Contrato de Alquiler
          </h2>
          <div className="text-xs bg-blue-50 text-blue-700 font-semibold px-3 py-1.5 rounded-full border border-blue-200 flex items-center gap-2">
            <span>Transacción Atómica Activada</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUMNA IZQUIERDA: Vínculos y Fechas */}
          <div className="space-y-6">
            
            {/* Vinculación Inmobiliaria */}
            <div className="p-5 rounded-2xl border border-admin-border bg-renta-50/40 space-y-5">
               <h3 className="text-sm font-jakarta font-bold text-renta-900 flex items-center gap-2 border-b border-admin-border-subtle pb-2">
                  <Building className="h-4 w-4 text-renta-500" /> Vínculos Funcionales
               </h3>

               <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-renta-900">Propiedad DISPONIBLE <span className="text-red-500">*</span></label>
                  <select 
                    {...register('uid_propiedad')}
                    className={cn(
                      "w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all",
                      errors.uid_propiedad ? "border-red-400 focus:ring-red-400" : "border-admin-border focus:border-renta-300 focus:ring-renta-200 text-renta-950"
                    )}
                  >
                    <option value="">-- Seleccione una Propiedad --</option>
                    {propiedadesDisponibles?.map(prop => (
                      <option key={prop.uid_prop} value={prop.uid_prop}>{prop.direccion || 'Sin dirección'}</option>
                    ))}
                  </select>
                  {errors.uid_propiedad && <p className="text-xs text-red-500 font-medium">{errors.uid_propiedad.message}</p>}
                  <p className="text-[10px] text-renta-500">Solo se listan inmuebles con estado "DISPONIBLE".</p>
               </div>

               <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-renta-900 flex items-center gap-1.5">
                       {isNuevoInquilino ? 'Datos del Nuevo Inquilino' : 'Inquilino Titular'} <User className="h-3 w-3" /> <span className="text-red-500">*</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <span className="text-[10px] font-bold text-renta-500 uppercase tracking-tighter group-hover:text-renta-950 transition-colors">¿Es inquilino nuevo?</span>
                      <input type="checkbox" {...register('is_nuevo_inquilino')} className="w-4 h-4 rounded border-admin-border text-renta-600 focus:ring-renta-500" />
                    </label>
                  </div>

                  {!isNuevoInquilino ? (
                    <div className="space-y-1.5">
                      <select 
                        {...register('uid_inquilino')}
                        className={cn(
                          "w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all",
                          errors.uid_inquilino ? "border-red-400 focus:ring-red-400" : "border-admin-border focus:border-renta-300 focus:ring-renta-200 text-renta-950"
                        )}
                      >
                        <option value="">-- Seleccione un Inquilino --</option>
                        {inquilinosSeleccionables?.map(inq => (
                          <option key={inq.uid_inq} value={inq.uid_inq}>{inq.nombre || 'Sin nombre'} (DNI: {inq.dni || '-'})</option>
                        ))}
                      </select>
                      {errors.uid_inquilino && <p className="text-xs text-red-500 font-medium">{errors.uid_inquilino.message}</p>}
                      <p className="text-[10px] text-renta-500">Seleccione un inquilino de su base de datos actual.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-4 rounded-xl border border-renta-200 bg-white shadow-inner animate-fade-in">
                      {/* Lookup Component (Atomic Port) */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                           <LinkIcon className="w-3 h-3" /> Vincular desde Red Zonatia
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            placeholder="Ej: 001"
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:border-renta-500"
                          />
                          <button 
                            type="button"
                            onClick={handleLookupClient}
                            disabled={isLinking}
                            className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
                          >
                            {isLinking ? <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Search className="w-3 h-3" />}
                            Buscar
                          </button>
                        </div>
                        {foundClient && (
                          <div className="text-[9px] font-black text-emerald-600 flex items-center gap-1 uppercase">
                            <UserCheck className="w-3 h-3" /> Vinculado a #{foundClient.client_number}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-renta-600 uppercase">Nombre Completo</label>
                          <input {...register('nuevo_inquilino.nombre')} className="w-full rounded-lg border border-admin-border px-3 py-2 text-sm focus:ring-1 focus:ring-renta-200 outline-none" placeholder="Nombre y Apellido" />
                          {errors.nuevo_inquilino?.nombre && <p className="text-[10px] text-red-500">{errors.nuevo_inquilino.nombre.message}</p>}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-renta-600 uppercase">DNI</label>
                          <input {...register('nuevo_inquilino.dni')} className="w-full rounded-lg border border-admin-border px-3 py-2 text-sm focus:ring-1 focus:ring-renta-200 outline-none" placeholder="12345678" />
                          {errors.nuevo_inquilino?.dni && <p className="text-[10px] text-red-500">{errors.nuevo_inquilino.dni.message}</p>}
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-renta-600 uppercase">Email</label>
                          <input {...register('nuevo_inquilino.email')} className="w-full rounded-lg border border-admin-border px-3 py-2 text-sm focus:ring-1 focus:ring-renta-200 outline-none" placeholder="inquilino@email.com" />
                          {errors.nuevo_inquilino?.email && <p className="text-[10px] text-red-500">{errors.nuevo_inquilino.email.message}</p>}
                        </div>

                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-renta-600 uppercase">Celular (E.164)</label>
                          <Controller
                            name="nuevo_inquilino.celular"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                              <CountryPhoneSelector
                                value={value}
                                onChange={onChange}
                              />
                            )}
                          />
                        </div>

                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-renta-600 uppercase">DNI Adjunto</label>
                           <input type="file" {...register('nuevo_inquilino.dni_url')} className="w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-renta-50 file:text-renta-700 hover:file:bg-renta-100" />
                        </div>

                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-renta-600 uppercase">Contrato Base</label>
                           <input type="file" {...register('nuevo_inquilino.contrato_url')} className="w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-renta-50 file:text-renta-700 hover:file:bg-renta-100" />
                        </div>
                      </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Duración y Monto */}
            <div className="p-5 rounded-2xl border border-admin-border bg-renta-50/40 space-y-5">
               <h3 className="text-sm font-jakarta font-bold text-renta-900 flex items-center gap-2 border-b border-admin-border-subtle pb-2">
                  <Calendar className="h-4 w-4 text-renta-500" /> Ciclo de Vida Financiero
               </h3>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-renta-900">Fecha de Inicio (Firma)</label>
                    <input 
                      type="date"
                      {...register('fecha_inicio')}
                      className={cn(
                        "w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 text-renta-950",
                        errors.fecha_inicio ? "border-red-400" : "border-admin-border focus:border-renta-300"
                      )}
                    />
                    {errors.fecha_inicio && <p className="text-[10px] text-red-500 font-medium">{errors.fecha_inicio.message}</p>}
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-renta-900">Fecha de Finalización</label>
                    <input 
                      type="date"
                      {...register('fecha_fin')}
                      className={cn(
                        "w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 text-renta-950",
                        errors.fecha_fin ? "border-red-400" : "border-admin-border focus:border-renta-300"
                      )}
                    />
                    {errors.fecha_fin && <p className="text-[10px] text-red-500 font-medium">{errors.fecha_fin.message}</p>}
                 </div>
               </div>
               
               <div className="space-y-1.5 pt-2">
                 <label className="text-sm font-semibold text-renta-900">Valor del Alquiler <span className="text-red-500">*</span></label>
                 <div className="relative">
                   <span className="absolute left-3 top-2.5 text-[10px] text-renta-500 font-bold uppercase">{config.currency_code}</span>
                   <input
                     type="number"
                     {...register('monto_inicial')}
                     className={cn(
                       "w-full rounded-xl border bg-white pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 font-medium text-renta-950",
                       errors.monto_inicial ? "border-red-400" : "border-admin-border focus:border-renta-300"
                     )}
                     placeholder="0.00"
                   />
                 </div>
                 {errors.monto_inicial && <p className="text-xs text-red-500 font-medium">{errors.monto_inicial.message}</p>}
                 
                 {/* 💳 Transición Suave / Mid-Month Onboarding */}
                 <div className="pt-6 border-t border-admin-border-subtle space-y-4">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-renta-950">Pago del Primer Mes</h4>
                          {pagoMesCurso ? (
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-tighter">
                              Ya Cobrado
                            </span>
                          ) : (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-tighter">
                              Pendiente
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-renta-500 leading-relaxed max-w-md">
                          {pagoMesCurso 
                            ? "Activado: El sistema asume que el inquilino ya te entregó el dinero del mes en curso (ej: en efectivo al firmar). No se generará deuda por este mes."
                            : "Desactivado: El sistema generará una boleta de pago para el mes actual. El inquilino verá que debe este monto en su portal."
                          }
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <span className={cn(
                           "text-[10px] font-bold uppercase tracking-wider transition-colors",
                           pagoMesCurso ? "text-emerald-600" : "text-slate-400"
                         )}>
                           {pagoMesCurso ? 'Ya pagó' : 'A cobrar'}
                         </span>
                         <label className="relative inline-flex items-center cursor-pointer shrink-0">
                           <input type="checkbox" className="sr-only peer" {...register('pago_mes_curso')} />
                           <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                         </label>
                      </div>
                   </div>
                   
                   {pagoMesCurso && (
                      <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex gap-2.5 animate-in slide-in-from-top-2 duration-300">
                         <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                         <p className="text-[10px] leading-relaxed text-emerald-800 font-medium italic">
                           <strong>Nota:</strong> Al marcar como pagado, el sistema omitirá la cuota de este mes. 
                           Las estadísticas de rentabilidad reflejarán este cobro como realizado fuera de plataforma.
                         </p>
                      </div>
                   )}
                 </div>
               </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: Motor de Rentabilidad */}
          <div className="space-y-6">
             
             {/* Reglas de Aumento */}
             <div className={cn(
               "p-5 rounded-2xl border transition-colors space-y-4", 
               aplicarAumento ? "bg-emerald-50/50 border-emerald-200" : "bg-white border-admin-border"
             )}>
                <div className="flex items-center justify-between border-b border-admin-border-subtle pb-3">
                  <h3 className="text-sm font-jakarta font-bold text-renta-900 flex items-center gap-2">
                    <TrendingUp className={cn("h-4 w-4", aplicarAumento ? "text-emerald-500" : "text-renta-500")} /> 
                    Configurar Aumentos
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" {...register('reglas_aumento.aplicar_aumento')} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {aplicarAumento && (
                  <div className="space-y-4 pt-2 animate-fade-in">
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-renta-900">Periodicidad de Actualización</label>
                      <select 
                        {...register('reglas_aumento.periodicidad')}
                        className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 text-renta-950"
                      >
                        <option value="">Seleccione Periodo...</option>
                        <option value="mensual">Mensual (Mes a Mes)</option>
                        <option value="bimestral">Bimestral (Cada 2 meses)</option>
                        <option value="trimestral">Trimestral (Cada 3 meses)</option>
                        <option value="cuatrimestral">Cuatrimestral (Cada 4 meses)</option>
                        <option value="semestral">Semestral (Cada 6 meses)</option>
                        <option value="anual">Anual (A los 12 meses)</option>
                      </select>
                      {errors.reglas_aumento?.periodicidad && <p className="text-[10px] text-red-500 font-medium">{errors.reglas_aumento.periodicidad.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-renta-900">Indexación (Switch Arquitecto)</label>
                      <select 
                        {...register('reglas_aumento.tipo_aumento')}
                        className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 text-emerald-950 font-bold"
                      >
                        <option value="">Seleccione Modalidad...</option>
                        {country_code === 'AR' ? (
                          <>
                            <option value="INDICE_IPC">Aumento por IPC (Consumidor)</option>
                            <option value="INDICE_ICL">Aumento por ICL (Locación)</option>
                          </>
                        ) : (
                          <option value="INDICE_ICL_IPC">Actualización por Índices Oficiales (ICL/IPC)</option>
                        )}
                        <option value="PORCENTAJE_MANUAL">Porcentaje Personalizado</option>
                      </select>
                      {errors.reglas_aumento?.tipo_aumento && <p className="text-[10px] text-red-500 font-medium">{errors.reglas_aumento.tipo_aumento.message}</p>}
                      
                      {/* Porcentaje Personalizado Input */}
                      {tipoAumento === 'PORCENTAJE_MANUAL' && (
                        <div className="pt-2 animate-fade-in">
                          <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Valor del Porcentaje Fijo</label>
                          <div className="relative mt-1">
                            <input 
                              type="number" step="0.1"
                              {...register('reglas_aumento.porcentaje')}
                              className="w-full rounded-xl border border-emerald-200 bg-white pr-8 pl-3 py-2 text-sm outline-none focus:border-emerald-400 text-renta-950"
                              placeholder="Ej: 15"
                            />
                            <span className="absolute right-3 top-2 text-emerald-500 font-bold">%</span>
                          </div>
                          {errors.reglas_aumento?.porcentaje && <p className="text-[10px] text-red-500 font-medium">{errors.reglas_aumento.porcentaje.message}</p>}
                        </div>
                      )}

                      {(tipoAumento === 'INDICE_ICL_IPC' || tipoAumento === 'INDICE_IPC' || tipoAumento === 'INDICE_ICL') && (
                        <p className="text-[10px] text-emerald-700 bg-emerald-100 p-2 rounded-lg mt-2 font-semibold">
                           {country_code === 'AR' 
                            ? "IMPORTANTE: Los valores de IPC/ICL se gestionan manualmente desde el Panel Central. El sistema tomará el valor vigente al momento del ajuste."
                            : "El valor del ICL/IPC deberá ser introducido en cada periodo de ajuste por la Inmobiliaria."
                           }
                        </p>
                      )}
                    </div>
                  </div>
                )}
             </div>

             {/* Intereses Morosos */}
             <div className={cn(
               "p-5 rounded-2xl border transition-colors space-y-4", 
               aplicarMora ? "bg-rose-50/50 border-rose-200" : "bg-white border-admin-border"
             )}>
                <div className="flex items-center justify-between border-b border-admin-border-subtle pb-3">
                  <h3 className="text-sm font-jakarta font-bold text-renta-900 flex items-center gap-2">
                    <AlertTriangle className={cn("h-4 w-4", aplicarMora ? "text-rose-500" : "text-renta-500")} /> 
                    Penalidad por Mora Diaria / Semanal
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" {...register('reglas_mora.aplicar_mora')} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>

                {aplicarMora && (
                  <div className="space-y-4 pt-2 animate-fade-in">
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-renta-900">Aplicar Cada...</label>
                        <select 
                          {...register('reglas_mora.periodicidad')}
                          className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 text-renta-950"
                        >
                          <option value="diario">Diario</option>
                          <option value="semanal">Semanal</option>
                          <option value="mensual">Mensual (Mes a Mes)</option>
                        </select>
                         {errors.reglas_mora?.periodicidad && <p className="text-[10px] text-red-500 font-medium">{errors.reglas_mora.periodicidad.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-renta-900">% De Recargo</label>
                        <div className="relative">
                          <input 
                            type="number" step="0.1"
                            {...register('reglas_mora.porcentaje')}
                            className="w-full rounded-xl border border-rose-200 bg-white pr-8 pl-3 py-2 text-sm outline-none focus:border-rose-400 text-renta-950 text-right"
                            placeholder="Ej: 1"
                          />
                          <span className="absolute right-3 top-2 text-renta-500 font-bold">%</span>
                        </div>
                        {errors.reglas_mora?.porcentaje && <p className="text-[10px] text-red-500 font-medium">{errors.reglas_mora.porcentaje.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-renta-900">Días de Gracia Disponibles</label>
                      <input 
                        type="number" 
                        {...register('reglas_mora.dias_gracia')}
                        className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 text-renta-950"
                        placeholder="Ej: 5 (Vencimiento el día 5)"
                      />
                      <p className="text-[10px] text-renta-500">Permite abonar al inquilino la cuota sin recargo siempre y cuando pague antes del día asignado mensual.</p>
                      {errors.reglas_mora?.dias_gracia && <p className="text-[10px] text-red-500 font-medium">{errors.reglas_mora.dias_gracia.message}</p>}
                    </div>

                  </div>
                )}
             </div>

          </div>
        </div>

        {/* Debug Global Errors */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-fade-in border-l-4 border-l-red-500">
             <div className="font-bold mb-2 flex items-center gap-2">
               <AlertTriangle className="h-4 w-4" /> 
               Errores de validación detectados:
             </div>
             <ul className="list-disc list-inside space-y-1">
               {Object.entries(errors).map(([key, value]: [string, any]) => {
                 if (value.message) return <li key={key}><strong>{key}:</strong> {value.message}</li>;
                 // Handle nested objects like nuevo_inquilino or reglas_aumento
                 if (typeof value === 'object') {
                   return Object.entries(value).map(([subKey, subValue]: [string, any]) => (
                     subValue.message ? <li key={`${key}-${subKey}`}><strong>{key}.{subKey}:</strong> {subValue.message}</li> : null
                   ));
                 }
                 return null;
               })}
             </ul>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-admin-border-subtle mt-4">
          <button 
            type="button" 
            onClick={() => onCancel ? onCancel() : navigate('/contratos')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-admin-border bg-white text-sm font-semibold text-renta-700 hover:bg-renta-50 transition-colors"
          >
            <X className="h-4 w-4" /> Cancelar
          </button>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-renta-950 text-white text-sm font-semibold hover:bg-renta-800 disabled:opacity-50 transition-colors shadow-lg shadow-renta-950/20"
          >
            <Save className="h-4 w-4" /> Guardar y Generar Cuotas Atómicas
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
