import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contratoSchema, type ContratoFormData } from '@/types/contrato';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { Save, X, FileText, Calendar, Building, User, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ContratoFormProps {
  propiedadesDisponibles: { uid_prop: string; direccion: string }[];
  inquilinosSeleccionables: { uid_inq: string; nombre: string; dni: string }[];
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

export function ContratoForm({ propiedadesDisponibles, inquilinosSeleccionables, onCancel, onSubmitSuccess }: ContratoFormProps) {
  const { inmobiliaria_id } = useInmobiliaria();
  const navigate = useNavigate();

  const methods = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      inmobiliaria_id: '',
      uid_propiedad: '',
      uid_inquilino: '',
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

  const { register, handleSubmit, formState: { errors, isSubmitting }, control, setValue } = methods;

  const onSubmit = async (data: ContratoFormData) => {
    try {
      // 🚨 MUX SECURITY (ZERO LEAKS): Inyectar Master Filter antes de enviarlo
      const payload: ContratoFormData = {
        ...data,
        inmobiliaria_id: inmobiliaria_id || undefined
      };

      // const response = await eden.contratos.post(payload);
      
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
       console.error('Error generando contrato:', error);
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
                    {propiedadesDisponibles.map(prop => (
                      <option key={prop.uid_prop} value={prop.uid_prop}>{prop.direccion}</option>
                    ))}
                  </select>
                  {errors.uid_propiedad && <p className="text-xs text-red-500 font-medium">{errors.uid_propiedad.message}</p>}
                  <p className="text-[10px] text-renta-500">Solo se listan inmuebles con estado "DISPONIBLE".</p>
               </div>

               <div className="space-y-1.5 pt-1">
                  <label className="text-sm font-semibold text-renta-900 flex items-center gap-1.5">
                     Inquilino Titular <User className="h-3 w-3" /> <span className="text-red-500">*</span>
                  </label>
                  <select 
                    {...register('uid_inquilino')}
                    className={cn(
                      "w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all",
                      errors.uid_inquilino ? "border-red-400 focus:ring-red-400" : "border-admin-border focus:border-renta-300 focus:ring-renta-200 text-renta-950"
                    )}
                  >
                    <option value="">-- Seleccione un Inquilino --</option>
                    {inquilinosSeleccionables.map(inq => (
                      <option key={inq.uid_inq} value={inq.uid_inq}>{inq.nombre} (DNI: {inq.dni})</option>
                    ))}
                  </select>
                  {errors.uid_inquilino && <p className="text-xs text-red-500 font-medium">{errors.uid_inquilino.message}</p>}
                  <p className="text-[10px] text-renta-500">La validación de DNI es obligatoria (Búnker Rule).</p>
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
                 <label className="text-sm font-semibold text-renta-900">Monto Base Inicial (Mensual) <span className="text-red-500">*</span></label>
                 <div className="relative">
                   <span className="absolute left-3 top-2.5 text-renta-500 font-bold">$</span>
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
               </div>
               
               {/* Transición Suave / Mid-Month Onboarding */}
               <div className="pt-5 border-t border-admin-border-subtle space-y-3">
                 <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-renta-900 leading-tight">Estado de Pago Actual</h4>
                      <p className="text-[10px] text-renta-500">¿El inquilino ya abonó el alquiler correspondiente al mes actual al momento de firmar/registrarse?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" className="sr-only peer" {...register('pago_mes_curso')} />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                 </div>
                 
                 {pagoMesCurso && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex gap-2.5 animate-fade-in">
                       <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                       <p className="text-[10px] leading-relaxed text-blue-700 font-semibold">
                          Se omitirá la generación de cuota para el mes de inicio actual. Las estadísticas de rentabilidad 
                          no contabilizarán este periodo saldado, corriendo los KPIs recién a partir del próximo mes.
                       </p>
                    </div>
                 )}
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
                        <option value="INDICE_ICL_IPC">Actualización por Índices Oficiales (ICL/IPC)</option>
                        <option value="PORCENTAJE_MANUAL">Porcentaje Manual / Fijo</option>
                      </select>
                      {errors.reglas_aumento?.tipo_aumento && <p className="text-[10px] text-red-500 font-medium">{errors.reglas_aumento.tipo_aumento.message}</p>}
                      {tipoAumento === 'INDICE_ICL_IPC' && (
                        <p className="text-[10px] text-emerald-700 bg-emerald-100 p-2 rounded-lg mt-2">
                           El valor del ICL/IPC deberá ser introducido en cada periodo de ajuste por la Inmobiliaria. 
                           El sistema notificará a todos los administradores.
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
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold animate-fade-in border-l-4 border-l-red-500">
             Hay errores de validación en el formulario. Asegúrese de completar DNI y seleccionar una Periodicidad.
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
