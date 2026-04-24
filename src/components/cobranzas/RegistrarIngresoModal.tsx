import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transaccionSchema, type TransaccionFormData, type PagoEnCuenta } from '@/types/cobranzas';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { X, Save, Wallet, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEden } from '@/services/eden';
import { toast } from 'sonner';
import { generateReceiptPDF } from '@/utils/receiptGenerator';
import { numeroALetras } from '@/utils/numberToWords';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface RegistrarIngresoModalProps {
  pagoDestino: PagoEnCuenta;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RegistrarIngresoModal({ pagoDestino, onClose, onSuccess }: RegistrarIngresoModalProps) {
  const { inmobiliaria_id, nombre: nombreInmobiliaria } = useInmobiliaria();
  const eden = useEden();
  const [montoAblVariable, setMontoAblVariable] = useState<number | ''>('');
  
  const ablDinamico = Number(montoAblVariable) || 0;
  const totalConImpuestos = pagoDestino.monto_a_abonar + (pagoDestino.tipo_abl === 'variable' ? ablDinamico : 0);
  const saldoRestante = totalConImpuestos - pagoDestino.monto_abonado;
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<TransaccionFormData>({
    resolver: zodResolver(transaccionSchema),
    defaultValues: {
      inmobiliaria_id: '',
      pago_id: pagoDestino.pago_id,
      monto: saldoRestante > 0 ? saldoRestante : 0,
      metodo: 'TRANSFERENCIA',
      fecha: new Date().toISOString().split('T')[0]
    }
  });

  const montoIngresado = watch('monto');
  const generaSaldoAFavor = montoIngresado > saldoRestante && saldoRestante > 0;

  const onSubmit = async (data: TransaccionFormData) => {
    try {
      // 1. Registrar la Transacción en la DB
      const payload = {
        ...data,
        inmobiliaria_id: inmobiliaria_id || undefined
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
        monto_total: Number(data.monto),
        monto_letras: numeroALetras(Number(data.monto)),
        desglose: {
          alquiler: pagoDestino.monto_alquiler_base || 0,
          expensas: pagoDestino.monto_expensas || 0,
          abl: pagoDestino.tipo_abl === 'fijo' ? (pagoDestino.monto_abl || 0) : ablDinamico
        },
        metodo_pago: data.metodo,
        fecha_pago: data.fecha
      });

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

      const { error: uploadError } = await eden.admin.recibos.post(formData);

      if (uploadError) {
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
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-admin-border overflow-hidden">
        
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
          <div className="bg-admin-surface-hover border border-admin-border-subtle p-3 rounded-xl space-y-2">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-xs font-bold text-renta-950">{pagoDestino.nombre_inquilino}</p>
                 <p className="text-[10px] text-renta-500">{pagoDestino.detalle_propiedad}</p>
               </div>
               <span className="text-[9px] font-bold text-renta-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-admin-border">{pagoDestino.periodo}</span>
             </div>

             <div className="border-t border-admin-border-subtle pt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-renta-500">Alquiler</span>
                  <span className="font-medium text-renta-800">${(pagoDestino.monto_alquiler_base || pagoDestino.monto_a_abonar).toLocaleString('es-AR')}</span>
                </div>

                {pagoDestino.monto_expensas ? (
                  <div className="flex justify-between">
                    <span className="text-renta-500">Expensas</span>
                    <span className="font-medium text-renta-800">${pagoDestino.monto_expensas.toLocaleString('es-AR')}</span>
                  </div>
                ) : null}

                {pagoDestino.tipo_abl === 'fijo' && pagoDestino.monto_abl ? (
                  <div className="flex justify-between">
                    <span className="text-renta-500">ABL</span>
                    <span className="font-medium text-renta-800">${pagoDestino.monto_abl.toLocaleString('es-AR')}</span>
                  </div>
                ) : null}

                {pagoDestino.tipo_abl === 'variable' && (
                  <div className="flex justify-between items-center bg-renta-50 p-1.5 rounded-lg border border-renta-100 -mx-1 px-1.5">
                    <span className="text-renta-700 font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-renta-400" />
                      ABL Mes
                    </span>
                    <div className="relative w-20">
                      <span className="absolute left-1.5 top-0.5 text-renta-400 font-semibold text-[10px]">$</span>
                      <input 
                        type="number" 
                        placeholder="0"
                        value={montoAblVariable}
                        onChange={(e) => setMontoAblVariable(Number(e.target.value))}
                        className="w-full text-right pl-4 pr-1.5 py-0.5 bg-white border border-admin-border rounded text-[10px] font-bold focus:outline-none focus:border-renta-400"
                      />
                    </div>
                  </div>
                )}
             </div>

             <div className="border-t border-admin-border-subtle pt-2 flex justify-between items-center text-xs">
               <span className="font-bold text-renta-900">Total</span>
               <span className="font-black text-renta-950 text-sm">${totalConImpuestos.toLocaleString('es-AR')}</span>
             </div>
             
             {saldoRestante !== totalConImpuestos && (
               <div className={cn(
                 "flex justify-between items-center text-[10px] px-2 py-1 rounded-lg",
                 pagoDestino.monto_abonado > 0 ? "bg-emerald-50 border border-emerald-100" : "bg-renta-50 border border-renta-100"
               )}>
                 <span className="font-medium">Saldo Pendiente</span>
                 <span className="font-bold">${saldoRestante.toLocaleString('es-AR')}</span>
               </div>
             )}
          </div>

          {/* Monto + Via + Fecha en bloque compacto */}
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-renta-900">Monto ($) *</label>
              <input
                type="number"
                step="0.01"
                {...register('monto')}
                className={cn(
                  "w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-1",
                  errors.monto ? "border-red-400 focus:ring-red-400" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
                )}
              />
              {errors.monto && <p className="text-[10px] text-red-500">{errors.monto.message}</p>}
              
              {generaSaldoAFavor && (
                <p className="text-[9px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-medium border border-emerald-100">
                   +${(montoIngresado - saldoRestante).toLocaleString('es-AR')} queda como saldo a favor
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
               <div className="space-y-1">
                 <label className="text-[10px] font-semibold text-renta-900">Vía</label>
                 <select 
                   {...register('metodo')}
                   className="w-full rounded-lg border border-admin-border px-2 py-1.5 text-xs outline-none focus:border-renta-300"
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

          <div className="pt-2 border-t border-admin-border-subtle flex justify-end gap-2">
             <button
               type="button"
               onClick={onClose}
               className="px-3 py-1.5 bg-white border border-admin-border rounded-lg text-renta-700 text-xs font-semibold hover:bg-renta-50"
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
