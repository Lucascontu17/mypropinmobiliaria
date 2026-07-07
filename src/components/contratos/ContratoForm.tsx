import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useEden } from '@/services/eden';
import { toast } from 'sonner';
import { Save, X, FileText, Calendar, Building, User, TrendingUp, AlertTriangle, Info, Search, Link as LinkIcon, UserCheck, UserX, UploadCloud, CheckCircle2, Loader2, Check, Pencil } from 'lucide-react';
import { useForm, FormProvider, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contratoSchema, type ContratoFormData } from '@/types/contrato';
import { useInmobiliaria } from '../../hooks/useInmobiliaria';
import { CountryPhoneSelector } from '../common/CountryPhoneSelector';
import { useRegion } from '@/hooks/useRegion';
import { NumericInput } from '@/components/common/NumericInput';

interface ContratoFormProps {
  propiedadesDisponibles: { uid_prop: string; direccion: string; valor_alquiler?: string | number }[];
  inquilinosSeleccionables: { id: string; nombre: string; dni: string }[];
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

const FileUploadField = ({ label, registerProps, watchValue, accept, hint }: { label: string, registerProps: any, watchValue: any, accept?: string, hint?: string }) => {
  const file = watchValue && watchValue.length > 0 ? watchValue[0] : null;
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] font-bold text-renta-600 uppercase tracking-widest">{label}</label>
      <div className="relative group">
        <input type="file" accept={accept} {...registerProps} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        <div className={cn(
          "flex items-center justify-between px-4 py-2.5 rounded-xl border border-dashed transition-all duration-200",
          file ? "border-emerald-400 bg-emerald-50/50 shadow-sm" : "border-slate-300 bg-slate-50 group-hover:bg-slate-100 group-hover:border-slate-400"
        )}>
           <div className="flex items-center gap-2 overflow-hidden">
             <UploadCloud className={cn("w-4 h-4 shrink-0 transition-colors", file ? "text-emerald-500" : "text-slate-400 group-hover:text-renta-500")} />
             <span className={cn("text-xs font-semibold truncate transition-colors", file ? "text-emerald-700" : "text-slate-500 group-hover:text-renta-700")}>
               {file ? file.name : (hint || "Subir archivo (Opcional)")}
             </span>
           </div>
           {file && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />}
        </div>
      </div>
    </div>
  );
};


export function ContratoForm({ propiedadesDisponibles, inquilinosSeleccionables, onCancel, onSubmitSuccess }: ContratoFormProps) {
  const { inmobiliaria_id, country_code } = useInmobiliaria();
  const { config } = useRegion();
  const { client: eden } = useEden();
  const navigate = useNavigate();

  const [isLinking, setIsLinking] = useState(false);
  const [foundClient, setFoundClient] = useState<any>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [sinCuenta, setSinCuenta] = useState(false);

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

  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const isNuevoInquilino = useWatch({ control, name: 'is_nuevo_inquilino' });
  const selectedUidPropiedad = watch('uid_propiedad');
  const watchedDniFile = watch('nuevo_inquilino.dni_url');
  const watchedContratoFile = watch('contrato_url');

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
      // @ts-expect-error - Eden Treaty dynamic path
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

  // --- Lógica de envío extraída para reutilizar con confirmación ---
  const submitContract = async (data: ContratoFormData) => {
    console.group('🚀 [CONTRATO-DEBUG] Iniciando Transacción Atómica');
    console.log('📦 Form Data:', data);
    console.log('🏢 Inmobiliaria ID:', inmobiliaria_id);
    
    try {
      setIsUploadingFiles(true);
      let finalUidInquilino = data.uid_inquilino;
      let finalDniUrl = null;
      let finalContratoUrl = null;

      // Helper for file upload
      const uploadFile = async (fileList: any, folder: string) => {
        if (!fileList || fileList.length === 0) return null;
        const file = fileList[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        // @ts-expect-error - Eden Treaty dynamic path
        const { data: res, error } = await eden.admin['upload-file'].post(formData);
        if (error) throw new Error(error.value?.error || 'Error subiendo archivo');
        return res?.url;
      };

      // Upload files first
      if (data.is_nuevo_inquilino && data.nuevo_inquilino?.dni_url) {
         finalDniUrl = await uploadFile(data.nuevo_inquilino.dni_url, 'dnis');
      }
      if (data.contrato_url) {
         finalContratoUrl = await uploadFile(data.contrato_url, 'contratos');
      }

      setIsUploadingFiles(false);

      if (data.is_nuevo_inquilino && data.nuevo_inquilino) {
        console.log('👤 Procesando Inquilino Nuevo/Global...');
        
        if (foundClient) {
          console.log('🔗 Vinculando Cliente Global Existente:', foundClient.id);
          // @ts-expect-error - Eden Treaty dynamic path
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
          console.log('🆕 Creando nuevo registro de inquilino local...', sinCuenta ? '(SOLO FICHA)' : '');
          // @ts-expect-error - Eden Treaty dynamic path
          const { data: response, error: inqError } = await eden.admin.inquilinos.post({
            nombre: data.nuevo_inquilino.nombre,
            dni: data.nuevo_inquilino.dni,
            email: sinCuenta ? '' : data.nuevo_inquilino.email,
            celular: data.nuevo_inquilino.celular,
            dni_url: finalDniUrl,
            country_code: country_code!,
            sin_cuenta: sinCuenta
          });

          if (inqError) {
             console.error('❌ [CREACIÓN-INQUILINO-ERROR]', inqError);
             throw new Error(inqError.value?.message || inqError.value?.error || 'Error al crear inquilino');
          }
          
          console.log('✅ Inquilino creado:', response);
          finalUidInquilino = response?.data?.id || response?.id;
          toast.success(sinCuenta ? 'Inquilino registrado como Solo Ficha' : 'Inquilino creado con éxito', {
            description: sinCuenta ? `${data.nuevo_inquilino.nombre} fue registrado sin cuenta Zonatia.` : undefined
          });
        }
      }

      console.log('📝 Creando Contrato con Inquilino:', finalUidInquilino);
      const contratoPayload = {
        ...data,
        propiedad_uid: (data as any).uid_propiedad,
        inquilino_id: finalUidInquilino,
        monto_actual: retroMontoManual.current ? String(retroMontoEditado) : data.monto_inicial,
        retro_monto_editado: retroMontoManual.current,
        contrato_url: finalContratoUrl,
        inmobiliaria_id: inmobiliaria_id!
      };
      
      // Limpiamos campos auxiliares del frontend
      delete (contratoPayload as any).uid_propiedad;
      delete (contratoPayload as any).uid_inquilino;

      console.table(contratoPayload);

      // @ts-expect-error - Eden Treaty dynamic path
      const { data: result, error: contratoError } = await eden.admin.contratos.post(contratoPayload);
      
      if (contratoError) {
        if (contratoError.status === 409) {
          throw new Error('El DNI ya está registrado para otro inquilino.');
        }
        throw new Error(contratoError.value?.error || contratoError.value?.message || 'Error al generar el contrato.');
      }

      toast.success('Contrato Generado Correctamente');
      setFoundClient(null);
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error: any) {
       toast.error('Error en la Transacción', { description: error.message });
       console.error('Error: ', error);
    } finally {
       setIsUploadingFiles(false);
    }
  };

  // --- onSubmit con intercepción de doble confirmación ---
  const onSubmit = async (data: ContratoFormData) => {
    // Si hay preview retroactivo visible, mostrar modal de confirmación
    if (retroPreview?.visible) {
      retroFormDataRef.current = data;
      setShowRetroConfirm(true);
      return;
    }
    // Flujo normal: enviar directamente
    await submitContract(data);
  };

  const confirmRetroSubmit = async () => {
    setShowRetroConfirm(false);
    if (retroFormDataRef.current) {
      await submitContract(retroFormDataRef.current);
      retroFormDataRef.current = null;
    }
  };

  const cancelRetroSubmit = () => {
    setShowRetroConfirm(false);
    retroFormDataRef.current = null;
  };

  // Observamos los switches para mostrar condicionalmente el form
  const aplicarAumento = useWatch({ control, name: 'reglas_aumento.aplicar_aumento' });
  const tipoAumento = useWatch({ control, name: 'reglas_aumento.tipo_aumento' });
  const aplicarMora = useWatch({ control, name: 'reglas_mora.aplicar_mora' });
  const pagoMesCurso = useWatch({ control, name: 'pago_mes_curso' });
  const fechaInicioVal = useWatch({ control, name: 'fecha_inicio' });
  const montoInicialVal = useWatch({ control, name: 'monto_inicial' });
  const porcentajeAumento = useWatch({ control, name: 'reglas_aumento.porcentaje' });
  const montoFijoAumento = useWatch({ control, name: 'reglas_aumento.monto_fijo' });
  const periodicidadAumento = useWatch({ control, name: 'reglas_aumento.periodicidad' });

  // --- Cálculo de preview de aumentos retrospectivos ---
  const [retroPreview, setRetroPreview] = useState<{
    montoActual: number;
    periodos: number;
    detalle: string;
    visible: boolean;
  } | null>(null);

  // --- Estado para edición manual del monto y doble confirmación ---
  const [showRetroConfirm, setShowRetroConfirm] = useState(false);
  const [editandoMonto, setEditandoMonto] = useState(false);
  const [retroMontoEditado, setRetroMontoEditado] = useState<number>(0);
  const retroMontoManual = useRef(false);
  const retroFormDataRef = useRef<ContratoFormData | null>(null);

  useEffect(() => {
    if (!aplicarAumento || !fechaInicioVal || !montoInicialVal) {
      setRetroPreview(null);
      return;
    }

    const fechaInicio = new Date(fechaInicioVal);
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    if (fechaInicio >= inicioMes) {
      setRetroPreview(null);
      return;
    }

    const periodicidadMap: Record<string, number> = {
      mensual: 1, bimestral: 2, trimestral: 3,
      cuatrimestral: 4, semestral: 6, anual: 12
    };

    const periodoMeses = periodicidadMap[periodicidadAumento || ''] || 0;
    if (periodoMeses <= 0) {
      setRetroPreview(null);
      return;
    }

    const monthsElapsed = (inicioMes.getFullYear() - fechaInicio.getFullYear()) * 12 +
                          (inicioMes.getMonth() - fechaInicio.getMonth());

    if (monthsElapsed <= 0) {
      setRetroPreview(null);
      return;
    }

    const periodosCompletos = Math.floor(monthsElapsed / periodoMeses);
    if (periodosCompletos <= 0) {
      setRetroPreview(null);
      return;
    }

    let montoCalc = Number(montoInicialVal) || 0;
    let detalle = '';

    if (tipoAumento === 'PORCENTAJE_MANUAL') {
      const pct = Number(porcentajeAumento) || 0;
      for (let i = 0; i < periodosCompletos; i++) {
        montoCalc = montoCalc * (1 + (pct / 100));
      }
      montoCalc = Math.round(montoCalc * 100) / 100;
      detalle = `${periodosCompletos} períodos × ${pct}%`;
    } else if (tipoAumento === 'MONTO_FIJO') {
      const fijo = Number(montoFijoAumento) || 0;
      montoCalc = montoCalc + (fijo * periodosCompletos);
      detalle = `${periodosCompletos} períodos × $${fijo}`;
    } else if (tipoAumento === 'INDICE_IPC' || tipoAumento === 'INDICE_ICL') {
      detalle = `Se calculará con índices oficiales al guardar`;
    } else {
      setRetroPreview(null);
      return;
    }

    // Sincronizar el monto editable si el usuario no lo ha modificado manualmente
    if (!retroMontoManual.current) {
      setRetroMontoEditado(montoCalc);
    }

    setRetroPreview({
      montoActual: montoCalc,
      periodos: periodosCompletos,
      detalle,
      visible: true
    });
  }, [aplicarAumento, fechaInicioVal, montoInicialVal, tipoAumento,
      porcentajeAumento, montoFijoAumento, periodicidadAumento]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-inter bg-white p-6 md:p-8 rounded-2xl ring-1 ring-inset ring-admin-border border-transparent shadow-sm max-w-6xl mx-auto">
        
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
            <div className="p-5 rounded-2xl ring-1 ring-inset ring-admin-border border-transparent bg-renta-50/40 space-y-5">
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
                          <option key={inq.id} value={inq.id}>{inq.nombre || 'Sin nombre'} (DNI: {inq.dni || '-'})</option>
                        ))}
                      </select>
                      {errors.uid_inquilino && <p className="text-xs text-red-500 font-medium">{errors.uid_inquilino.message}</p>}
                      <p className="text-[10px] text-renta-500">Seleccione un inquilino de su base de datos actual.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-4 rounded-xl border border-renta-200 bg-white shadow-inner animate-fade-in">
                      {/* Sin Cuenta Toggle */}
                      <div className="flex items-center justify-between bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                        <div className="flex items-center gap-2">
                          <UserX className={cn("w-4 h-4", sinCuenta ? "text-amber-600" : "text-slate-400")} />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-renta-700">Sin cuenta (Solo Ficha)</span>
                            <p className="text-[9px] text-renta-500 leading-tight mt-0.5">Registrar inquilino sin cuenta Zonatia. Se le asignará un ID cuando cree su cuenta.</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={sinCuenta}
                            onChange={(e) => {
                              setSinCuenta(e.target.checked);
                              if (e.target.checked) {
                                setFoundClient(null);
                                setClientSearch('');
                                setValue('nuevo_inquilino.email', '');
                              }
                            }}
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      {/* Lookup Component (Atomic Port) — Hidden when sinCuenta */}
                      {!sinCuenta && (
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
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-renta-600 uppercase">Nombre Completo</label>
                          <input {...register('nuevo_inquilino.nombre')} className="w-full rounded-lg ring-1 ring-inset ring-admin-border border-transparent px-3 py-2 text-sm focus:ring-1 focus:ring-renta-200 outline-none" placeholder="Nombre y Apellido" />
                          {errors.nuevo_inquilino?.nombre && <p className="text-[10px] text-red-500">{errors.nuevo_inquilino.nombre.message}</p>}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-renta-600 uppercase">DNI</label>
                          <input {...register('nuevo_inquilino.dni')} className="w-full rounded-lg ring-1 ring-inset ring-admin-border border-transparent px-3 py-2 text-sm focus:ring-1 focus:ring-renta-200 outline-none" placeholder="12345678" />
                          {errors.nuevo_inquilino?.dni && <p className="text-[10px] text-red-500">{errors.nuevo_inquilino.dni.message}</p>}
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-renta-600 uppercase">Email</label>
                          <input 
                            {...register('nuevo_inquilino.email')} 
                            disabled={sinCuenta}
                            className={cn(
                              "w-full rounded-lg ring-1 ring-inset ring-admin-border border-transparent px-3 py-2 text-sm focus:ring-1 focus:ring-renta-200 outline-none",
                              sinCuenta && "bg-renta-50 text-renta-400 cursor-not-allowed"
                            )} 
                            placeholder={sinCuenta ? "No requerido" : "inquilino@email.com"} 
                          />
                          {errors.nuevo_inquilino?.email && !sinCuenta && <p className="text-[10px] text-red-500">{errors.nuevo_inquilino.email.message}</p>}
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

                        <div className="space-y-1 pt-2 col-span-2">
                           <FileUploadField 
                             label="DNI Adjunto (Opcional)" 
                             registerProps={register('nuevo_inquilino.dni_url')} 
                             watchValue={watchedDniFile} 
                             accept="image/png, image/jpeg, image/jpg"
                             hint="Subir archivo (JPG, PNG)"
                           />
                        </div>
                      </div>
                    </div>
                  )}
               </div>
               
               <div className="pt-2 border-t border-admin-border-subtle mt-4">
                  <FileUploadField 
                    label="Contrato Firmado / Escaneado (Opcional)" 
                    registerProps={register('contrato_url')} 
                    watchValue={watchedContratoFile} 
                    accept="application/pdf"
                    hint="Subir contrato (Solo PDF)"
                  />
                  <p className="text-[10px] text-renta-500 mt-1">El documento quedará resguardado de forma segura y vinculado a este contrato.</p>
               </div>
            </div>

            {/* Duración y Monto */}
            <div className="p-5 rounded-2xl ring-1 ring-inset ring-admin-border border-transparent bg-renta-50/40 space-y-5">
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
                   <Controller
                     control={control}
                     name="monto_inicial"
                     render={({ field }) => (
                       <NumericInput
                         placeholder="0.00"
                         value={field.value}
                         onChange={field.onChange}
                         className={cn(
                           "w-full rounded-xl border bg-white pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 font-medium text-renta-950",
                           errors.monto_inicial ? "border-red-400" : "border-admin-border focus:border-renta-300"
                         )}
                       />
                     )}
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
                          <option value="INDICE_IPC">Actualización por IPC (Consumidor)</option>
                        )}
                        <option value="PORCENTAJE_MANUAL">Porcentaje Personalizado</option>
                        <option value="MONTO_FIJO">Monto Fijo ($)</option>
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

                      {/* Monto Fijo Input */}
                      {tipoAumento === 'MONTO_FIJO' && (
                        <div className="pt-2 animate-fade-in">
                          <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Valor del Aumento Fijo</label>
                          <div className="relative mt-1">
                            <span className="absolute left-3 top-2.5 text-[10px] text-renta-500 font-bold uppercase">{config.currency_code}</span>
                            <input
                              type="number" step="0.01"
                              {...register('reglas_aumento.monto_fijo')}
                              className="w-full rounded-xl border border-emerald-200 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:border-emerald-400 text-renta-950"
                              placeholder="Ej: 5000"
                            />
                          </div>
                          {errors.reglas_aumento?.monto_fijo && <p className="text-[10px] text-red-500 font-medium">{errors.reglas_aumento.monto_fijo.message}</p>}
                          <p className="text-[10px] text-emerald-700 bg-emerald-100 p-2 rounded-lg mt-2 font-semibold">
                            El alquiler se incrementará en este monto fijo cada período seleccionado, independientemente de índices.
                          </p>
                        </div>
                      )}

                      {(tipoAumento === 'INDICE_IPC' || tipoAumento === 'INDICE_ICL') && (
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

              {/* ⏪ Preview de Aumentos Retrospectivos */}
              {retroPreview?.visible && (
                <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/60 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-jakarta font-bold text-amber-900">
                      Contrato con Fecha Retroactiva
                    </h3>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center bg-white/70 rounded-lg p-2.5 border border-amber-100">
                      <span className="text-amber-800 font-medium">Monto inicial:</span>
                      <span className="font-bold text-renta-900">{config.currency_code} {Number(montoInicialVal || 0).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-amber-100/70 rounded-lg p-2.5 border border-amber-200">
                      <span className="text-amber-800 font-medium">Períodos transcurridos:</span>
                      <span className="font-bold text-amber-900">{retroPreview.periodos} × {periodicidadAumento}</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-emerald-100/70 rounded-lg p-2.5 border border-emerald-200">
                      <span className="text-emerald-800 font-medium">Monto actual calculado:</span>
                      <div className="flex items-center gap-2">
                        {editandoMonto ? (
                          <div className="flex items-center gap-1">
                            <span className="text-emerald-700 text-xs">{config.currency_code}</span>
                            <input
                              type="number"
                              step="0.01"
                              value={retroMontoEditado}
                              onChange={(e) => {
                                retroMontoManual.current = true;
                                setRetroMontoEditado(Number(e.target.value));
                              }}
                              className="w-28 text-right font-bold text-emerald-700 text-sm bg-white border border-emerald-300 rounded-lg px-2 py-1 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setEditandoMonto(false)}
                              className="p-1 rounded-md hover:bg-emerald-200 transition-colors"
                              title="Confirmar edición"
                            >
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-bold text-emerald-700 text-sm">
                              {config.currency_code} {retroMontoEditado.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setRetroMontoEditado(retroPreview.montoActual);
                                setEditandoMonto(true);
                              }}
                              className="p-1 rounded-md hover:bg-emerald-200 transition-colors"
                              title="Editar monto manualmente"
                            >
                              <Pencil className="h-3 w-3 text-emerald-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-amber-700 bg-white/50 p-2 rounded-lg italic flex items-center gap-1.5">
                      <Info className="h-3 w-3 shrink-0" />
                      {tipoAumento === 'INDICE_IPC' || tipoAumento === 'INDICE_ICL'
                        ? 'Los aumentos por índice se calculan al guardar el contrato usando los valores oficiales.'
                        : `Al guardar, el contrato iniciará con ${config.currency_code} ${retroMontoEditado.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Los aumentos futuros seguirán aplicándose según la periodicidad configurada.`
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* ⚠️ Modal de Doble Confirmación para Contrato Retroactivo */}
              {showRetroConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-4 border border-amber-200">
                    <div className="flex items-center gap-3 border-b border-amber-200 pb-3">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-jakarta font-bold text-renta-950">
                          Confirmar Contrato Retroactivo
                        </h3>
                        <p className="text-[11px] text-renta-500">
                          Estás creando un contrato con fecha de inicio en el pasado
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs bg-amber-50/80 rounded-xl p-4 border border-amber-100">
                      <div className="flex justify-between">
                        <span className="text-renta-600">Fecha de inicio</span>
                        <span className="font-semibold text-renta-950">
                          {retroFormDataRef.current?.fecha_inicio
                            ? new Date(retroFormDataRef.current.fecha_inicio).toLocaleDateString()
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-renta-600">Monto inicial</span>
                        <span className="font-semibold text-renta-950">
                          {config.currency_code} {Number(retroFormDataRef.current?.monto_inicial || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-renta-600">Períodos transcurridos</span>
                        <span className="font-semibold text-renta-950">{retroPreview?.periodos} × {periodicidadAumento}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-amber-200">
                        <span className="font-semibold text-emerald-800">Monto actual <span className="text-[10px] font-normal">({retroMontoManual.current ? 'editado manualmente' : 'calculado automáticamente'})</span></span>
                        <span className="font-bold text-emerald-700">
                          {config.currency_code} {retroMontoEditado.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="bg-amber-100/60 rounded-xl p-3 flex items-start gap-2.5 border border-amber-200">
                      <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Al confirmar, se generará el contrato con el monto actual indicado y se crearán las cuotas desde la fecha de inicio.
                        Los aumentos futuros continuarán aplicándose según la periodicidad configurada.
                        <strong className="block mt-1">Esta acción no se puede deshacer.</strong>
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={cancelRetroSubmit}
                        className="px-5 py-2.5 rounded-xl ring-1 ring-inset ring-admin-border bg-white text-sm font-semibold text-renta-700 hover:bg-renta-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={confirmRetroSubmit}
                        className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20 flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Sí, Confirmar y Crear
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl ring-1 ring-inset ring-admin-border border-transparent bg-white text-sm font-semibold text-renta-700 hover:bg-renta-50 transition-colors"
          >
            <X className="h-4 w-4" /> Cancelar
          </button>
          
          <button 
            type="submit" 
            disabled={isSubmitting || isUploadingFiles}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-renta-950 text-white text-sm font-semibold hover:bg-renta-800 disabled:opacity-50 transition-colors shadow-lg shadow-renta-950/20"
          >
            {isUploadingFiles ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo Archivos...</>
            ) : isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
            ) : (
              <><Save className="h-4 w-4" /> Guardar y Generar Cuotas Atómicas</>
            )}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
