import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transaccionSchema, type TransaccionFormData, type PagoEnCuenta } from '@/types/cobranzas';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { NumericInput } from '@/components/common/NumericInput';
import { X, Save, Wallet, AlertCircle, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEden, BASE_URL } from '@/services/eden';
import { toast } from 'sonner';
import { generateReceiptPDF } from '@/utils/receiptGenerator';
import { numeroALetras } from '@/utils/numberToWords';
import { CheckCircle2 } from 'lucide-react';

interface RegistrarIngresoModalProps {
  pagoDestino: PagoEnCuenta;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RegistrarIngresoModal({ pagoDestino, onClose, onSuccess }: RegistrarIngresoModalProps) {
  const { inmobiliaria_id, nombre: nombreInmobiliaria } = useInmobiliaria();
  const { config, formatCurrency, country_code } = useRegion();
  const { client: eden, token } = useEden();
  type ConceptoKey = 'alquiler' | 'expensas' | 'abl' | 'luz' | 'gas' | 'agua';

  const conceptosActivos = useMemo(() => {
    const list: { key: ConceptoKey; label: string; esperado: number }[] = [];
    list.push({
      key: 'alquiler',
      label: 'Alquiler',
      esperado: Number(pagoDestino.desglose_esperado?.alquiler ?? pagoDestino.monto_alquiler_base ?? 0),
    });
    if (pagoDestino.has_expensas === true || Number(pagoDestino.monto_expensas || 0) > 0) {
      list.push({
        key: 'expensas',
        label: 'Expensas',
        esperado: Number(pagoDestino.desglose_esperado?.expensas ?? pagoDestino.monto_expensas ?? 0),
      });
    }
    if (pagoDestino.has_abl === true || !!pagoDestino.tipo_abl) {
      list.push({
        key: 'abl',
        label: 'ABL',
        esperado: Number(pagoDestino.desglose_esperado?.abl ?? pagoDestino.monto_abl ?? 0),
      });
    }
    if (pagoDestino.has_luz === true) list.push({ key: 'luz', label: 'Luz', esperado: 0 });
    if (pagoDestino.has_gas === true) list.push({ key: 'gas', label: 'Gas', esperado: 0 });
    if (pagoDestino.has_agua === true) list.push({ key: 'agua', label: 'Agua', esperado: 0 });
    return list;
  }, [pagoDestino]);

  const [desglose, setDesglose] = useState<Record<ConceptoKey, number>>({
    alquiler: 0, expensas: 0, abl: 0, luz: 0, gas: 0, agua: 0,
  });
  
  const saldoRestante = (pagoDestino.monto_a_abonar || 0) - (pagoDestino.monto_abonado || 0);
  
  const { control, register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<TransaccionFormData>({
    resolver: zodResolver(transaccionSchema),
    defaultValues: {
      inmobiliaria_id: undefined,
      pago_id: pagoDestino.pago_id,
      monto: saldoRestante > 0 ? saldoRestante : 0,
      metodo: 'TRANSFERENCIA',
      fecha: new Date().toISOString().split('T')[0]
    }
  });

  const montoIngresado = Number(watch('monto') ?? 0);

  const sumaDesglose = conceptosActivos.reduce((acc, c) => acc + (desglose[c.key] || 0), 0);
  const restantePorDistribuir = Math.round((montoIngresado - sumaDesglose) * 100) / 100;

  const setConcepto = (key: ConceptoKey, val: number) => {
    const v = Number(val) || 0;
    setDesglose(prev => ({ ...prev, [key]: Math.round(v * 100) / 100 }));
  };

  const autocompletar = () => {
    const total = montoIngresado;
    const exp = conceptosActivos.find(c => c.key === 'expensas');
    const abl = conceptosActivos.find(c => c.key === 'abl');
    const otrosMonto = (exp?.esperado || 0) + (abl?.esperado || 0);
    const alquiler = Math.max(0, Math.round((total - otrosMonto) * 100) / 100);
    setDesglose({
      alquiler,
      expensas: exp?.esperado || 0,
      abl: abl?.esperado || 0,
      luz: 0, gas: 0, agua: 0,
    });
  };
  const generaSaldoAFavor = montoIngresado > saldoRestante && saldoRestante > 0;

  const onSubmit = async (data: TransaccionFormData) => {
    const total = Number(data.monto);
    const suma = conceptosActivos.reduce((acc, c) => acc + (desglose[c.key] || 0), 0);
    if (Math.abs(suma - total) > 0.01) {
      toast.error(`La suma del desglose (${formatCurrency(suma)}) no coincide con el monto total (${formatCurrency(total)}).`);
      return;
    }

    const desglosePayload = {
      alquiler: desglose.alquiler || 0,
      expensas: desglose.expensas || 0,
      abl: desglose.abl || 0,
      luz: desglose.luz || 0,
      gas: desglose.gas || 0,
      agua: desglose.agua || 0,
      otros: 0,
    };

    try {
      // 1. Registrar la Transacción en la DB
      const payload = {
        ...data,
        inmobiliaria_id: inmobiliaria_id || undefined,
        desglose: desglosePayload
      };
      
      const { data: transResponse, error: transError } = await eden.admin.transacciones.post(payload);

      if (transError || !transResponse) {
        toast.error("Error al registrar la transacción: " + JSON.stringify(transError?.value));
        return;
      }

      // 2. Generar el PDF del Recibo
      toast.info("Generando recibo digital...");
      
      const doc = await generateReceiptPDF({
        pago_id: pagoDestino.pago_id,
        contrato_id: pagoDestino.contrato_id,
        inmobiliaria: nombreInmobiliaria,
        numero_recibo: `REC-${Date.now().toString().slice(-6)}`,
        periodo: pagoDestino.periodo,
        inquilino: pagoDestino.nombre_inquilino,
        propiedad: pagoDestino.detalle_propiedad,
        monto_total: total,
        monto_letras: numeroALetras(total),
        desglose: {
          alquiler: desglosePayload.alquiler,
          expensas: desglosePayload.expensas,
          abl: desglosePayload.abl,
          luz: desglosePayload.luz,
          gas: desglosePayload.gas,
          agua: desglosePayload.agua,
        },
        metodo_pago: data.metodo,
        fecha_pago: data.fecha
      }, config.currency_locale);

      // 3. Subir el PDF al Búnker
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], 'recibo.pdf', { type: 'application/pdf' });
      
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('data', JSON.stringify({
        transaccion_id: transResponse.data.id,
        contrato_id: pagoDestino.contrato_id,
        numero_recibo: `REC-${Date.now().toString().slice(-6)}`
      }));

      // NOTA: Usamos fetch nativo porque Eden Treaty no maneja correctamente
      // FormData / multipart uploads, causando error 422 de validación en Elysia.
      const uploadRes = await fetch(`${BASE_URL}/api/v1/admin/recibos`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'x-inmobiliaria-id': inmobiliaria_id || '',
          'x-region': country_code,
        },
        // NO establecer Content-Type — el browser lo fija automáticamente
        // con el boundary correcto para multipart/form-data
        body: formData,
      });

      if (!uploadRes.ok) {
        const errBody = await uploadRes.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('[RECIBOS-UPLOAD] Error:', uploadRes.status, errBody);
        toast.error("El pago se registró pero hubo un problema al alojar el recibo.");
      } else {
        toast.success("Pago registrado y recibo generado correctamente.", {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Error crítico en el proceso de cobro.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-renta-950/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl ring-1 ring-inset ring-admin-border border-transparent overflow-hidden">
        
        <div className="bg-renta-50 px-5 py-3 flex items-center justify-between border-b border-admin-border-subtle">
           <h3 className="font-jakarta text-sm font-bold text-renta-950 flex items-center gap-2">
             <Wallet className="h-4 w-4 text-renta-600" />
             Registrar Ingreso
           </h3>
           <button onClick={onClose} className="text-renta-400 hover:text-red-500 transition-colors">
              <X className="h-4 w-4" />
           </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3 font-inter">
          {/* Inquilino + Desglose juntos */}
          <div className="bg-admin-surface-hover ring-1 ring-inset ring-admin-border border-transparent-subtle p-3 rounded-xl space-y-2">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-xs font-bold text-renta-950">{pagoDestino.nombre_inquilino}</p>
                 <p className="text-[10px] text-renta-500">{pagoDestino.detalle_propiedad}</p>
               </div>
               <span className="text-[9px] font-bold text-renta-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded ring-1 ring-inset ring-admin-border border-transparent">{pagoDestino.periodo}</span>
             </div>

             <div className="border-t border-admin-border-subtle pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-renta-600 uppercase tracking-wider">Distribuir el pago</span>
                  <button
                    type="button"
                    onClick={autocompletar}
                    className="flex items-center gap-1 text-[10px] font-bold text-renta-600 bg-white ring-1 ring-inset ring-admin-border border-transparent hover:bg-renta-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    <Wand2 className="h-3 w-3" /> Autocompletar
                  </button>
                </div>

                {conceptosActivos.map((concepto) => (
                  <div key={concepto.key} className="flex items-center justify-between">
                    <span className="text-renta-500">{concepto.label}</span>
                    <div className="relative w-28">
                      <span className="absolute left-1.5 top-0.5 text-renta-400 font-bold text-[8px]">{config.currency_code}</span>
                      <NumericInput
                        placeholder="0"
                        value={desglose[concepto.key] || ''}
                        onChange={(val) => setConcepto(concepto.key, val)}
                        className="w-full text-right pl-4 pr-1.5 py-0.5 bg-white ring-1 ring-inset ring-admin-border border-transparent rounded text-[10px] font-bold focus:outline-none focus:border-renta-400"
                      />
                    </div>
                  </div>
                ))}

                <div className={cn(
                  "flex justify-between items-center text-[10px] px-2 py-1 rounded-lg border",
                  restantePorDistribuir === 0
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                    : restantePorDistribuir > 0
                      ? "bg-amber-50 border-amber-100 text-amber-700"
                      : "bg-red-50 border-red-100 text-red-600"
                )}>
                  <span className="font-semibold">
                    {restantePorDistribuir === 0
                      ? 'Desglose completo'
                      : restantePorDistribuir > 0
                        ? 'Restante por distribuir'
                        : 'Excedente en el desglose'}
                  </span>
                  <span className="font-bold">{formatCurrency(Math.abs(restantePorDistribuir))}</span>
                </div>
             </div>

             <div className="border-t border-admin-border-subtle pt-2 flex justify-between items-center text-xs">
               <span className="font-bold text-renta-900">Total a cobrar</span>
               <span className="font-black text-renta-950 text-sm">{formatCurrency(pagoDestino.monto_a_abonar)}</span>
             </div>
             
             {pagoDestino.monto_abonado > 0 && (
               <div className="flex justify-between items-center text-[10px] px-2 py-1 rounded-lg bg-renta-50 border border-renta-100">
                 <span className="font-medium">Saldo Pendiente</span>
                 <span className="font-bold">{formatCurrency(saldoRestante)}</span>
               </div>
             )}
          </div>

          {/* Monto + Via + Fecha en bloque compacto */}
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-renta-900">Monto ({config.currency_code}) *</label>
              <Controller
                control={control}
                name="monto"
                render={({ field }) => (
                  <NumericInput
                    placeholder="0.00"
                    value={field.value}
                    onChange={field.onChange}
                    className={cn(
                      "w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-1",
                      errors.monto ? "border-red-400 focus:ring-red-400" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
                    )}
                  />
                )}
              />
              {errors.monto && <p className="text-[10px] text-red-500">{errors.monto.message}</p>}
              
              {generaSaldoAFavor && (
                <p className="text-[9px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-medium border border-emerald-100">
                   +{formatCurrency(montoIngresado - saldoRestante)} queda como saldo a favor
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
               <div className="space-y-1">
                 <label className="text-[10px] font-semibold text-renta-900">Vía</label>
                 <select 
                   {...register('metodo')}
                   className="w-full rounded-lg ring-1 ring-inset ring-admin-border border-transparent px-2 py-1.5 text-xs outline-none focus:border-renta-300"
                 >
                   <option value="TRANSFERENCIA">Transferencia</option>
                   <option value="EFECTIVO">Efectivo</option>
                   <option value="MERCADO_PAGO">MercadoPago</option>
                   <option value="OTRO">Otro</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-semibold text-renta-900">Fecha</label>
                 <input 
                   type="date"
                   {...register('fecha')}
                   className={cn(
                    "w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-1",
                    errors.fecha ? "border-red-400" : "border-admin-border focus:border-renta-300"
                   )}
                 />
               </div>
            </div>
          </div>

          {/* Debug Global Errors */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg text-[10px] text-red-600 animate-fade-in">
               <div className="font-bold flex items-center gap-1.5 mb-1">
                 <AlertCircle className="h-3 w-3" /> Errores detectados:
               </div>
               <ul className="list-disc list-inside space-y-0.5">
                 {Object.entries(errors).map(([key, value]: [string, any]) => (
                   <li key={key}>{value.message || `${key} inválido`}</li>
                 ))}
               </ul>
            </div>
          )}

          <div className="pt-2 border-t border-admin-border-subtle flex justify-end gap-2">
             <button
               type="button"
               onClick={onClose}
               className="px-3 py-1.5 bg-white ring-1 ring-inset ring-admin-border border-transparent rounded-lg text-renta-700 text-xs font-semibold hover:bg-renta-50"
             >
               Cancelar
             </button>
             <button
               type="submit"
               disabled={isSubmitting}
               className="px-4 py-1.5 border border-emerald-600 bg-emerald-500 rounded-lg text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
             >
               <Save className="h-3.5 w-3.5" /> Ejecutar Transacción
             </button>
          </div>
        </form>

      </div>
    </div>
  );
}
