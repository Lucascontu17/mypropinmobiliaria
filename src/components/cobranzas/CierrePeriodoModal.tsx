import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cierrePeriodoSchema, type CierrePeriodoData } from '@/types/cobranzas';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { AlertCircle, LockKeyhole, FolderSync, ShieldAlert } from 'lucide-react';
import { useEden } from '@/services/eden';

interface CierrePeriodoModalProps {
  periodoActual: string; // Ej. 2026-04
  deudaEstimada: number;
  saldoAFavorEstimado: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CierrePeriodoModal({ periodoActual, deudaEstimada, saldoAFavorEstimado, onClose, onSuccess }: CierrePeriodoModalProps) {
  const { inmobiliaria_id } = useInmobiliaria();
  const { client: eden } = useEden();
  
  const { handleSubmit, formState: { isSubmitting } } = useForm<CierrePeriodoData>({
    resolver: zodResolver(cierrePeriodoSchema),
    defaultValues: {
      inmobiliaria_id: '',
      periodo_actual: periodoActual
    }
  });

  const onSubmit = async (data: CierrePeriodoData) => {
    try {
      const payload: CierrePeriodoData = {
        ...data,
        inmobiliaria_id: inmobiliaria_id || undefined
      };
      
      // @ts-ignore - Triggering Master Rollover (v2.0.1 Integrity Fix)
      const { error } = await eden.admin.pagos['cierre-maestro'].post(payload);

      if (error) throw new Error('Error al ejecutar el cierre maestro.');

      if (onSuccess) onSuccess();
      onClose();
    } catch (e: any) {
      console.error(e);
    }
  };

  // Calcular periodo N+1 simulado para UI
  const [year, month] = periodoActual.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  date.setMonth(date.getMonth() + 1);
  const nextPeriodo = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-renta-950/60 p-4 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden shadow-renta-950/50">
        
        <div className="bg-red-500/10 px-6 py-5 flex items-start gap-4 border-b border-red-500/20">
           <div className="h-10 w-10 shrink-0 bg-red-100 rounded-full flex items-center justify-center border border-red-200 shadow-sm text-red-600">
             <AlertCircle className="h-5 w-5" />
           </div>
           <div>
             <h3 className="font-jakarta text-xl font-bold text-red-950">
               Confirmación de Cierre Maestro
             </h3>
             <p className="text-sm font-medium text-red-800/80 mt-1 font-inter">
               Operación irreversible de flujo de caja (Transacción ACID).
             </p>
           </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 font-inter">
          
          <div className="space-y-4">
            <p className="text-sm text-renta-800 leading-relaxed font-medium">
              Estás a punto de clausurar la recopilación de fondos del periodo <strong className="bg-renta-100 px-1 py-0.5 rounded text-renta-900 border border-renta-200">{periodoActual}</strong>. 
              El motor financiero del Búnker realizará un <em>Rollover Automatizado</em> hacia el periodo <strong className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">{nextPeriodo}</strong>.
            </p>

            <div className="bg-admin-surface border border-admin-border rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-renta-500 mb-2 border-b border-admin-border-subtle pb-2">Proyección del Rollover</h4>
              
              <div className="flex justify-between items-center text-sm">
                 <span className="font-medium text-renta-700">Deuda Impaga a Arrastrar:</span>
                 <span className="font-bold text-red-600">${deudaEstimada.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="font-medium text-renta-700">Saldos a Favor Inquilinos:</span>
                 <span className="font-bold text-emerald-600">-${saldoAFavorEstimado.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <div className="flex bg-rose-50 border border-rose-200 rounded-xl p-3 items-start gap-3">
               <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
               <p className="text-[11px] text-rose-800 font-medium">
                  <strong>Master Filter Activo:</strong> Esta operación solo afectará la cuenta corriente de los contratos vinculados al Tenant actual. Ninguna otra inmobiliaria se verá impactada.
               </p>
            </div>
          </div>

          <div className="pt-4 flex justify-between gap-3 items-center">
             <button
               type="button"
               onClick={onClose}
               className="px-5 py-2.5 bg-white border border-admin-border hover:border-renta-300 rounded-xl text-renta-700 text-sm font-bold transition-all hover:bg-renta-50"
             >
               Abortar Operación
             </button>
             <button
               type="submit"
               disabled={isSubmitting}
               className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all disabled:opacity-50 disabled:grayscale"
             >
               <FolderSync className="h-4 w-4" /> Ejecutar Cierre en Búnker
             </button>
          </div>
        </form>

      </div>
    </div>
  );
}
