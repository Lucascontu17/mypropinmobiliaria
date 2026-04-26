import { useState, useEffect } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { 
  WalletCards, 
  Rocket, 
  CheckCircle2, 
  Shield, 
  Loader2, 
  AlertTriangle, 
  Zap, 
  PlusCircle, 
  Info,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEden } from '@/services/eden';
import { LocalShepherd, type ShepherdStep } from '@/components/shepherd/LocalShepherd';
import { toast } from 'sonner';

export function MarketplacePage() {
  const { hasPermission, inmobiliaria_id } = useInmobiliaria();
  const { t, formatCurrency, country_code, config } = useRegion();
  const eden = useEden();

  const [activeTab, setActiveTab] = useState<'addons' | 'points'>('addons');
  
  // Data from API
  const [catalog, setCatalog] = useState<{
    addons: any[];
    packages: any[];
    balance: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<{puntos: number, monto: number} | null>(null);

  // Custom Points purchase
  const [customPoints, setCustomPoints] = useState<number>(0);
  const pricePerPoint = country_code === 'AR' ? 100 : country_code === 'MX' ? 20 : 1; // Valuación definida por negocio

  useEffect(() => {
    fetchCatalog();
  }, [eden]);

  const fetchCatalog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // @ts-ignore
      const { data, error } = await eden.marketplace.catalog.get();
      if (error) throw new Error("Error al obtener catálogo");
      
      setCatalog((data as any) ?? { addons: [], packages: [], balance: 0 });
    } catch (err: any) {
      console.error("[Marketplace] Fetch failed:", err);
      setError(t('error_marketplace', 'Servicio momentáneamente no disponible. Verifique su conexión.'));
    } finally {
      setIsLoading(false);
    }
  };

  const aquirirAddon = async (addonId: string) => {
    if (!confirm(t('marketplace_confirm_addon', '¿Desea adquirir esta función? El cobro se verá reflejado a partir de su próxima cuota mensual de suscripción.'))) return;
    
    setIsProcessing(addonId);
    try {
      // @ts-ignore
      const { error } = await eden.marketplace['acquire-addon'].post({ addon_id: addonId });
      if (error) throw new Error("Error al adquirir add-on");
      
      toast.success(t('marketplace_success_addon', 'Función adquirida con éxito. Se activará de inmediato.'));
      fetchCatalog();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const cancelarAddon = async (addonId: string) => {
    if (!confirm('¿Desea dar de baja esta función? Dejará de cobrarse en la próxima facturación mensual.')) return;
    
    setIsProcessing(addonId);
    try {
      // @ts-ignore
      const { error } = await eden.marketplace['cancel-addon'].post({ addon_id: addonId });
      if (error) throw new Error("Error al dar de baja");
      
      toast.success('Función dada de baja exitosamente.');
      fetchCatalog();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  // --- Payment Form State ---
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expirationDate: '',
    cvv: '',
    cardholderName: '',
    email: ''
  });

  const handleProcessPayment = async (puntos: number, monto: number) => {
    if (!cardData.email || !cardData.cardNumber) {
      alert("Por favor complete todos los campos de pago.");
      return;
    }

    setIsProcessing('points_purchase');
    
    try {
      // 1. Initialize Mercado Pago
      // @ts-ignore
      const mp = new window.MercadoPago('APP_USR-d74eb23f-78f0-42e0-88d0-78f682072e4c', {
        locale: 'es-AR'
      });

      // 2. Tokenize Card
      const [month, year] = cardData.expirationDate.split('/');
      const tokenResponse = await mp.createCardToken({
        cardNumber: cardData.cardNumber.replace(/\s/g, ''),
        cardholderName: cardData.cardholderName,
        cardExpirationMonth: month,
        cardExpirationYear: "20" + year,
        securityCode: cardData.cvv,
        identificationType: "DNI", // Default for AR demo, should be a selector in prod
        identificationNumber: "12345678" // Default for AR demo
      });

      if (!tokenResponse.id) {
        throw new Error("No se pudo generar el token de seguridad de la tarjeta.");
      }

      // 3. Send to API
      // @ts-ignore
      const { data, error } = await eden.marketplace['buy-points'].post({ 
        puntos, 
        monto: monto.toString(),
        token: tokenResponse.id,
        payment_method_id: 'visa', // This should ideally be detected via bin, but hardcoded for demo simplicity
        installments: 1,
        email: cardData.email
      });

      if (error) throw new Error((error as any).value?.error || 'Error en el cobro');

      alert(t('marketplace_success_points', `¡Compra Exitosa! Has adquirido ${puntos} puntos. Balance actualizado.`));
      setShowPaymentModal(null);
      fetchCatalog();
    } catch (err: any) {
      console.error('Payment Error:', err);
      alert('Error en la transacción: ' + (err.message || 'Verifique sus datos'));
    } finally {
      setIsProcessing(null);
    }
  };

  const comprarPuntos = (puntos: number, monto: number) => {
    if (puntos <= 0) return;
    setShowPaymentModal({ puntos, monto });
  };

  if (!hasPermission(['superadmin', 'admin'])) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Shield className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold font-jakarta text-renta-950">Acceso Denegado</h2>
        <p className="text-sm font-inter text-renta-600">Solo administradores pueden acceder al Marketplace.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-renta-400 animate-spin" />
        <p className="mt-4 text-sm text-renta-500">Cargando Marketplace de Crecimiento...</p>
      </div>
    );
  }

  // Shepherd Steps
  const shepherdSteps: ShepherdStep[] = [
    {
      target: '[data-shepherd="mkt-balance"]',
      title: t('tour_mkt_balance_title', 'Balance de Puntos'),
      content: t('tour_mkt_balance_desc', 'Este es el saldo global de puntos de su inmobiliaria. Puede comprar puntos por paquetes o de forma personalizada y luego distribuirlos en las propiedades que desee destacar.'),
      placement: 'left',
    },
    {
      target: '[data-shepherd="mkt-tabs"]',
      title: t('tour_mkt_tabs_title', 'Secciones del Marketplace'),
      content: t('tour_mkt_tabs_desc', 'El Marketplace tiene dos secciones: "Funciones Extra" le permite agregar herramientas premium a su suscripción mensual, y "Comprar Puntos" le permite adquirir créditos de visibilidad para sus propiedades.'),
      placement: 'bottom',
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <LocalShepherd steps={shepherdSteps} storageKey="enjoy_local_marketplace" />
      
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <p className="text-sm font-medium">{error}</p>
          <button 
            onClick={() => fetchCatalog()} 
            className="ml-auto underline text-xs font-bold hover:text-amber-900 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Header & Balance ── */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-admin-border-subtle pb-8">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-renta-50 rounded-full border border-renta-100 text-renta-700 text-[10px] font-bold uppercase tracking-widest mb-2">
            <Zap className="h-3 w-3" /> Ecosistema de Crecimiento
          </div>
          <h1 className="text-3xl font-bold text-renta-950 font-jakarta leading-tight tracking-tight">
            Marketplace de MyProp
          </h1>
          <p className="text-sm text-renta-600 font-inter">Potencie su inmobiliaria con funciones premium y puntos de visibilidad.</p>
        </div>

        <div className="flex items-center gap-4">
          <div data-shepherd="mkt-balance" className="bg-gradient-to-br from-renta-950 to-renta-800 p-5 rounded-2xl shadow-xl shadow-renta-950/20 text-white min-w-[200px] border border-renta-700">
            <p className="text-[10px] font-bold uppercase tracking-widest text-renta-400 mb-1">Puntos Disponibles</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black font-jakarta tracking-tighter">{catalog?.balance || 0}</span>
              <Rocket className="h-6 w-6 text-amber-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div data-shepherd="mkt-tabs" className="flex gap-2 p-1 bg-admin-surface rounded-xl border border-admin-border w-fit">
        <button
          onClick={() => setActiveTab('addons')}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
            activeTab === 'addons' ? "bg-white text-renta-950 shadow-sm border border-admin-border" : "text-renta-500 hover:text-renta-700"
          )}
        >
          Funciones Extra
        </button>
        <button
          onClick={() => setActiveTab('points')}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
            activeTab === 'points' ? "bg-white text-renta-950 shadow-sm border border-admin-border" : "text-renta-500 hover:text-renta-700"
          )}
        >
          Comprar Puntos
        </button>
      </div>

      {/* ── Content Area ── */}
      {activeTab === 'addons' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalog?.addons.map((addon) => (
            <div key={addon.id} className={`group bg-white rounded-2xl border transition-all duration-300 p-6 flex flex-col hover:shadow-lg ${addon.is_acquired ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-admin-border hover:border-renta-300'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-renta-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlusCircle className="h-6 w-6 text-renta-600" />
                </div>
                {addon.is_acquired && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Contratado
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold font-jakarta text-renta-950 group-hover:text-renta-600 transition-colors">{addon.nombre}</h3>
              
              <div className="mt-3 p-3 bg-renta-50/50 rounded-xl border border-renta-100 flex-1 group-hover:bg-renta-50 transition-colors">
                <p className="text-xs text-renta-700 leading-relaxed font-medium font-inter">
                   {addon.descripcion}
                </p>
              </div>
              
              <div className="mt-6 pt-6 border-t border-admin-border-subtle">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-renta-950">{formatCurrency(addon.costo_mensual)}</span>
                    <span className="text-[10px] font-bold text-renta-400 ml-1">/ MES</span>
                  </div>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-3 mb-4 border border-amber-100 flex gap-2">
                  <Info className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-[10px] text-amber-700 font-medium">
                    Se cobrará como extra a partir de su próxima cuota mensual de suscripción.
                  </p>
                </div>

                {addon.is_acquired ? (
                  <button
                    onClick={() => cancelarAddon(addon.id)}
                    disabled={isProcessing !== null}
                    className="w-full bg-red-50 text-red-600 border border-red-200 rounded-xl py-3 text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {isProcessing === addon.id ? "Procesando..." : "Dar de baja"}
                  </button>
                ) : (
                  <button
                    onClick={() => aquirirAddon(addon.id)}
                    disabled={isProcessing !== null}
                    className="w-full bg-renta-950 text-white rounded-xl py-3 text-sm font-bold hover:bg-renta-800 transition-colors disabled:opacity-50"
                  >
                    {isProcessing === addon.id ? "Procesando..." : "Adquirir Función"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Packages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {catalog?.packages.map((pkg) => (
              <div key={pkg.id} className="relative bg-white rounded-2xl border border-admin-border p-6 flex flex-col">
                <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase">
                  Pack {pkg.puntos} Ptos
                </div>
                <h3 className="text-base font-bold font-jakarta text-renta-950 mb-1">{pkg.nombre}</h3>
                <div className="text-2xl font-black text-renta-950 mb-4">{formatCurrency(pkg.precio)}</div>
                <button
                  onClick={() => comprarPuntos(pkg.puntos, Number(pkg.precio))}
                  className="w-full border-2 border-renta-950 text-renta-950 rounded-xl py-3 text-xs font-bold hover:bg-renta-950 hover:text-white transition-all"
                >
                  Elegir Pack
                </button>
              </div>
            ))}
          </div>

          {/* Custom Points */}
          <div className="bg-admin-surface rounded-3xl border border-admin-border p-8 max-w-2xl">
             <h3 className="text-xl font-bold font-jakarta text-renta-950 mb-2">Compra Personalizada</h3>
             <p className="text-sm text-renta-600 mb-8 font-inter">Indique la cantidad exacta de puntos que necesita para su estrategia.</p>
             
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-renta-400 uppercase tracking-widest">Cantidad de Puntos</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={customPoints}
                      onChange={(e) => setCustomPoints(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-white border border-admin-border rounded-xl px-4 py-4 text-2xl font-black font-jakarta outline-none focus:ring-2 focus:ring-renta-500"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-renta-400 font-bold">PTS</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-admin-border">
                  <div>
                    <p className="text-[10px] font-bold text-renta-400 uppercase mb-1">Total a Pagar</p>
                    <div className="text-3xl font-black text-renta-950">{formatCurrency(customPoints * pricePerPoint)}</div>
                  </div>
                  <button 
                    onClick={() => comprarPuntos(customPoints, customPoints * pricePerPoint)}
                    disabled={customPoints <= 0 || isProcessing !== null}
                    className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    Confirmar Compra <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-center gap-2 py-8 border-t border-admin-border-subtle">
        <Shield className="h-4 w-4 text-emerald-500" />
        <span className="text-[10px] font-medium text-renta-400 uppercase tracking-widest">Transacción Protegida por Mercado Pago 2026</span>
      </div>

      {/* ── Payment Modal ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-renta-950/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
              <div className="bg-renta-950 p-8 text-white relative">
                 <button 
                  onClick={() => setShowPaymentModal(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                 >
                   <PlusCircle className="h-5 w-5 rotate-45" />
                 </button>
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                    <Shield className="h-3 w-3 text-emerald-400" /> Pago Seguro
                 </div>
                 <h2 className="text-2xl font-black font-jakarta tracking-tight">Finalizar Compra</h2>
                 <p className="text-renta-300 text-sm mt-1">Estás adquiriendo {showPaymentModal.puntos} puntos de visibilidad.</p>
              </div>

              <div className="p-8 space-y-6">
                 <div className="flex items-center justify-between p-4 bg-renta-50 rounded-2xl border border-renta-100">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Rocket className="h-5 w-5 text-amber-500" />
                       </div>
                       <span className="font-bold text-renta-900">{showPaymentModal.puntos} Puntos</span>
                    </div>
                    <span className="text-xl font-black text-renta-950">{formatCurrency(showPaymentModal.monto)}</span>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-renta-400 uppercase tracking-widest">Email del Pagador</label>
                       <input 
                         type="email" 
                         placeholder="ejemplo@email.com"
                         value={cardData.email}
                         onChange={(e) => setCardData({...cardData, email: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-renta-500 transition-all"
                       />
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-renta-400 uppercase tracking-widest">Número de Tarjeta</label>
                       <div className="relative">
                          <input 
                            type="text" 
                            placeholder="0000 0000 0000 0000"
                            value={cardData.cardNumber}
                            onChange={(e) => setCardData({...cardData, cardNumber: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-renta-500 transition-all"
                          />
                          <WalletCards className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-renta-400 uppercase tracking-widest">Vencimiento</label>
                          <input 
                            type="text" 
                            placeholder="MM/AA"
                            value={cardData.expirationDate}
                            onChange={(e) => setCardData({...cardData, expirationDate: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-renta-500 transition-all"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-renta-400 uppercase tracking-widest">CVV</label>
                          <input 
                            type="password" 
                            placeholder="***"
                            value={cardData.cvv}
                            onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-renta-500 transition-all"
                          />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-renta-400 uppercase tracking-widest">Nombre en la Tarjeta</label>
                       <input 
                         type="text" 
                         placeholder="EJ. JUAN PEREZ"
                         value={cardData.cardholderName}
                         onChange={(e) => setCardData({...cardData, cardholderName: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-renta-500 transition-all uppercase"
                       />
                    </div>
                 </div>

                 <button 
                  onClick={() => handleProcessPayment(showPaymentModal.puntos, showPaymentModal.monto)}
                  disabled={isProcessing !== null}
                  className="w-full bg-renta-950 text-white rounded-2xl py-4 font-black tracking-tight hover:bg-renta-800 transition-all active:scale-[0.98] shadow-lg shadow-renta-950/20 flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5 text-emerald-400" />}
                   {isProcessing ? 'Procesando Pago...' : `Pagar ${formatCurrency(showPaymentModal.monto)}`}
                 </button>
                 
                 <p className="text-[10px] text-center text-slate-400 font-medium">
                    Al confirmar, aceptas nuestros términos y condiciones de compra de créditos digitales.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
