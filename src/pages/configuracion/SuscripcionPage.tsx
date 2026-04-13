import { useState, useEffect } from 'react';
import { useRegion } from '@/hooks/useRegion';
import { 
  CreditCard, 
  History, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight, 
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { eden } from '@/services/eden';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LocalJoyride } from '@/components/joyride/LocalJoyride';
import { type Step } from 'react-joyride';

export function SuscripcionPage() {
  const { t, formatCurrency } = useRegion();
  
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setIsLoading(true);
    try {
      // @ts-ignore
      const [summaryRes, historyRes] = await Promise.all([
        eden.billing.summary.get(),
        eden.billing.history.get()
      ]);

      if (summaryRes.data) setSummary(summaryRes.data);
      if (historyRes.data) setHistory(historyRes.data);
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-renta-400 animate-spin" />
      </div>
    );
  }

  const joyrideSteps: Step[] = [
    {
      target: '[data-joyride="sub-desglose"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_sub_desglose_title', 'Desglose de Facturación')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_sub_desglose_desc', 'Aquí verá el total de su próxima cuota: Plan Base más las funciones extra que haya adquirido. Las funciones nuevas se cobran a partir del ciclo siguiente a su activación.')}
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-joyride="sub-historial"]',
      title: (
        <span className="font-jakarta font-bold text-renta-950">
          {t('tour_sub_historial_title', 'Historial de Transacciones')}
        </span>
      ),
      content: (
        <div className="font-inter text-sm text-renta-600 leading-relaxed">
          {t('tour_sub_historial_desc', 'Registro cronológico de todas las operaciones realizadas en el Marketplace: compras de puntos, activación de funciones y distribución de puntos a propiedades.')}
        </div>
      ),
      placement: 'left',
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <LocalJoyride steps={joyrideSteps} storageKey="enjoy_local_suscripcion" />
      
      {/* ── Header ── */}
      <div className="border-b border-admin-border-subtle pb-6">
        <h1 className="text-3xl font-bold text-renta-950 font-jakarta">Mi Suscripción</h1>
        <p className="text-sm text-renta-600 font-inter mt-1">Gestione su abono mensual y revise su historial de facturación.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── PRÓXIMO PAGO (Left 2/3) ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-admin-border overflow-hidden shadow-sm">
            <div data-joyride="sub-desglose" className="bg-renta-50/50 px-8 py-6 border-b border-admin-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-renta-950 text-white flex items-center justify-center shadow-lg shadow-renta-950/20">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-renta-950 font-jakarta">Resumen del Próximo Pago</h2>
              </div>
              <div className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-200">
                Estado: Activo
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Main Total */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-renta-400 uppercase tracking-widest">Fecha Estimada de Cobro</p>
                  <div className="flex items-center gap-2 text-renta-950 font-bold">
                    <Calendar className="h-4 w-4 text-renta-600" />
                    {summary?.period ? format(new Date(summary.period), "dd 'de' MMMM, yyyy", { locale: es }) : '---'}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-renta-400 uppercase tracking-widest mb-1">Total a Abonar</p>
                  <div className="text-5xl font-black text-renta-950 tracking-tighter">
                    {formatCurrency(summary?.total_amount || 0)}
                  </div>
                </div>
              </div>

              {/* Breakdown List */}
              <div className="space-y-4 pt-4">
                <p className="text-[10px] font-bold text-renta-400 uppercase tracking-widest border-b border-admin-border-subtle pb-2">Desglose Detallado</p>
                
                {/* Base Plan */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-renta-950">Abono Base MyProp (Inmobiliaria)</span>
                  </div>
                  <span className="text-sm font-bold text-renta-950">{formatCurrency(summary?.base_price || 0)}</span>
                </div>

                {/* Addons */}
                {summary?.addons.map((addon: any) => (
                  <div key={addon.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <PlusCircleIcon className="h-4 w-4 text-renta-400" />
                      <div>
                        <span className="text-sm font-medium text-renta-950">{addon.nombre}</span>
                        <p className="text-[10px] text-renta-500">Función Extra Adquirida</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-renta-950">{formatCurrency(addon.costo)}</span>
                  </div>
                ))}

                {!summary?.addons.length && (
                  <p className="text-xs text-renta-400 italic">No posee funciones extra activas actualmente.</p>
                )}
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Las funciones adquiridas en el Marketplace durante el periodo actual se verán reflejadas en este desglose a partir del próximo ciclo de facturación.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── HISTORIAL (Right 1/3) ── */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-admin-border shadow-sm flex flex-col h-full">
            <div data-joyride="sub-historial" className="px-6 py-5 border-b border-admin-border-subtle flex items-center gap-2">
              <History className="h-4 w-4 text-renta-600" />
              <h2 className="text-sm font-bold text-renta-950 font-jakarta">Historial de Transacciones</h2>
            </div>
            
            <div className="p-2 space-y-1 overflow-y-auto max-h-[600px]">
              {history.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-admin-surface rounded-2xl transition-colors">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-renta-950">
                      {tx.tipo === 'puntos_compra' ? 'Compra de Puntos' : 
                       tx.tipo === 'addon_activacion' ? 'Activación de Función' : 
                       'Distribución de Puntos'}
                    </p>
                    <p className="text-[10px] text-renta-400">{format(new Date(tx.fecha), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-xs font-bold",
                      tx.monto ? "text-renta-950" : "text-amber-600"
                    )}>
                      {tx.monto ? formatCurrency(tx.monto) : `${tx.cantidad_puntos} pts`}
                    </p>
                    <ArrowUpRight className="h-3 w-3 text-renta-300 ml-auto mt-1" />
                  </div>
                </div>
              ))}

              {!history.length && (
                <div className="py-20 text-center">
                   <FileText className="h-8 w-8 text-renta-100 mx-auto mb-2" />
                   <p className="text-xs text-renta-400 font-medium tracking-tight">Sin transacciones previas.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>
    </svg>
  );
}
