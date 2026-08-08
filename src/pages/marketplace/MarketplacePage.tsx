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
  Mail,
  Store,
  ExternalLink,
  MapPin,
  Building2,
  BadgeCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEden } from '@/services/eden';
import { LocalShepherd, type ShepherdStep } from '@/components/shepherd/LocalShepherd';
import { toast } from 'sonner';

export function MarketplacePage() {
  const { hasPermission, inmobiliaria_id } = useInmobiliaria();
  const { t, formatCurrency, country_code, config } = useRegion();
  const { client: eden, isReady } = useEden();

  const [activeTab, setActiveTab] = useState<'addons' | 'points' | 'partners'>('addons');
  
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
      // @ts-expect-error - Eden Treaty dynamic path
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
    const addon = catalog?.addons.find(a => a.id === addonId);
    const isAi = addon && (addon.nombre.includes('IA') || addon.nombre.includes('AI') || addon.nombre.includes('Copilot'));
    const confirmMsg = isAi 
      ? '¿Desea habilitar esta función de Inteligencia Artificial? Se cobrará por cada descripción generada y se acumulará en su próxima cuota mensual.'
      : t('marketplace_confirm_addon', '¿Desea adquirir esta función? El cobro se verá reflejado a partir de su próxima cuota mensual de suscripción.');
    
    if (!confirm(confirmMsg)) return;
    
    setIsProcessing(addonId);
    try {
      // @ts-expect-error - Eden Treaty dynamic path
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
      // @ts-expect-error - Eden Treaty dynamic path
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
    email: '',
    identificationType: 'DNI',
    identificationNumber: ''
  });

  const handleProcessPayment = async (puntos: number, monto: number) => {
    if (!cardData.email || !cardData.cardNumber) {
      toast.error("Por favor complete todos los campos de pago.");
      return;
    }

    setIsProcessing('points_purchase');
    
    try {
      const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
      if (!mpPublicKey) {
        throw new Error('VITE_MP_PUBLIC_KEY no está configurada. Verifique el archivo .env');
      }

      // 1. Initialize Mercado Pago
      // @ts-expect-error - Eden Treaty dynamic path
      const mp = new window.MercadoPago(mpPublicKey, {
        locale: 'es-AR'
      });

      if (!cardData.identificationNumber.trim()) {
        throw new Error('Debe completar el número de identificación');
      }

      // 2. Tokenize Card
      const [month, year] = cardData.expirationDate.split('/');
      const tokenResponse = await mp.createCardToken({
        cardNumber: cardData.cardNumber.replace(/\s/g, ''),
        cardholderName: cardData.cardholderName,
        cardExpirationMonth: month,
        cardExpirationYear: "20" + year,
        securityCode: cardData.cvv,
        identificationType: cardData.identificationType,
        identificationNumber: cardData.identificationNumber
      });

      if (!tokenResponse.id) {
        throw new Error("No se pudo generar el token de seguridad de la tarjeta.");
      }

      // 3. Send to API
      // @ts-expect-error - Eden Treaty dynamic path
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
      <div data-shepherd="mkt-tabs" className="flex gap-2 p-1 bg-admin-surface rounded-xl ring-1 ring-inset ring-admin-border border-transparent w-fit">
        <button
          onClick={() => setActiveTab('addons')}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
            activeTab === 'addons' ? "bg-white text-renta-950 shadow-sm ring-1 ring-inset ring-admin-border border-transparent" : "text-renta-500 hover:text-renta-700"
          )}
        >
          Funciones Extra
        </button>
        <button
          onClick={() => setActiveTab('points')}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
            activeTab === 'points' ? "bg-white text-renta-950 shadow-sm ring-1 ring-inset ring-admin-border border-transparent" : "text-renta-500 hover:text-renta-700"
          )}
        >
          Comprar Puntos
        </button>
        <button
          onClick={() => setActiveTab('partners')}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
            activeTab === 'partners' ? "bg-white text-renta-950 shadow-sm ring-1 ring-inset ring-admin-border border-transparent" : "text-renta-500 hover:text-renta-700"
          )}
        >
          <Store className="h-4 w-4 inline-block -mt-0.5 mr-1.5" />
          Servicios de Partners
        </button>
      </div>

      {/* ── Content Area: Addons ── */}
      {activeTab === 'addons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalog?.addons.map((addon) => (
            <div key={addon.id} className={`group bg-white rounded-2xl border transition-all duration-300 p-6 flex flex-col hover:shadow-lg ${addon.is_acquired ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-admin-border hover:border-renta-300'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-renta-50 flex items-center justify-center group-hover:scale-110 transition-transform text-2xl">
                  {addon.icon_tag || <PlusCircle className="h-6 w-6 text-renta-600" />}
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
                    <span className="text-[10px] font-bold text-renta-400 ml-1 uppercase">
                      / {(addon.nombre.includes('IA') || addon.nombre.includes('AI') || addon.nombre.includes('Copilot')) ? 'uso' : 'mes'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-3 mb-4 border border-amber-100 flex gap-2">
                  <Info className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-[10px] text-amber-700 font-medium">
                    {(addon.nombre.includes('IA') || addon.nombre.includes('AI') || addon.nombre.includes('Copilot'))
                      ? "Se cobrará por cada descripción generada y se acumulará en su próxima cuota mensual."
                      : "Se cobrará como cargo extra mensual fijo en su próxima cuota de suscripción."}
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
      )}

      {/* ── Content Area: Points ── */}
      {activeTab === 'points' && (
        <div className="space-y-10">
          {/* Packages - Rediseño Premium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {catalog?.packages.map((pkg, index) => {
              // Visual tiers dinámicos definidos desde el panel central
              const tier = pkg.tier || 'default';
              const tierConfigs: Record<string, { gradient: string; bg: string; border: string; lightBg: string; accent: string; icon: string; shadow: string; ring: string; btnBg: string; btnHover: string; badgeColor: string; label: string }> = {
                bronze: { gradient: 'from-amber-700 to-amber-900', bg: 'bg-amber-50', border: 'border-amber-200/60', lightBg: 'bg-amber-50/40', accent: 'text-amber-700', icon: '🥉', shadow: 'shadow-amber-900/10', ring: 'ring-amber-200/30', btnBg: 'bg-amber-800', btnHover: 'hover:bg-amber-700', badgeColor: 'bg-amber-600', label: 'Bronce' },
                silver: { gradient: 'from-slate-500 to-slate-700', bg: 'bg-slate-50', border: 'border-slate-200/60', lightBg: 'bg-slate-50/40', accent: 'text-slate-700', icon: '🥈', shadow: 'shadow-slate-900/10', ring: 'ring-slate-200/30', btnBg: 'bg-slate-700', btnHover: 'hover:bg-slate-600', badgeColor: 'bg-slate-600', label: 'Plata' },
                gold: { gradient: 'from-yellow-500 to-amber-600', bg: 'bg-yellow-50', border: 'border-yellow-200/60', lightBg: 'bg-yellow-50/40', accent: 'text-yellow-700', icon: '🥇', shadow: 'shadow-yellow-900/15', ring: 'ring-yellow-200/30', btnBg: 'bg-gradient-to-r from-yellow-500 to-amber-600', btnHover: 'hover:from-yellow-400 hover:to-amber-500', badgeColor: 'bg-gradient-to-r from-yellow-500 to-amber-600', label: 'Oro' },
                default: { gradient: 'from-teal-500 to-teal-700', bg: 'bg-teal-50', border: 'border-teal-200/60', lightBg: 'bg-teal-50/40', accent: 'text-teal-700', icon: '🎯', shadow: 'shadow-teal-900/10', ring: 'ring-teal-200/30', btnBg: 'bg-teal-700', btnHover: 'hover:bg-teal-600', badgeColor: 'bg-teal-600', label: 'Estándar' },
              };
              const tierConfig = tierConfigs[tier] || tierConfigs.default;

              return (
                <div
                  key={pkg.id}
                  className={`group relative bg-white rounded-3xl p-[1px] transition-all duration-500 hover:shadow-2xl ${tier === 'gold' ? 'bg-gradient-to-b from-yellow-300 via-yellow-200 to-transparent shadow-xl shadow-yellow-900/20' : `ring-1 ring-inset ${tierConfig.ring} shadow-lg ${tierConfig.shadow}`}`}
                >
                  {/* Inner Card */}
                  <div className={`relative bg-white rounded-[23px] p-6 sm:p-7 flex flex-col h-full ${tier === 'gold' ? 'ring-1 ring-inset ring-yellow-200/50' : ''}`}>
                    
                    {/* Popular Badge - Solo para Plata (el del medio) */}
                    {tier === 'silver' && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-[9px] font-black tracking-[0.2em] px-4 py-1.5 rounded-full uppercase shadow-lg shadow-slate-900/30 z-10 whitespace-nowrap border border-white/10">
                        ⭐ MÁS POPULAR
                      </div>
                    )}

                    {/* Icono y Título */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-11 h-11 ${tierConfig.bg} rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300 shadow-inner ${tierConfig.border}`}>
                        <span>{tierConfig.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-base font-black font-jakarta text-renta-950 leading-tight">{pkg.nombre}</h3>
                        <p className={`text-[10px] font-bold tracking-wider ${tierConfig.accent} mt-0.5`}>
                          {pkg.puntos.toLocaleString()} Puntos de Visibilidad
                        </p>
                      </div>
                    </div>

                    {/* Precio */}
                    <div className="mb-5">
                      <p className="text-[9px] font-bold text-renta-400 uppercase tracking-[0.2em] mb-1">Inversión</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black font-jakarta text-renta-950 tracking-tight">{formatCurrency(pkg.precio)}</span>
                        <span className="text-xs font-bold text-renta-400">/ único</span>
                      </div>
                    </div>

                    {/* Barra de Valor Proporcional */}
                    <div className={`p-4 ${tierConfig.lightBg} rounded-2xl ${tierConfig.border} mb-5 flex-1`}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="flex-1 h-2 bg-renta-200/50 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${tierConfig.gradient} transition-all duration-700 group-hover:opacity-80`} style={{ width: `${(pkg.puntos / (catalog?.packages?.[catalog.packages.length - 1]?.puntos || pkg.puntos)) * 100}%` }} />
                        </div>
                        <span className={`text-[10px] font-black ${tierConfig.accent}`}>{pkg.puntos} pts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Zap className={`h-3 w-3 ${tierConfig.accent}`} />
                        <span className="text-[10px] font-bold text-renta-500">
                          {tier === 'bronze' ? 'Ideal para empezar' : tier === 'silver' ? 'El balance perfecto' : tier === 'gold' ? 'Máximo rendimiento' : 'Gran valor'}

                        </span>
                      </div>
                    </div>

                    {/* Botón */}
                    <button
                      onClick={() => comprarPuntos(pkg.puntos, Number(pkg.precio))}
                      className={`w-full ${tierConfig.btnBg} text-white rounded-2xl py-3.5 text-xs font-black uppercase tracking-widest ${tierConfig.btnHover} transition-all duration-300 active:scale-[0.97] shadow-lg ${tierConfig.shadow} flex items-center justify-center gap-2 group/btn`}
                    >
                      Elegir este Pack
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
                    </button>

                    {/* Info extra */}
                    <div className="mt-3 flex items-center justify-center gap-1">
                      <span className="text-[8px] font-bold text-renta-400 uppercase tracking-wider">
                        {(pkg.puntos / Number(pkg.precio)).toFixed(2)} pts / {country_code === 'MX' ? '$' : '$'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Points */}
          <div className="bg-gradient-to-br from-white to-renta-50/30 rounded-[32px] ring-1 ring-inset ring-admin-border border-transparent p-10 max-w-2xl shadow-sm hover:shadow-md transition-shadow">
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

      {/* ── Content Area: Partners ── */}
      {activeTab === 'partners' && (
        <div className="animate-fade-in-up space-y-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-renta-950 via-renta-900 to-renta-950 rounded-3xl p-8 sm:p-12 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-400 rounded-full blur-[100px]" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-renta-400 rounded-full blur-[100px]" />
            </div>
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest mb-5 border border-white/10">
                <Store className="h-3.5 w-3.5" /> Red de Partners Zonatia
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-jakarta tracking-tight leading-tight mb-4">
                Servicios Profesionales para Impulsar tu Inmobiliaria
              </h2>
              <p className="text-renta-300/90 text-sm sm:text-base leading-relaxed max-w-2xl font-inter">
                Conectamos tu inmobiliaria con los mejores profesionales del sector inmobiliario. 
                Desde fotografía profesional y home staging, hasta asesoría legal y marketing digital. 
                Potencia tus propiedades, destaca en el mercado y cierra más negocios.
              </p>
            </div>
          </div>

          {/* Partner Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card: Fotografía Profesional */}
            <div className="bg-white rounded-2xl border border-admin-border p-6 hover:shadow-lg hover:border-renta-300 transition-all duration-300 group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📸</span>
              </div>
              <h3 className="text-lg font-bold font-jakarta text-renta-950 mb-2">Fotografía Profesional</h3>
              <p className="text-sm text-renta-600 font-inter leading-relaxed mb-4">
                Captura la esencia de cada propiedad con imágenes de calidad premium. 
                Tours virtuales 360°, video tour, fotografía con drone y contenido para redes sociales.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <BadgeCheck className="h-4 w-4" /> 
                <span>Hasta 3 partners disponibles en tu zona</span>
              </div>
            </div>

            {/* Card: Home Staging & Decoración */}
            <div className="bg-white rounded-2xl border border-admin-border p-6 hover:shadow-lg hover:border-renta-300 transition-all duration-300 group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🏡</span>
              </div>
              <h3 className="text-lg font-bold font-jakarta text-renta-950 mb-2">Home Staging & Decoración</h3>
              <p className="text-sm text-renta-600 font-inter leading-relaxed mb-4">
                Prepara tus propiedades para la venta con técnicas de home staging. 
                Asesoramiento en decoración, mobiliario temporal, y puesta en valor de espacios.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <BadgeCheck className="h-4 w-4" /> 
                <span>Profesionales certificados</span>
              </div>
            </div>

            {/* Card: Marketing Digital */}
            <div className="bg-white rounded-2xl border border-admin-border p-6 hover:shadow-lg hover:border-renta-300 transition-all duration-300 group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-lg font-bold font-jakarta text-renta-950 mb-2">Marketing Digital Inmobiliario</h3>
              <p className="text-sm text-renta-600 font-inter leading-relaxed mb-4">
                Estrategias de marketing digital especializadas para el sector inmobiliario. 
                Campañas en redes sociales, SEM, SEO local, y generación de leads calificados.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <BadgeCheck className="h-4 w-4" /> 
                <span>Resultados medibles garantizados</span>
              </div>
            </div>

            {/* Card: Asesoría Legal */}
            <div className="bg-white rounded-2xl border border-admin-border p-6 hover:shadow-lg hover:border-renta-300 transition-all duration-300 group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">⚖️</span>
              </div>
              <h3 className="text-lg font-bold font-jakarta text-renta-950 mb-2">Asesoría Legal Inmobiliaria</h3>
              <p className="text-sm text-renta-600 font-inter leading-relaxed mb-4">
                Soporte legal completo para tus operaciones. Revisión de contratos, 
                estudios de títulos, aspectos regulatorios, y representación en negociaciones.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <BadgeCheck className="h-4 w-4" /> 
                <span>Especialistas en derecho inmobiliario</span>
              </div>
            </div>

            {/* Card: Tasaciones y Valuaciones */}
            <div className="bg-white rounded-2xl border border-admin-border p-6 hover:shadow-lg hover:border-renta-300 transition-all duration-300 group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-lg font-bold font-jakarta text-renta-950 mb-2">Tasaciones y Valuaciones</h3>
              <p className="text-sm text-renta-600 font-inter leading-relaxed mb-4">
                Servicio de tasación profesional con avalúos precisos del mercado actual. 
                Informes detallados para compra-venta, hipotecas, y sucesiones.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <BadgeCheck className="h-4 w-4" /> 
                <span>Matriculados y certificados</span>
              </div>
            </div>

            {/* Card: Inspecciones Técnicas */}
            <div className="bg-white rounded-2xl border border-admin-border p-6 hover:shadow-lg hover:border-renta-300 transition-all duration-300 group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-lg font-bold font-jakarta text-renta-950 mb-2">Inspecciones Técnicas</h3>
              <p className="text-sm text-renta-600 font-inter leading-relaxed mb-4">
                Inspecciones integrales de propiedades. Diagnóstico de estructuras, 
                instalaciones, humedades, eficiencia energética y más. ¡Transparencia total para tu cliente!
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <BadgeCheck className="h-4 w-4" /> 
                <span>Informes técnicos detallados</span>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-gradient-to-br from-renta-50 to-white rounded-3xl border border-renta-100 p-8 sm:p-10">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black font-jakarta text-renta-950 mb-2">Beneficios de usar Partners Zonatia</h3>
              <p className="text-sm text-renta-500 font-inter">Todo lo que ganas al integrar servicios profesionales en tu operación diaria.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4">
                <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Rocket className="h-6 w-6 text-emerald-600" />
                </div>
                <h4 className="text-sm font-bold font-jakarta text-renta-950 mb-1">Mayor Velocidad de Venta</h4>
                <p className="text-xs text-renta-500 font-inter leading-relaxed">Propiedades con fotos profesionales y home staging se venden hasta 3x más rápido.</p>
              </div>

              <div className="text-center p-4">
                <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">💰</span>
                </div>
                <h4 className="text-sm font-bold font-jakarta text-renta-950 mb-1">Mejor Precio de Venta</h4>
                <p className="text-xs text-renta-500 font-inter leading-relaxed">Propiedades bien presentadas logran un valor de venta hasta 15% superior.</p>
              </div>

              <div className="text-center p-4">
                <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-sm font-bold font-jakarta text-renta-950 mb-1">Tranquilidad Legal</h4>
                <p className="text-xs text-renta-500 font-inter leading-relaxed">Operaciones respaldadas por asesoría legal especializada. Minimiza riesgos.</p>
              </div>

              <div className="text-center p-4">
                <div className="h-12 w-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <BadgeCheck className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="text-sm font-bold font-jakarta text-renta-950 mb-1">Diferenciación Competitiva</h4>
                <p className="text-xs text-renta-500 font-inter leading-relaxed">Destaca frente a otras inmobiliarias ofreciendo servicios de valor agregado.</p>
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-white rounded-3xl border border-admin-border p-8 sm:p-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-renta-50 rounded-full border border-renta-100 text-renta-700 text-[10px] font-bold uppercase tracking-widest mb-3">
                <Zap className="h-3 w-3" /> Así funciona
              </div>
              <h3 className="text-2xl font-black font-jakarta text-renta-950">¿Cómo contratar un Partner?</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="text-center relative">
                <div className="h-14 w-14 bg-renta-950 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-black font-jakarta shadow-xl shadow-renta-950/20">1</div>
                <h4 className="text-sm font-bold font-jakarta text-renta-950 mb-2">Explora el Directorio</h4>
                <p className="text-xs text-renta-500 font-inter leading-relaxed">Navega por las categorías de servicios y encuentra el partner ideal para cada necesidad.</p>
              </div>
              <div className="text-center relative">
                <div className="h-14 w-14 bg-renta-950 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-black font-jakarta shadow-xl shadow-renta-950/20">2</div>
                <h4 className="text-sm font-bold font-jakarta text-renta-950 mb-2">Conecta Directamente</h4>
                <p className="text-xs text-renta-500 font-inter leading-relaxed">Comunícate con el partner, solicita presupuesto y coordina los detalles del servicio.</p>
              </div>
              <div className="text-center">
                <div className="h-14 w-14 bg-renta-950 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-black font-jakarta shadow-xl shadow-renta-950/20">3</div>
                <h4 className="text-sm font-bold font-jakarta text-renta-950 mb-2">Potencia tu Propiedad</h4>
                <p className="text-xs text-renta-500 font-inter leading-relaxed">Una vez realizado el servicio, tu propiedad estará lista para destacar y venderse más rápido.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-renta-950 to-renta-900 rounded-3xl p-8 sm:p-12 text-center text-white">
            <h3 className="text-2xl sm:text-3xl font-black font-jakarta mb-3">¿Eres un profesional y quieres ser Partner?</h3>
            <p className="text-renta-300/90 text-sm sm:text-base max-w-2xl mx-auto mb-6 font-inter">
              Únete a la red de partners Zonatia y ofrece tus servicios a cientos de inmobiliarias en toda Latinoamérica. 
              Amplía tu cartera de clientes y haz crecer tu negocio.
            </p>
            <a
              href="/partners/apply"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-renta-950 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-renta-100 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98]"
            >
              Quiero ser Partner <ExternalLink className="h-4 w-4" />
            </a>
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

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-renta-500 uppercase tracking-[0.1em] ml-1">Tipo de Identificación</label>
                          <select
                            value={cardData.identificationType}
                            onChange={(e) => setCardData({...cardData, identificationType: e.target.value})}
                            className="w-full h-11 bg-renta-50/30 border border-renta-100 rounded-xl px-4 text-sm font-bold text-renta-900 outline-none focus:ring-4 focus:ring-renta-500/10 focus:border-renta-300 transition-all"
                          >
                            <option value="DNI">DNI</option>
                            <option value="CI">Cédula de Identidad</option>
                            <option value="RUT">RUT</option>
                            <option value="PASSPORT">Pasaporte</option>
                            <option value="CPF">CPF (Brasil)</option>
                            <option value="RFC">RFC (México)</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-renta-500 uppercase tracking-[0.1em] ml-1">N° de Identificación</label>
                          <input
                            type="text"
                            placeholder="Ingrese su documento"
                            value={cardData.identificationNumber}
                            onChange={(e) => setCardData({...cardData, identificationNumber: e.target.value})}
                            className="w-full h-11 bg-renta-50/30 border border-renta-100 rounded-xl px-4 text-sm font-bold text-renta-900 outline-none focus:ring-4 focus:ring-renta-500/10 focus:border-renta-300 transition-all placeholder:text-renta-300"
                          />
                       </div>
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
