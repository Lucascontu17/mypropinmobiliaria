import { useState, useEffect } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { NumericInput } from '@/components/common/NumericInput';
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
  ArrowRight,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEden } from '@/services/eden';
import { LocalShepherd, type ShepherdStep } from '@/components/shepherd/LocalShepherd';
import { toast } from 'sonner';

export function MarketplacePage() {
  const { hasPermission, inmobiliaria_id } = useInmobiliaria();
  const { t, formatCurrency, country_code, config } = useRegion();
  const { client: eden, isReady } = useEden();

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
    if (isReady) {
      fetchCatalog();
    }
  }, [eden, isReady]);

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
      toast.error("Por favor complete todos los campos de pago.");
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

      toast.success(t('marketplace_success_points', `¡Compra Exitosa! Has adquirido ${puntos} puntos. Balance actualizado.`));
      setShowPaymentModal(null);
      fetchCatalog();
    } catch (err: any) {
      console.error('Payment Error:', err);
      toast.error('Error en la transacción: ' + (err.message || 'Verifique sus datos'));
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

      {/* ── Welcome Gift Banner ── */}
      {catalog?.balance === 50 && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-1 shadow-lg shadow-emerald-500/20 animate-fade-in-up">
           <div className="bg-white/5 backdrop-blur-md rounded-[22px] px-6 py-5 flex items-center justify-between text-white border border-white/10">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <Rocket className="h-6 w-6 text-emerald-600 animate-bounce" />
                 </div>
                 <div>
                    <h4 className="text-lg font-black font-jakarta leading-tight tracking-tight">¡Bienvenido al Ecosistema Zonatia!</h4>
                    <p className="text-xs text-emerald-50/80 font-medium mt-0.5">Te hemos acreditado <span className="text-white font-bold border-b border-white/30">50 puntos de cortesía</span> para que empieces a destacar tus propiedades hoy mismo.</p>
                 </div>
              </div>
              <div className="hidden md:block">
                 <div className="flex items-center gap-2 px-4 py-2 bg-emerald-400/20 rounded-xl border border-white/20 text-[10px] font-black uppercase tracking-widest">
                   <Zap className="h-3.5 w-3.5 text-amber-300" /> Regalo de Bienvenida
                 </div>
              </div>
           </div>
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
          <div className="bg-gradient-to-br from-white to-renta-50/30 rounded-[32px] border border-admin-border p-10 max-w-2xl shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                   <PlusCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                   <h3 className="text-xl font-black font-jakarta text-renta-950">Compra Personalizada</h3>
                   <p className="text-xs text-renta-500 font-medium font-inter">Indique la cantidad exacta de puntos para su estrategia.</p>
                </div>
             </div>
             
             <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-renta-400 uppercase tracking-[0.2em] ml-1">Cantidad de Puntos</label>
                  <div className="relative group">
                    <NumericInput 
                      value={customPoints}
                      onChange={(val) => setCustomPoints(Math.max(0, Math.floor(val)))}
                      className="w-full bg-white border-2 border-renta-100 rounded-2xl px-6 py-5 text-3xl font-black font-jakarta outline-none focus:ring-4 focus:ring-renta-500/10 focus:border-renta-400 transition-all text-renta-950"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-renta-300 font-black text-xl tracking-tighter group-focus-within:text-renta-900 transition-colors">PTS</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-8 bg-renta-950 rounded-3xl border border-white/10 shadow-2xl shadow-renta-950/20 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-renta-400 uppercase tracking-[0.2em] mb-1">Total a Invertir</p>
                    <div className="text-4xl font-black text-white tracking-tight">{formatCurrency(customPoints * pricePerPoint)}</div>
                  </div>
                  <button 
                    onClick={() => comprarPuntos(customPoints, customPoints * pricePerPoint)}
                    disabled={customPoints <= 0 || isProcessing !== null}
                    className="bg-emerald-500 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shadow-lg shadow-emerald-500/20"
                  >
                    Confirmar Compra <ArrowRight className="h-5 w-5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-renta-950/80 backdrop-blur-md animate-in fade-in duration-500">
           <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/20 animate-in zoom-in-95 duration-500">
              {/* Header Compact Premium */}
              <div className="relative bg-gradient-to-br from-renta-950 via-renta-900 to-renta-950 p-6 sm:p-8 text-white">
                 <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-renta-400 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-400 rounded-full blur-[80px]" />
                 </div>

                 <button 
                  onClick={() => setShowPaymentModal(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all hover:rotate-90 text-white/60 hover:text-white"
                 >
                   <PlusCircle className="h-5 w-5 rotate-45" />
                 </button>

                 <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-[0.2em] mb-4 border border-white/10">
                       <Shield className="h-3 w-3 text-emerald-400" /> Pago Seguro
                    </div>
                    <h2 className="text-2xl font-black font-jakarta tracking-tight">Finalizar Compra</h2>
                    <p className="text-renta-300/80 text-xs font-medium mt-1">
                      Adquiriendo <span className="text-white font-bold">{showPaymentModal.puntos} puntos</span> de visibilidad.
                    </p>
                 </div>
              </div>

              <div className="p-6 sm:p-8 space-y-5 bg-white">
                 {/* Resumen Compacto */}
                 <div className="relative group p-4 bg-renta-50/50 rounded-2xl border border-renta-100/50 transition-all hover:bg-renta-50">
                    <div className="flex items-center justify-between relative z-10">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-renta-100 group-hover:scale-105 transition-transform">
                             <Rocket className="h-5 w-5 text-amber-500" />
                          </div>
                          <div>
                             <p className="text-[9px] font-bold text-renta-400 uppercase tracking-widest">Producto</p>
                             <span className="font-bold text-renta-950 text-sm">{showPaymentModal.puntos} Puntos</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-bold text-renta-400 uppercase tracking-widest">Total</p>
                          <span className="text-lg font-black text-renta-950">{formatCurrency(showPaymentModal.monto)}</span>
                       </div>
                    </div>
                 </div>

                 {/* Formulario Compacto */}
                 <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-renta-500 uppercase tracking-[0.1em] ml-1">Email del Pagador</label>
                       <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-renta-300 group-focus-within:text-renta-600 transition-colors" />
                          <input 
                            type="email" 
                            placeholder="ejemplo@email.com"
                            value={cardData.email}
                            onChange={(e) => setCardData({...cardData, email: e.target.value})}
                            className="w-full h-11 bg-renta-50/30 border border-renta-100 rounded-xl pl-11 pr-4 text-sm font-bold text-renta-900 outline-none focus:ring-4 focus:ring-renta-500/10 focus:border-renta-300 transition-all placeholder:text-renta-300"
                          />
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-renta-500 uppercase tracking-[0.1em] ml-1">Número de Tarjeta</label>
                       <div className="relative group">
                          <WalletCards className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-renta-300 group-focus-within:text-renta-600 transition-colors" />
                          <input 
                            type="text" 
                            placeholder="0000 0000 0000 0000"
                            value={cardData.cardNumber}
                            onChange={(e) => setCardData({...cardData, cardNumber: e.target.value})}
                            className="w-full h-11 bg-renta-50/30 border border-renta-100 rounded-xl pl-11 pr-4 text-sm font-bold text-renta-900 outline-none focus:ring-4 focus:ring-renta-500/10 focus:border-renta-300 transition-all placeholder:text-renta-300"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-renta-500 uppercase tracking-[0.1em] ml-1">Vencimiento</label>
                          <input 
                            type="text" 
                            placeholder="MM/AA"
                            value={cardData.expirationDate}
                            onChange={(e) => setCardData({...cardData, expirationDate: e.target.value})}
                            className="w-full h-11 bg-renta-50/30 border border-renta-100 rounded-xl px-4 text-sm font-bold text-renta-900 outline-none focus:ring-4 focus:ring-renta-500/10 focus:border-renta-300 transition-all placeholder:text-renta-300 text-center"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-renta-500 uppercase tracking-[0.1em] ml-1">CVV</label>
                          <input 
                            type="password" 
                            placeholder="***"
                            value={cardData.cvv}
                            onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                            className="w-full h-11 bg-renta-50/30 border border-renta-100 rounded-xl px-4 text-sm font-bold text-renta-900 outline-none focus:ring-4 focus:ring-renta-500/10 focus:border-renta-300 transition-all placeholder:text-renta-300 text-center"
                          />
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-renta-500 uppercase tracking-[0.1em] ml-1">Nombre en la Tarjeta</label>
                       <input 
                         type="text" 
                         placeholder="EJ. JUAN PEREZ"
                         value={cardData.cardholderName}
                         onChange={(e) => setCardData({...cardData, cardholderName: e.target.value})}
                         className="w-full h-11 bg-renta-50/30 border border-renta-100 rounded-xl px-4 text-sm font-bold text-renta-900 outline-none focus:ring-4 focus:ring-renta-500/10 focus:border-renta-300 transition-all placeholder:text-renta-300 uppercase"
                       />
                    </div>
                 </div>

                 {/* Botón de Pago Compacto */}
                 <div className="pt-2">
                    <button 
                      onClick={() => handleProcessPayment(showPaymentModal.puntos, showPaymentModal.monto)}
                      disabled={isProcessing !== null}
                      className="w-full relative group"
                    >
                      <div className="absolute inset-0 bg-renta-400 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                      <div className="relative bg-renta-950 text-white rounded-xl py-4 font-black tracking-tight flex items-center justify-center gap-2 transition-all active:scale-[0.98] group-hover:bg-renta-900 shadow-lg shadow-renta-950/20">
                        {isProcessing === 'points_purchase' ? (
                          <Loader2 className="h-4 w-4 animate-spin text-renta-400" />
                        ) : (
                          <Shield className="h-4 w-4 text-emerald-400" />
                        )}
                        <span className="text-base">
                          {isProcessing === 'points_purchase' ? 'Procesando...' : `Pagar ${formatCurrency(showPaymentModal.monto)}`}
                        </span>
                      </div>
                    </button>
                    
                    <p className="mt-4 text-[8px] text-center text-renta-400 font-bold uppercase tracking-[0.15em] leading-relaxed">
                       Transacción protegida por Mercado Pago.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
