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
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
if (mpPublicKey) {
  initMercadoPago(mpPublicKey, { locale: 'es-AR' });
}
import { LocalShepherd, type ShepherdStep } from '@/components/shepherd/LocalShepherd';

export function SuscripcionPage() {
  const { t, formatCurrency, currency_code } = useRegion();
  
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);

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

      if (summaryRes.data) {
        let finalSummary = { ...summaryRes.data };
        // MOCK DEV OBLIGATORIO: Forzar deuda 1000 para probar pasarela MP en staging/dev
        const isDevOrStaging = import.meta.env.DEV || window.location.hostname.includes('staging') || window.location.hostname.includes('railway');
        if (isDevOrStaging && (!finalSummary.total_amount || finalSummary.total_amount === 0)) {
          finalSummary.total_amount = 1000;
          finalSummary.base_price = 1000; // Mockeamos el precio base visualmente también
        }
        setSummary(finalSummary);
      }
      if (historyRes.data) setHistory(historyRes.data);
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayClick = async () => {
    setIsGeneratingPayment(true);
    try {
      // @ts-ignore
      const res = await eden.billing['create-preference'].post({
        monto: summary?.total_amount || 0,
        moneda: 'ARS'
      });
      if (res.data?.success && res.data.preference?.id) {
        setPreferenceId(res.data.preference.id);
      } else {
        throw new Error(res.data?.error || "Error al inicializar el pago");
      }
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + err.message);
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-renta-400 animate-spin" />
      </div>
    );
  }

  const shepherdSteps: ShepherdStep[] = [
    {
      target: '[data-shepherd="sub-desglose"]',
      title: t('tour_sub_desglose_title', 'Desglose de Facturación'),
      content: t('tour_sub_desglose_desc', 'Aquí verá el total de su próxima cuota: Plan Base más las funciones extra que haya adquirido. Las funciones nuevas se cobran a partir del ciclo siguiente a su activación.'),
      placement: 'bottom',
    },
    {
      target: '[data-shepherd="sub-historial"]',
      title: t('tour_sub_historial_title', 'Historial de Transacciones'),
      content: t('tour_sub_historial_desc', 'Registro cronológico de todas las operaciones realizadas en el Marketplace: compras de puntos, activación de funciones y distribución de puntos a propiedades.'),
      placement: 'left',
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <LocalShepherd steps={shepherdSteps} storageKey="enjoy_local_suscripcion" />
      
      {/* ── Header ── */}
      <div className="border-b border-admin-border-subtle pb-6">
        <h1 className="text-3xl font-bold text-renta-950 font-jakarta">Mi Suscripción</h1>
        <p className="text-sm text-renta-600 font-inter mt-1">Gestione su abono mensual y revise su historial de facturación.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── PRÓXIMO PAGO (Left 2/3) ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-admin-border overflow-hidden shadow-sm">
            <div data-shepherd="sub-desglose" className="bg-renta-50/50 px-8 py-6 border-b border-admin-border-subtle flex items-center justify-between">
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
                  <div className="text-5xl font-black text-renta-950 tracking-tighter flex items-baseline justify-end gap-2">
                    <span className="text-2xl text-renta-400 font-bold">{currency_code}</span>
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

              {!preferenceId ? (
                <button 
                  onClick={handlePayClick}
                  disabled={isGeneratingPayment || !summary?.total_amount}
                  className={cn(
                    "mt-6 w-full py-3.5 px-4 rounded-xl font-bold transition-all border",
                    "bg-renta-950 text-white border-renta-950 hover:bg-renta-900",
                    "disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  )}
                >
                  {isGeneratingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  {isGeneratingPayment ? 'Inicializando Pago Seguro...' : 'Abonar con Tarjeta'}
                </button>
              ) : (
                <div className="mt-6 pt-6 border-t border-admin-border-subtle animate-fade-in">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-renta-950 flex items-center gap-2">
                       Mercado Pago Checkout
                    </h3>
                  </div>
                  <Payment
                    initialization={{ amount: summary?.total_amount, preferenceId }}
                    customization={{
                      paymentMethods: {
                        creditCard: "all",
                        debitCard: "all",
                      },
                    }}
                    onSubmit={async () => {
                      // El SDK envía el pago por su cuenta a MP porque usamos preferenceId
                      return new Promise((resolve) => setTimeout(resolve, 1000));
                    }}
                    onReady={() => console.log('Payment Brick listo')}
                    onError={(e) => console.error('Error Payment Brick', e)}
                  />
                  <button 
                    onClick={() => setPreferenceId(null)}
                    className="mt-4 text-xs text-renta-500 hover:text-renta-950 transition-colors w-full text-center"
                  >
                    Cancelar y volver
                  </button>
                </div>
              )}

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
            <div data-shepherd="sub-historial" className="px-6 py-5 border-b border-admin-border-subtle flex items-center gap-2">
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
