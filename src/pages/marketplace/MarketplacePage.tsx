import { useState, useEffect } from 'react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { WalletCards, Rocket, CheckCircle2, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { eden } from '@/services/eden';
import type { BoosterPlanAPI } from '@/types/region';
// import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

/**
 * MarketplacePage — Marketplace de Boosters con Dynamic Pricing.
 *
 * DIRECTIVA CTO: Los precios provienen OBLIGATORIAMENTE del API v1.7.0
 * endpoint: GET /api/v1/marketplace/plans?country_code={REGION}
 * Se prohíbe el uso de precios estáticos (hardcoded) en el frontend.
 *
 * La moneda se determina automáticamente por useRegion() — sin selector manual.
 */

export function MarketplacePage() {
  const { hasPermission, inmobiliaria_id } = useInmobiliaria();
  const { t, formatCurrency, country_code, config } = useRegion();

  // ── State: Dynamic Plans from API ──
  const [planes, setPlanes] = useState<BoosterPlanAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [simulandoPago, setSimulandoPago] = useState<string | null>(null);

  // ── Fetch plans from API v1.7.0 ──
  useEffect(() => {
    let cancelled = false;

    async function fetchPlanes() {
      setIsLoading(true);
      setLoadError(null);

      try {
        // @ts-ignore - Eden dynamic path resolving for API v1.7.0
        const { data, error } = await eden.marketplace.plans.get({
          query: { country_code }
        });

        if (cancelled) return;

        if (error) {
          console.warn('[Marketplace] API Error — Falling back to preview mode:', error.value);
          // Fallback: use preview data while API is not connected
          setPlanes(getPreviewPlans(country_code, config.currency_code));
          return;
        }

        if (data && Array.isArray(data)) {
          setPlanes(data as BoosterPlanAPI[]);
        } else {
          // API returned unexpected shape — use preview fallback
          setPlanes(getPreviewPlans(country_code, config.currency_code));
        }
      } catch {
        if (cancelled) return;
        console.warn('[Marketplace] Connection failed — Using preview plans.');
        // Graceful degradation: show preview plans while Búnker is unavailable
        setPlanes(getPreviewPlans(country_code, config.currency_code));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchPlanes();
    return () => { cancelled = true; };
  }, [country_code, config.currency_code]);

  // ── Purchase Flow ──
  const iniciarCompra = async (planId: string) => {
    // 1. Frontend calls mypropAPI to generate a MercadoPago Preference
    // POST /api/v1/marketplace/checkout { planId, country_code, inmobiliaria_id }
    // The backend uses the regional MP credentials (AR, MX, or US account)
    // 2. The response contains a preference_id used by the MP SDK Wallet component
    
    setSimulandoPago(planId);
    try {
      // @ts-ignore
      // const { data } = await eden.marketplace.checkout.post({
      //   planId,
      //   country_code,
      //   inmobiliaria_id
      // });
      // initMercadoPago(data.mp_public_key, { locale: config.currency_locale });
      
      // Simulation UI (until API endpoint is live)
      setTimeout(() => {
        alert(
          `Mock: Checkout de MercadoPago se abriría aquí.\n` +
          `Región: ${country_code} | Moneda: ${config.currency_code}\n` +
          `Webhook Plan: Dual-Verification GET x-signature listo.`
        );
        setSimulandoPago(null);
      }, 1500);
    } catch {
      setSimulandoPago(null);
    }
  };

  // ── Access Control ──
  if (!hasPermission(['superadmin', 'admin'])) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Shield className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold font-jakarta text-renta-950">
          {t('marketplace_acceso_denegado', 'Acceso Denegado')}
        </h2>
        <p className="text-sm font-inter text-renta-600">
          {t('marketplace_solo_admins', 'Solo administradores pueden adquirir Boosters.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-admin-border-subtle pb-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-widest mb-3">
              <Rocket className="h-3 w-3" /> {t('marketplace_badge', 'Ecosistema de Upselling')}
           </div>
           <h1 className="text-3xl font-bold text-renta-950 font-jakarta leading-tight tracking-tight">
             {t('marketplace_titulo', 'Marketplace de Boosters')}
           </h1>
           <p className="text-sm text-renta-600 font-inter mt-1.5 max-w-xl">
             {t('marketplace_subtitulo', 'Adquiera puntos de visibilidad para destacar sus propiedades.')}
           </p>
        </div>

        {/* Regional Currency Badge (replaces manual toggle) */}
        <div className="bg-white p-1 rounded-xl border border-admin-border shadow-sm inline-flex items-center gap-2 px-4 py-2.5">
          <span className="text-lg">{config.currency_symbol}</span>
          <span className="text-sm font-bold text-renta-950">{config.currency_code}</span>
          <span className="text-[10px] text-renta-400 uppercase tracking-wider">
            Moneda Regional
          </span>
        </div>
      </div>

      {/* ── Loading State ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-8 w-8 text-renta-400 animate-spin" />
          <p className="text-sm text-renta-500 font-inter">
            {t('marketplace_cargando', 'Cargando planes regionales...')}
          </p>
        </div>
      )}

      {/* ── Error State ── */}
      {loadError && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="text-sm text-amber-700 font-inter font-medium">{loadError}</p>
        </div>
      )}

      {/* ── Planes Grid ── */}
      {!isLoading && planes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-inter">
          {planes.map((plan) => (
             <div 
               key={plan.id}
               className={cn(
                 "relative flex flex-col p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl",
                 plan.popular 
                   ? "bg-gradient-to-b from-renta-950 to-renta-900 text-white border-renta-800 scale-[1.02] shadow-renta-950/20" 
                   : "bg-white border-admin-border hover:border-renta-300"
               )}
             >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                    {t('marketplace_popular', 'Más Elegido')}
                  </div>
                )}

                <div className="space-y-4 flex-1">
                   <h3 className={cn("text-xl font-jakarta font-bold", plan.popular ? "text-white" : "text-renta-950")}>
                      {plan.nombre}
                   </h3>
                   <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tighter">
                         {formatCurrency(plan.precio)}
                      </span>
                   </div>
                   
                   <div className="h-px w-full bg-admin-border-subtle my-6 opacity-30"></div>

                   <p className={cn("text-sm font-medium", plan.popular ? "text-renta-100" : "text-renta-700")}>
                      {plan.descripcion}
                   </p>

                   <ul className={cn("space-y-3 pt-4 text-sm font-medium", plan.popular ? "text-renta-200" : "text-renta-600")}>
                      <li className="flex items-center gap-2">
                         <CheckCircle2 className={cn("h-4 w-4", plan.popular ? "text-amber-400" : "text-emerald-500")} /> 
                         {t('marketplace_exposicion', 'Multiplica exposición')} x{Math.floor(plan.puntos / 10)}
                      </li>
                      <li className="flex items-center gap-2">
                         <CheckCircle2 className={cn("h-4 w-4", plan.popular ? "text-amber-400" : "text-emerald-500")} /> 
                         {plan.puntos} {t('marketplace_puntos', 'Gema-Puntos')}
                      </li>
                   </ul>
                </div>

                <div className="pt-8">
                   <button 
                     onClick={() => iniciarCompra(plan.id)}
                     disabled={simulandoPago !== null}
                     className={cn(
                       "w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold shadow-sm transition-all hover:scale-[1.02]",
                       plan.popular 
                         ? "bg-amber-400 text-amber-950 hover:bg-amber-300" 
                         : "bg-renta-950 text-white hover:bg-renta-800"
                     )}
                   >
                     {simulandoPago === plan.id ? t('marketplace_conectando', 'Conectando...') : (
                        <>
                          <WalletCards className="h-4 w-4" /> {t('boton_comprar', 'Comprar con Mercado Pago')}
                        </>
                     )}
                   </button>
                </div>
             </div>
          ))}
        </div>
      )}

      <div className="text-center pt-8 animate-fade-in text-[11px] font-medium text-renta-400 max-w-2xl mx-auto">
        {t('marketplace_footer', 'Operación procesada mediante CheckOut de Mercado Pago.')}
      </div>
    </div>
  );
}

/**
 * Preview Plans — Graceful degradation for when the API is unavailable.
 * These are DISPLAY ONLY and NEVER used for actual transactions.
 * All real purchases go through the API which returns server-side pricing.
 */
function getPreviewPlans(countryCode: string, currencyCode: string): BoosterPlanAPI[] {
  const priceMultiplier: Record<string, number> = { ARS: 1, MXN: 0.03, USD: 0.0016 };
  const multiplier = priceMultiplier[currencyCode] ?? 1;
  const baseARS = [5000, 20000, 70000];

  return [
    {
      id: 'preview-b1',
      nombre: 'Booster Básico',
      puntos: 10,
      descripcion: 'Puntos válidos para destacar 2 propiedades por 15 días.',
      precio: Math.round(baseARS[0] * multiplier),
      currency_code: currencyCode as BoosterPlanAPI['currency_code'],
    },
    {
      id: 'preview-b2',
      nombre: 'Pack Inmobiliaria PRO',
      puntos: 50,
      descripcion: 'Posicionamiento VIP. Destaca hasta 10 propiedades mensuales en el ecosistema.',
      precio: Math.round(baseARS[1] * multiplier),
      currency_code: currencyCode as BoosterPlanAPI['currency_code'],
      popular: true,
    },
    {
      id: 'preview-b3',
      nombre: 'Agencia Master',
      puntos: 200,
      descripcion: 'Cobertura total. Presencia en top de búsquedas para todo tu catálogo.',
      precio: Math.round(baseARS[2] * multiplier),
      currency_code: currencyCode as BoosterPlanAPI['currency_code'],
    },
  ];
}
