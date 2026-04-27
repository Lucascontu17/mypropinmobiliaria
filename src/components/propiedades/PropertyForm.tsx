import { useState, useEffect, useRef, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertySchema, type PropertyFormData } from '@/types/property';
import { Save, X, Home, Map, Zap, DollarSign, Loader2, CheckCircle2, Tag, RefreshCw, UserPlus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRegion } from '@/hooks/useRegion';
import { useActiveAddons } from '@/hooks/useActiveAddons';
import { useApi } from '@/hooks/useApi';
import { GalleryUploader } from './GalleryUploader';
import { MapPicker } from './MapPicker';
import { toast } from 'sonner';

interface ProveedorOpcion {
  id: string;
  nombre: string;
}

interface PropertyFormProps {
  initialData?: Partial<PropertyFormData>;
  owners: ProveedorOpcion[];
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function PropertyForm({ initialData, owners, onSubmitSuccess, onCancel }: PropertyFormProps) {
  const { inmobiliaria_id } = useInmobiliaria();
  const { currency_code } = useRegion();
  const { hasAddon } = useActiveAddons();
  const { apiFetch } = useApi();
  const hasAiCopilot = hasAddon('Zonatia AI Copilot');

  const methods = useForm<PropertyFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(propertySchema) as any,
    defaultValues: initialData || {
      owner_id: '',
      direccion: '',
      status: 'DISPONIBLE',
      valor_alquiler: '0',
      imagenes: [],
      // Detalles Técnicos (v1.9.0)
      mts2: '0',
      habitaciones: 0,
      ambientes: 1,
      banos: 0,
      antiguedad: 0,
      cocheras: 0,
      // 1:1 Parity Columns
      has_luz: false,
      has_gas: false,
      has_agua: false,
      has_expensas: false,
      has_abl: false,
      moneda: currency_code as any,
      operacion: 'alquiler',
      valor_venta: '0',
      provincia: '',
      ciudad: '',
      barrio: ''
    }
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = methods;

  const onSubmit = async (data: PropertyFormData) => {
    try {
      // 🚨 MUX SECURITY (ZERO LEAKS): Force inmobiliaria_id
      // 🔄 LÓGICA DE TRANSICIÓN: Vendida -> Alquiler (Requested by User)
      const isTransition = data.operacion === 'venta' && data.status === 'VENDIDA' && gestionaAlquiler;
      
      const payload = {
        ...data,
        inmobiliaria_id,
        ...(isTransition ? {
          operacion: 'alquiler',
          status: 'DISPONIBLE',
          // valor_alquiler ya fue actualizado vía setValue
        } : {})
      };

      const { imagenes, ...rest } = payload;

      // 🛠️ PERSISTENCIA EN EL BÚNKERA (v3.5.0 protocol)
      const hasImages = Array.isArray(imagenes) && imagenes.length > 0;
      let response: any;

      if (hasImages) {
        console.log("[PROPIEDAD-FORM] Submitting via FormData (with images):", rest);
        const fd = new FormData();
        fd.append('data', JSON.stringify(rest));
        imagenes.forEach((file) => fd.append('imagenes', file));
        
        // Use raw fetch for FormData - Eden Treaty doesn't handle multipart properly
        response = await apiFetch('/admin/propiedades', {
          method: 'POST',
          body: fd,
          headers: {
            // IMPORTANT: Do NOT set Content-Type for FormData - browser auto-sets with boundary
          }
        });
      } else {
        console.log("[PROPIEDAD-FORM] Submitting via JSON (no images):", rest);
        response = await apiFetch('/admin/propiedades', {
          method: 'POST',
          body: JSON.stringify(rest),
        });
      }

      if (response && !response.success) {
        const errorMsg = response?.error || "Error desconocido";
        console.error("[PROPIEDAD-POST] Error:", errorMsg);
        toast.error("Error al persistir en El Búnker: " + (typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg));
        return;
      }

      toast.success("Propiedad ingresada correctamente al inventario.", {
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      });

      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      toast.error("Error de conectividad con el servidor.");
      console.error('Error al guardar propiedad:', error);
    }
  };

  const currentStatus = watch('status');
  const currentOperacion = watch('operacion');
  const currentMoneda = watch('moneda');

  // Estado local para el flujo de transformación Venta -> Alquiler
  const [gestionaAlquiler, setGestionaAlquiler] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
  
  // AI Copilot State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiTone, setAiTone] = useState('Lujoso y Profesional');

  // --- Google Maps Autocomplete Implementation ---
  const autocompleteRef = useRef<any>(null);

  const initAutocomplete = useCallback(async (container: HTMLDivElement) => {
    if (!window.google || autocompleteRef.current) return;

    try {
      // @ts-ignore
      const { PlaceAutocompleteElement } = await google.maps.importLibrary('places');
      
      const pac = new PlaceAutocompleteElement({
        // Quitamos la restricción dura de región para probar si es lo que bloquea los resultados
        // includedRegionCodes: [currentMoneda === 'ARS' ? 'AR' : currentMoneda === 'MXN' ? 'MX' : 'AR'],
      });

      // Inyección de estilos para que calce en el diseño premium (Zonatia Style)
      pac.style.setProperty('--gmpx-font-family-base', 'Inter, sans-serif');
      pac.style.setProperty('--gmpx-font-size-base', '0.875rem');
      pac.style.setProperty('--gmpx-color-surface', '#ffffff');
      pac.style.setProperty('--gmpx-color-on-surface', '#102324');
      pac.style.setProperty('--gmpx-color-primary', '#102324');
      pac.style.width = '100%';
      
      // Sincronizar el valor escrito con react-hook-form
      // Usamos el inputElement interno para asegurar que capturamos el evento
      setTimeout(() => {
        if (pac.inputElement) {
          pac.inputElement.addEventListener('input', (e: any) => {
            const val = e.target.value;
            setValue('direccion', val, { shouldValidate: val.length > 5 });
          });
          // Asegurar estilos del input interno
          pac.inputElement.style.padding = '10px 16px';
        }
      }, 100);
      
      container.appendChild(pac);
      autocompleteRef.current = pac;

      pac.addEventListener('gmp-select', async (event: any) => {
        const place = event.placePrediction.toPlace();
        
        // Fetch specific fields (Places API New protocol)
        await place.fetchFields({
          fields: ['location', 'formattedAddress', 'addressComponents', 'viewport']
        });

        if (!place.location) {
          toast.error("No se pudo obtener la ubicación precisa para esta dirección.");
          return;
        }

        const address = place.formattedAddress || '';
        setValue('direccion', address, { shouldValidate: true });

        // Extract coordinates
        setValue('latitud', place.location.lat(), { shouldValidate: true });
        setValue('longitud', place.location.lng(), { shouldValidate: true });

        // Extract address components (City, Province, Neighborhood)
        let provincia = '', ciudad = '', barrio = '';
        place.addressComponents?.forEach(comp => {
          const types = comp.types;
          if (types.includes('administrative_area_level_1')) provincia = comp.longText;
          if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            if (!ciudad || types.includes('locality')) ciudad = comp.longText;
          }
          if (types.includes('sublocality') || types.includes('neighborhood')) {
            barrio = comp.longText;
          }
        });

        if (provincia) setValue('provincia', provincia);
        if (ciudad) setValue('ciudad', ciudad);
        if (barrio) setValue('barrio', barrio);

        toast.success("Dirección verificada con éxito.");
      });
    } catch (err) {
      console.error("Error al inicializar PlaceAutocompleteElement:", err);
    }
  }, [setValue, currentMoneda]);

  const setAddressContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      if (window.google) {
        initAutocomplete(node);
      } else {
        const interval = setInterval(() => {
          if (window.google) {
            initAutocomplete(node);
            clearInterval(interval);
          }
        }, 500);
        setTimeout(() => clearInterval(interval), 5000);
      }
    }
  }, [initAutocomplete]);

  useEffect(() => {
    return () => {
      if (window.google && autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, []);

  const handleGenerateAiCopy = async () => {
    const currentData = watch();
    if (!currentData.tipo_inmueble || !currentData.mts2 || !currentData.valor_alquiler) {
        toast.error("Faltan datos básicos", { description: "Por favor completa al menos el tipo de inmueble, superficie y valor para que la IA tenga contexto." });
        return;
    }

    setIsGeneratingAi(true);
    try {
        const response: any = await apiFetch('/ai/generate-copy', {
            method: 'POST',
            body: JSON.stringify({
                propertyData: currentData,
                tono: aiTone
            })
        });

        if (response?.success && response?.data) {
            setValue('titulo', response.data.titulo, { shouldValidate: true, shouldDirty: true });
            setValue('descripcion', response.data.descripcion, { shouldValidate: true, shouldDirty: true });
            toast.success("¡Textos generados con éxito!", { icon: '✨' });
        } else {
            throw new Error(response?.error || 'Error desconocido al generar copy');
        }
    } catch (error: any) {
        toast.error("Error de la IA", { description: error.message });
    } finally {
        setIsGeneratingAi(false);
    }
  };

  useEffect(() => {
    if (currentStatus !== 'DISPONIBLE') {
      setValue('titulo', null as any);
      setValue('descripcion', null as any);
    }
  }, [currentStatus, setValue]);

  const { onChange: rStatusOnChange, ...rStatusRest } = register('status');

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-inter bg-white p-6 rounded-2xl border border-admin-border shadow-sm max-w-5xl mx-auto">
        <div className="flex justify-between items-center border-b border-admin-border-subtle pb-4">
          <h2 className="text-xl font-bold font-jakarta text-renta-950 flex items-center gap-2">
            <Home className="h-5 w-5 text-renta-600" />
            {initialData ? 'Editar Ficha Técnica' : 'Alta de Inventario Patrimonial'}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Columna Izquierda: Datos Básicos y Geografía */}
          <div className="space-y-6">
            <div className="bg-renta-50/30 p-5 rounded-2xl border border-admin-border space-y-4">
              <h3 className="text-sm font-jakarta font-bold text-renta-900 flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4" /> Datos Comerciales
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-renta-900">Tipo de Operación <span className="text-red-500">*</span></label>
                  <select 
                    {...register('operacion')}
                    className="w-full rounded-xl border border-admin-border bg-white px-4 py-2.5 text-sm focus:border-renta-300 focus:outline-none focus:ring-1 focus:ring-renta-200 text-renta-950 font-bold"
                  >
                    <option value="alquiler">🔑 Alquiler</option>
                    <option value="venta">💰 Venta</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-renta-900">Divisa de Negocio <span className="text-red-500">*</span></label>
                  <select 
                    {...register('moneda')}
                    className="w-full rounded-xl border border-admin-border bg-white px-4 py-2.5 text-sm focus:border-renta-300 focus:outline-none focus:ring-1 focus:ring-renta-200 text-renta-950"
                  >
                    <option value={currency_code}>{currency_code} (Local)</option>
                    <option value="USD">USD (Dólares)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-renta-900">Tipo de Inmueble <span className="text-red-500">*</span></label>
                <select 
                  {...register('tipo_inmueble')}
                  className={cn(
                    "w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:border-renta-300 focus:outline-none focus:ring-1 focus:ring-renta-200 text-renta-950",
                    errors.tipo_inmueble ? "border-red-400" : "border-admin-border"
                  )}
                >
                  <option value="">-- Seleccionar Tipo --</option>
                  <option value="departamento">🏢 Departamento</option>
                  <option value="casa">🏡 Casa</option>
                  <option value="ph">🏘️ PH</option>
                  <option value="local">🏬 Local</option>
                  <option value="terreno">🌱 Terreno</option>
                  <option value="habitacion">🛌 Habitación</option>
                  <option value="otro">❓ Otro</option>
                </select>
                {errors.tipo_inmueble && <p className="text-xs text-red-500 font-medium">{errors.tipo_inmueble.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-renta-900">Propietario Vinculado <span className="text-red-500">*</span></label>
                <select 
                  {...register('owner_id')}
                  className={cn(
                    "w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:border-renta-300 focus:outline-none focus:ring-1 focus:ring-renta-200 text-renta-950",
                    errors.owner_id ? "border-red-400" : "border-admin-border"
                  )}
                >
                  <option value="">-- Seleccionar Propietario Vidu --</option>
                  {owners?.map(owner => (
                    <option key={owner.id} value={owner.id}>
                      {owner.nombre || 'Sin nombre'}
                    </option>
                  ))}
                </select>
                {errors.owner_id && <p className="text-xs text-red-500 font-medium">{errors.owner_id.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-renta-900">
                    {currentOperacion === 'alquiler' ? 'Valor Alquiler' : 'Valor de Venta'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-renta-500 font-semibold">{currentMoneda === 'USD' ? 'US$' : '$'}</span>
                    <input
                      {...register(currentOperacion === 'alquiler' ? 'valor_alquiler' : 'valor_venta')}
                      type="text"
                      className={cn(
                        "w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 text-renta-950 font-bold",
                        (currentOperacion === 'alquiler' ? errors.valor_alquiler : errors.valor_venta) ? "border-red-400" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
                      )}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-renta-900 text-right block">Estado del Inmueble</label>
                  <select 
                    {...rStatusRest}
                    value={currentStatus}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (initialData && currentStatus !== 'DISPONIBLE' && val === 'DISPONIBLE') {
                        setPendingStatusChange(val);
                      } else {
                        rStatusOnChange(e);
                      }
                    }}
                    className={cn(
                      "w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:outline-none font-bold focus:ring-1",
                      currentStatus === 'DISPONIBLE' && "text-green-700 bg-green-50 border-green-200",
                      currentStatus === 'ALQUILADA' && "text-blue-700 bg-blue-50 border-blue-200",
                      currentStatus === 'RESERVADA' && "text-yellow-700 bg-yellow-50 border-yellow-200",
                      currentStatus === 'VENDIDA' && "text-gray-700 bg-gray-50 border-gray-300",
                      currentStatus === 'VENTA' && "text-orange-700 bg-orange-50 border-orange-200"
                    )}
                  >
                    {currentOperacion === 'alquiler' ? (
                      <>
                        <option value="DISPONIBLE">🟢 Disponible</option>
                        <option value="ALQUILADA">🔴 No Disponible (Alquilada)</option>
                      </>
                    ) : (
                      <>
                        <option value="DISPONIBLE">🟢 Disponible (Publicar)</option>
                        <option value="RESERVADA">🟡 Reservado</option>
                        <option value="VENDIDA">⚫ Vendido</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* FLUJO DINÁMICO: "VENDIDO" -> ¿TRANSICIÓN A ALQUILER? */}
              {currentOperacion === 'venta' && currentStatus === 'VENDIDA' && (
                <div className="mt-4 p-4 rounded-xl border-2 border-dashed border-admin-border bg-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <RefreshCw className="h-4 w-4 text-renta-600 animate-spin-slow" />
                       <h4 className="text-xs font-bold text-renta-900 uppercase tracking-wider">Cierre de Venta y Transmisión</h4>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                       <span className="text-[10px] font-bold text-renta-500">¿PASAR A GESTIÓN DE ALQUILER?</span>
                       <input 
                         type="checkbox" 
                         checked={gestionaAlquiler} 
                         onChange={(e) => {
                            setGestionaAlquiler(e.target.checked);
                            if (e.target.checked) {
                              toast.info("Modo Transmisión Activado", {
                                description: "La propiedad se convertirá automáticamente a Alquiler al guardar."
                              });
                            }
                         }} 
                         className="w-4 h-4 rounded text-renta-600" 
                       />
                    </label>
                  </div>

                  {gestionaAlquiler && (
                    <div className="space-y-4 pt-2 border-t border-admin-border-subtle">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-renta-700 uppercase flex items-center gap-1">
                              <UserPlus className="h-3 w-3" /> Nuevo Propietario (Titular Adquiriente)
                           </label>
                           <select 
                             className="w-full rounded-lg border border-admin-border bg-white px-3 py-2 text-xs"
                             onChange={(e) => setValue('owner_id', e.target.value)}
                           >
                              <option value="">-- Seleccionar Comprador --</option>
                              {owners?.map(o => <option key={o.id} value={o.id}>{o.nombre || 'Sin nombre'}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-renta-700 uppercase">Valor de Alquiler Inicial</label>
                           <div className="relative">
                              <span className="absolute left-2.5 top-1.5 text-renta-500 font-bold text-xs">$</span>
                              <input 
                                type="text"
                                className="w-full rounded-lg border border-admin-border bg-white pl-6 pr-3 py-1.5 text-xs font-bold"
                                placeholder="Monto para la nueva ficha"
                                onChange={(e) => setValue('valor_alquiler', e.target.value)}
                              />
                           </div>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2">
                           <CheckCircle2 className="h-3.3 w-3.3 text-emerald-600" />
                           <p className="text-[9px] text-emerald-800 leading-tight">
                              Al guardar, la propiedad será cargada como <strong>DISPONIBLE</strong> en modo <strong>ALQUILER</strong> 
                              bajo la titularidad del nuevo propietario seleccionado.
                           </p>
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECCIÓN DE PUBLICACIÓN CONDICIONAL */}
            {currentStatus === 'DISPONIBLE' && (
              <div id="datos-publicacion" className="bg-blue-50/30 p-5 rounded-2xl border border-blue-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                   <h3 className="text-sm font-jakarta font-bold text-blue-900 flex items-center gap-2">
                      <Tag className="h-4 w-4" /> Datos de Publicación (Landing Page)
                   </h3>
                   {hasAiCopilot && (
                     <div className="flex items-center gap-2">
                        <select 
                          value={aiTone}
                          onChange={(e) => setAiTone(e.target.value)}
                          className="text-xs border-blue-200 bg-white rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300 text-blue-900 font-medium"
                        >
                           <option value="Lujoso y Profesional">💎 Lujoso</option>
                           <option value="Dinámico y Juvenil">🚀 Dinámico</option>
                           <option value="Formal y Descriptivo">📋 Formal</option>
                           <option value="Directo y Comercial">🎯 Comercial</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleGenerateAiCopy}
                          disabled={isGeneratingAi}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 transition-all"
                        >
                           {isGeneratingAi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                           {isGeneratingAi ? 'Pensando...' : 'Autocompletar'}
                        </button>
                     </div>
                   )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-sm font-semibold text-blue-900">Título Atractivo <span className="text-red-500">*</span></label>
                     <input 
                       {...register('titulo')} 
                       className={cn("w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all text-renta-950 font-semibold", errors.titulo ? "border-red-400" : "border-blue-200 focus:border-blue-400 focus:ring-blue-100")} 
                       placeholder="Ej: Espectacular Semipiso con Vista al Río" 
                     />
                     {errors.titulo && <p className="text-xs text-red-500 font-medium">{errors.titulo.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-sm font-semibold text-blue-900">Descripción Detallada <span className="text-red-500">*</span></label>
                     <textarea 
                       {...register('descripcion')} 
                       rows={4} 
                       className={cn("w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all text-renta-950", errors.descripcion ? "border-red-400" : "border-blue-200 focus:border-blue-400 focus:ring-blue-100")} 
                       placeholder="Describe las mejores características de la propiedad..." 
                     />
                     {errors.descripcion && <p className="text-xs text-red-500 font-medium">{errors.descripcion.message}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-renta-50/30 p-5 rounded-2xl border border-admin-border space-y-4">
              <h3 className="text-sm font-jakarta font-bold text-renta-900 flex items-center gap-2 mb-3">
                <Map className="h-4 w-4" /> Geoespacial
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-renta-900">Dirección Exacta <span className="text-red-500">*</span></label>
                <div 
                  ref={setAddressContainerRef}
                  className={cn(
                    "min-h-[42px] rounded-xl border bg-white transition-all overflow-visible z-[60] relative",
                    errors.direccion ? "border-red-400" : "border-admin-border"
                  )}
                />
                <input type="hidden" {...register('direccion')} />
                {errors.direccion && <p className="text-xs text-red-500 font-medium">{errors.direccion.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-renta-500 uppercase tracking-wider">Provincia / Estado</label>
                  <input
                    {...register('provincia')}
                    className="w-full rounded-lg border border-admin-border bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-renta-200 text-renta-900"
                    placeholder="Auto-fill..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-renta-500 uppercase tracking-wider">Ciudad</label>
                  <input
                    {...register('ciudad')}
                    className="w-full rounded-lg border border-admin-border bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-renta-200 text-renta-900"
                    placeholder="Auto-fill..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-renta-500 uppercase tracking-wider">Barrio / Colonia</label>
                  <input
                    {...register('barrio')}
                    className="w-full rounded-lg border border-admin-border bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-renta-200 text-renta-900"
                    placeholder="Auto-fill..."
                  />
                </div>
              </div>

              <MapPicker />
            </div>

            {/* Nueva Sección: Detalles Técnicos (Luxury Minimalist) */}
            <div className="bg-white p-5 rounded-2xl border border-admin-border space-y-4 shadow-sm">
              <h3 className="text-sm font-jakarta font-bold text-renta-900 flex items-center gap-2 mb-3 tracking-tight">
                <div className="bg-renta-100 p-1 rounded-md">
                   <Home className="h-4 w-4 text-renta-600" />
                </div>
                Especificaciones Técnicas
              </h3>

              {watch('tipo_inmueble') === 'departamento' && (
                <div className="grid grid-cols-2 gap-4 pb-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-jakarta text-renta-600 uppercase tracking-wider">Piso</label>
                    <input
                      {...register('piso')}
                      type="text"
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-4 py-2 text-sm font-inter focus:border-renta-300 focus:ring-1 focus:ring-renta-200 transition-all text-renta-950"
                      placeholder="Ej: 2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-jakarta text-renta-600 uppercase tracking-wider">Departamento</label>
                    <input
                      {...register('departamento_unidad')}
                      type="text"
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-4 py-2 text-sm font-inter focus:border-renta-300 focus:ring-1 focus:ring-renta-200 transition-all text-renta-950"
                      placeholder="Ej: B"
                    />
                  </div>
                </div>
              )}

              {watch('tipo_inmueble') === 'ph' && (
                <div className="grid grid-cols-1 gap-4 pb-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-jakarta text-renta-600 uppercase tracking-wider">Interno</label>
                    <input
                      {...register('interno')}
                      type="text"
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-4 py-2 text-sm font-inter focus:border-renta-300 focus:ring-1 focus:ring-renta-200 transition-all text-renta-950"
                      placeholder="Ej: PB, 1er Piso al fondo"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-jakarta text-renta-600 uppercase tracking-wider">Superficie Total (m²)</label>
                  <input
                    {...register('mts2')}
                    type="text"
                    className={cn(
                      "w-full rounded-xl border bg-admin-surface px-4 py-2 text-sm font-inter focus:ring-1 focus:ring-renta-200 transition-all text-renta-950",
                      errors.mts2 ? "border-red-400" : "border-admin-border focus:border-renta-300"
                    )}
                    placeholder="0.00"
                  />
                  {errors.mts2 && <p className="text-[10px] text-red-500 font-medium">{errors.mts2.message}</p>}
                </div>

                <div className="grid grid-cols-3 gap-3 col-span-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-jakarta text-renta-600 uppercase tracking-wider">Ambientes</label>
                    <select
                      {...register('ambientes', { valueAsNumber: true })}
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-4 py-2 text-sm font-inter focus:border-renta-300 focus:ring-1 focus:ring-renta-200 transition-all text-renta-950 cursor-pointer"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>4 o más de 4</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-jakarta text-renta-600 uppercase tracking-wider">Habitaciones</label>
                    <input
                      {...register('habitaciones', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-4 py-2 text-sm font-inter focus:border-renta-300 focus:ring-1 focus:ring-renta-200 transition-all text-renta-950"
                    />
                  </div>
                   <div className="space-y-1.5">
                    <label className="text-xs font-bold font-jakarta text-renta-600 uppercase tracking-wider">Baños</label>
                    <input
                      {...register('banos', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-4 py-2 text-sm font-inter focus:border-renta-300 focus:ring-1 focus:ring-renta-200 transition-all text-renta-950"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 col-span-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-jakarta text-renta-600 uppercase tracking-wider">Cocheras</label>
                    <input
                      {...register('cocheras', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="w-full rounded-xl border border-admin-border bg-admin-surface px-4 py-2 text-sm font-inter focus:border-renta-300 focus:ring-1 focus:ring-renta-200 transition-all text-renta-950"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-jakarta text-renta-600 uppercase tracking-wider">Antigüedad</label>
                    <div className="relative">
                       <input
                        {...register('antiguedad', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        className="w-full rounded-xl border border-admin-border bg-admin-surface px-4 py-2 text-sm font-inter focus:border-renta-300 focus:ring-1 focus:ring-renta-200 transition-all text-renta-950"
                      />
                      <span className="absolute right-3 top-2 text-[10px] text-renta-400 font-bold">AÑOS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Multimedia y Servicios */}
          <div className="space-y-6">
            <div className="bg-renta-50/30 p-5 rounded-2xl border border-admin-border">
               <h3 className="text-sm font-jakarta font-bold text-renta-900 flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4" /> Configuración de Servicios
               </h3>
               
               <div className="space-y-3">
                 {[
                   { key: 'has_luz', label: 'Energía Eléctrica (Luz)' },
                   { key: 'has_gas', label: 'Gas Natural' },
                   { key: 'has_agua', label: 'Agua Corriente' },
                   { key: 'has_expensas', label: 'Expensas Comunes' },
                   { key: 'has_abl', label: 'Impuesto ABL / Municipal' }
                 ].map((servicio) => (
                    <div key={servicio.key} className="space-y-2">
                      <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-admin-border-subtle cursor-pointer hover:bg-renta-50 transition-colors">
                        <input 
                          type="checkbox"
                          {...register(servicio.key as keyof PropertyFormData)}
                          className="w-4 h-4 text-renta-600 rounded border-gray-300 focus:ring-renta-500"
                        />
                        <span className="text-sm font-semibold text-renta-900">{servicio.label}</span>
                      </label>
                      
                      {/* Despliegue condicional para Expensas */}
                      {servicio.key === 'has_expensas' && watch('has_expensas') && (
                        <div className="pl-4 pr-3 py-1 animate-in fade-in slide-in-from-top-1">
                          <label className="text-[10px] font-bold text-renta-700 uppercase tracking-wider mb-1.5 block">
                            Valor Mensual de Expensas <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-renta-500 font-semibold">{currentMoneda === 'USD' ? 'US$' : '$'}</span>
                            <input
                              {...register('valor_expensas', { required: watch('has_expensas') ? "Ingrese el valor de las expensas" : false })}
                              type="text"
                              placeholder="0.00"
                              className={cn(
                                "w-full rounded-xl border bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 text-renta-950 font-bold",
                                errors.valor_expensas ? "border-red-400" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
                              )}
                            />
                          </div>
                          {errors.valor_expensas && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.valor_expensas.message}</p>}
                        </div>
                      )}

                      {/* Despliegue condicional para ABL */}
                      {servicio.key === 'has_abl' && watch('has_abl') && (
                        <div className="pl-4 pr-3 py-1 animate-in fade-in slide-in-from-top-1 space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-renta-700 uppercase tracking-wider mb-1 block">
                              Modalidad de ABL <span className="text-red-500">*</span>
                            </label>
                            <select
                              {...register('tipo_abl', { required: watch('has_abl') ? "Seleccione la modalidad" : false })}
                              className="w-full rounded-xl border border-admin-border bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-renta-200 text-renta-950 font-bold"
                            >
                              <option value="">-- Seleccionar --</option>
                              <option value="fijo">Monto Fijo Mensual</option>
                              <option value="variable">Monto Variable (A cargar cada mes)</option>
                            </select>
                            {errors.tipo_abl && <p className="text-[10px] text-red-500 font-medium">{errors.tipo_abl.message}</p>}
                          </div>
                          
                          {watch('tipo_abl') === 'fijo' && (
                            <div className="animate-in fade-in slide-in-from-top-1">
                              <label className="text-[10px] font-bold text-renta-700 uppercase tracking-wider mb-1.5 block">
                                Valor Fijo Mensual de ABL <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-renta-500 font-semibold">{currentMoneda === 'USD' ? 'US$' : '$'}</span>
                                <input
                                  {...register('valor_abl', { required: watch('tipo_abl') === 'fijo' ? "Ingrese el valor fijo" : false })}
                                  type="text"
                                  placeholder="0.00"
                                  className={cn(
                                    "w-full rounded-xl border bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 text-renta-950 font-bold",
                                    errors.valor_abl ? "border-red-400" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
                                  )}
                                />
                              </div>
                              {errors.valor_abl && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.valor_abl.message}</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                 ))}
               </div>
            </div>

            <div className="bg-renta-50/30 p-5 rounded-2xl border border-admin-border">
              <GalleryUploader name="imagenes" />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-admin-border-subtle mt-4">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-admin-border bg-white text-sm font-semibold text-renta-700 hover:bg-renta-50 transition-colors"
            >
              <X className="h-4 w-4" /> Cancelar
            </button>
          )}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-renta-950 text-white text-sm font-semibold hover:bg-renta-800 disabled:opacity-50 transition-colors shadow-lg shadow-renta-950/20"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
            {initialData ? 'Guardar Cambios' : 'Ingresar Propiedad'}
          </button>
        </div>

        {/* Debug UI feedback for User Architect */}
        {Object.keys(errors).length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
             Corrija los campos en rojo para poder guardar el inventario.
          </div>
        )}

      </form>

      {/* Modal de Transición de Estado a DISPONIBLE */}
      {pendingStatusChange && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-renta-950/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl animate-slide-up">
              <div className="flex items-center gap-3 mb-4 text-blue-600">
                 <div className="p-3 bg-blue-50 rounded-full">
                    <Tag className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-jakarta font-bold text-renta-950">Publicar Propiedad</h3>
              </div>
              <p className="font-inter text-renta-600 mb-6 leading-relaxed">
                Estás por cambiar el estado a <strong>Disponible</strong>. Esto publicará la propiedad en la Landing Page a la vista de los clientes. Por favor, asegúrate de rellenar o revisar el <strong>Título</strong> y la <strong>Descripción</strong>.
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-renta-100">
                 <button 
                   type="button" 
                   onClick={() => setPendingStatusChange(null)} 
                   className="px-5 py-2.5 text-sm font-semibold text-renta-600 hover:bg-renta-50 rounded-xl transition-colors"
                 >
                   Cancelar
                 </button>
                 <button 
                   type="button" 
                   onClick={() => {
                      setValue('status', pendingStatusChange as any, { shouldValidate: true });
                      setPendingStatusChange(null);
                      setTimeout(() => {
                         const element = document.getElementById('datos-publicacion');
                         if (element) {
                           element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                           element.classList.add('ring-4', 'ring-blue-100');
                           setTimeout(() => element.classList.remove('ring-4', 'ring-blue-100'), 2000);
                         }
                      }, 150);
                   }} 
                   className="px-5 py-2.5 text-sm font-bold bg-renta-950 text-white rounded-xl hover:bg-renta-800 transition-colors shadow-md"
                 >
                   Entendido
                 </button>
              </div>
           </div>
        </div>
      )}

    </FormProvider>
  );
}
