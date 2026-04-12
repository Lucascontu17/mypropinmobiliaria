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
import { eden } from '@/services/eden';

export function MarketplacePage() {
  const { hasPermission, inmobiliaria_id } = useInmobiliaria();
  const { t, formatCurrency, country_code, config } = useRegion();

  const [activeTab, setActiveTab] = useState<'addons' | 'points'>('addons');
  
  // Data from API
  const [catalog, setCatalog] = useState<{
    addons: any[];
    packages: any[];
    balance: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Custom Points purchase
  const [customPoints, setCustomPoints] = useState<number>(0);
  const pricePerPoint = country_code === 'AR' ? 100 : country_code === 'MX' ? 20 : 1; // Valuación definida por negocio

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    setIsLoading(true);
    try {
      // @ts-ignore
      const { data, error } = await eden.marketplace.catalog.get();
      if (data) setCatalog(data);
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const aquirirAddon = async (addonId: string) => {
    if (!confirm(t('marketplace_confirm_addon', '¿Desea adquirir esta función? El cobro se verá reflejado a partir de su próxima cuota mensual de suscripción.'))) return;
    
    setIsProcessing(addonId);
    try {
      // @ts-ignore
      await eden.marketplace['acquire-addon'].post({ addon_id: addonId });
      alert(t('marketplace_success_addon', 'Función adquirida con éxito. Se activará de inmediato.'));
      fetchCatalog();
    } catch (err) {
      alert('Error al adquirir la función.');
    } finally {
      setIsProcessing(null);
    }
  };

  const comprarPuntos = async (puntos: number, monto: number) => {
    setIsProcessing('points_purchase');
    try {
      // @ts-ignore
      await eden.marketplace['buy-points'].post({ 
        puntos, 
        monto: monto.toString(),
        metodo: 'Mercado Pago (Simulado)'
      });
      alert(t('marketplace_success_points', `Has comprado ${puntos} puntos. Ya están disponibles en tu balance.`));
      fetchCatalog();
    } catch (err) {
      alert('Error en la transacción.');
    } finally {
      setIsProcessing(null);
    }
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

  return (
    <div className="space-y-8 animate-fade-in-up">
      
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
          <div data-joyride="mkt-balance" className="bg-gradient-to-br from-renta-950 to-renta-800 p-5 rounded-2xl shadow-xl shadow-renta-950/20 text-white min-w-[200px] border border-renta-700">
            <p className="text-[10px] font-bold uppercase tracking-widest text-renta-400 mb-1">Puntos Disponibles</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black font-jakarta tracking-tighter">{catalog?.balance || 0}</span>
              <Rocket className="h-6 w-6 text-amber-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div data-joyride="mkt-tabs" className="flex gap-2 p-1 bg-admin-surface rounded-xl border border-admin-border w-fit">
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
            <div key={addon.id} className="group bg-white rounded-2xl border border-admin-border hover:border-renta-300 transition-all duration-300 p-6 flex flex-col hover:shadow-lg">
              <div className="h-12 w-12 rounded-xl bg-renta-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PlusCircle className="h-6 w-6 text-renta-600" />
              </div>
              <h3 className="text-lg font-bold font-jakarta text-renta-950">{addon.nombre}</h3>
              <p className="text-sm text-renta-600 mt-2 flex-1 font-inter">{addon.descripcion}</p>
              
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

                <button
                  onClick={() => aquirirAddon(addon.id)}
                  disabled={isProcessing !== null}
                  className="w-full bg-renta-950 text-white rounded-xl py-3 text-sm font-bold hover:bg-renta-800 transition-colors disabled:opacity-50"
                >
                  {isProcessing === addon.id ? "Procesando..." : "Adquirir Función"}
                </button>
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
    </div>
  );
}
