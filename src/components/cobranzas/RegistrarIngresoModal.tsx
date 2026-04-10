import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transaccionSchema, type TransaccionFormData, type PagoEnCuenta } from '@/types/cobranzas';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { X, Save, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegistrarIngresoModalProps {
  pagoDestino: PagoEnCuenta;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RegistrarIngresoModal({ pagoDestino, onClose, onSuccess }: RegistrarIngresoModalProps) {
  const { inmobiliaria_id } = useInmobiliaria();
  const saldoRestante = pagoDestino.monto_a_abonar - pagoDestino.monto_abonado;
  
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
      const payload: TransaccionFormData = {
        ...data,
        inmobiliaria_id: inmobiliaria_id || undefined
      };
      
      // await eden.transacciones.post(payload);

      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-renta-950/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-admin-border overflow-hidden">
        
        <div className="bg-renta-50 px-6 py-4 flex items-center justify-between border-b border-admin-border-subtle">
           <h3 className="font-jakarta text-lg font-bold text-renta-950 flex items-center gap-2">
             <Wallet className="h-5 w-5 text-renta-600" />
             Registrar Ingreso de Dinero
           </h3>
           <button onClick={onClose} className="text-renta-400 hover:text-red-500 transition-colors">
              <X className="h-5 w-5" />
           </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 font-inter">
          <div className="space-y-1">
             <p className="text-xs font-semibold text-renta-500 uppercase tracking-widest">Inquilino Remitente</p>
             <p className="text-sm font-bold text-renta-950">{pagoDestino.nombre_inquilino}</p>
             <p className="text-xs text-renta-600">{pagoDestino.detalle_propiedad}</p>
          </div>

          <div className="bg-admin-surface-hover border border-admin-border-subtle p-4 rounded-xl flex justify-between items-center text-sm">
             <span className="font-medium text-renta-700">Saldo Pendiente (Cuota {pagoDestino.periodo})</span>
             <span className="font-bold text-renta-950">${saldoRestante.toLocaleString('es-AR')}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-renta-900">Monto del Ingreso ($) *</label>
            <input
              type="number"
              step="0.01"
              {...register('monto')}
              className={cn(
                "w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-1",
                errors.monto ? "border-red-400 focus:ring-red-400" : "border-admin-border focus:border-renta-300 focus:ring-renta-200"
              )}
            />
            {errors.monto && <p className="text-xs text-red-500">{errors.monto.message}</p>}
            
            {/* Feedback Saldo a Favor Arquitecto */}
            {generaSaldoAFavor && (
              <p className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-md font-medium border border-emerald-100 flex items-center gap-1">
                 Monto superior al Saldo Restante. Se acreditarán ${(montoIngresado - saldoRestante).toLocaleString('es-AR')} como "Saldo a Favor" para arrastrar a N+1.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
               <label className="text-xs font-semibold text-renta-900">Vía de Recepción</label>
               <select 
                 {...register('metodo')}
                 className="w-full rounded-xl border border-admin-border px-3 py-2 text-sm outline-none focus:border-renta-300"
               >
                 <option value="TRANSFERENCIA">Transferencia / Bco</option>
                 <option value="EFECTIVO">Efectivo Físico</option>
                 <option value="MERCADO_PAGO">MercadoPago</option>
                 <option value="OTRO">Otro Método</option>
               </select>
             </div>
             <div className="space-y-1.5">
               <label className="text-xs font-semibold text-renta-900">Fecha Efectiva</label>
               <input 
                 type="date"
                 {...register('fecha')}
                 className={cn(
                  "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1",
                  errors.fecha ? "border-red-400" : "border-admin-border focus:border-renta-300"
                 )}
               />
               {errors.fecha && <p className="text-[10px] text-red-500">{errors.fecha.message}</p>}
             </div>
          </div>

          <div className="pt-4 border-t border-admin-border-subtle flex justify-end gap-3">
             <button
               type="button"
               onClick={onClose}
               className="px-4 py-2 bg-white border border-admin-border rounded-xl text-renta-700 text-sm font-semibold hover:bg-renta-50"
             >
               Cancelar
             </button>
             <button
               type="submit"
               disabled={isSubmitting}
               className="px-4 py-2 border border-emerald-600 bg-emerald-500 rounded-xl text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
             >
               <Save className="h-4 w-4" /> Ejecutar Transacción
             </button>
          </div>
        </form>

      </div>
    </div>
  );
}
