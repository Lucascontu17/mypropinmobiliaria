import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  AlertCircle,
  BarChart3,
  Clock,
  Calendar,
  DollarSign,
  PlusCircle,
  ChevronRight,
  Eye,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { useEden } from '@/services/eden';
import { useNavigate } from 'react-router-dom';
import { LocalShepherd, type ShepherdStep } from '@/components/shepherd/LocalShepherd';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  delay: number;
  loading?: boolean;
}

function StatCard({ label, value, change, trend, icon: Icon, delay, loading }: StatCardProps) {
  return (
    <div
      className={cn(
        "admin-card-interactive group p-6 opacity-0 animate-fade-in-up",
        loading && "animate-pulse"
      )}
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-renta-100 to-renta-200/50 transition-transform duration-300 group-hover:scale-110">
          <Icon className={cn(
            "h-5 w-5",
            trend === 'down' ? "text-red-600" : "text-renta-700"
          )} />
        </div>
        {!loading && (
          <span
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              trend === 'up' && 'bg-emerald-50 text-emerald-600',
              trend === 'down' && 'bg-red-50 text-red-500',
              trend === 'neutral' && 'bg-renta-50 text-renta-500'
            )}
          >
            {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
            {trend === 'neutral' && <Activity className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-24 bg-renta-100 rounded-md mb-2" />
        ) : (
          <p className={cn(
            "admin-stat-value",
            trend === 'down' && value !== '$0' && "text-red-600"
          )}>{value}</p>
        )}
        <p className="admin-stat-label mt-1">{label}</p>
      </div>
    </div>
  );
}

interface StatDef {
  dialectKey: string;
  fallbackLabel: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  requiresAdmin: boolean;
}

export function DashboardPage() {
  const { role, hasPermission } = useInmobiliaria();
  const { t, formatCurrency } = useRegion();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { client: eden, isReady } = useEden();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!isReady) return;
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await eden.admin.metrics.get();
        if (error || !data) {
          setError(t('error_dashboard', 'Servicio momentáneamente no disponible.'));
        } else {
          // @ts-expect-error - Eden Treaty dynamic path
          setMetrics(data?.metrics);
        }
      } catch (err) {
        console.error('[DASHBOARD-FETCH-ERROR]', err);
        setError(t('error_dashboard_conn', 'Error de conexión con el servidor. Verifique su configuración de API.'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, [eden, isReady]);

  const getStats = (): StatDef[] => [
    {
      dialectKey: 'kpi_propiedades',
      fallbackLabel: 'Propiedades Activas',
      value: isLoading ? '...' : (metrics?.totalPropiedades?.toString() || '0'),
      change: '+0%',
      trend: 'neutral',
      icon: Building2,
      requiresAdmin: false,
    },
    {
      dialectKey: 'kpi_cobranza',
      fallbackLabel: 'Recaudación del Mes',
      value: isLoading ? '...' : (formatCurrency(metrics?.cobranzaMes || 0)),
      change: t('kpi_real', 'Cobrado'),
      trend: 'up',
      icon: Wallet,
      requiresAdmin: true,
    },
    {
      dialectKey: 'kpi_morosidad',
      fallbackLabel: 'Morosidad (Deuda)',
      value: isLoading ? '...' : (formatCurrency(metrics?.deudaPendiente || 0)),
      change: t('kpi_riesgo', 'Pendiente'),
      trend: (metrics?.deudaPendiente || 0) > 0 ? 'down' : 'up',
      icon: AlertCircle,
      requiresAdmin: true,
    },
    {
      dialectKey: 'kpi_ocupacion',
      fallbackLabel: 'Tasa de Ocupación',
      value: isLoading ? '...' : `${metrics?.tasaOcupacion || 0}%`,
      change: 'Meta 95%',
      trend: 'neutral',
      icon: TrendingUp,
      requiresAdmin: true,
    },
    {
      dialectKey: 'kpi_comisiones',
      fallbackLabel: 'Mis Comisiones',
      value: isLoading ? '...' : (formatCurrency(metrics?.comisionesEstimadas || 0)),
      change: t('kpi_ganancia', 'Tu Utilidad'),
      trend: 'up',
      icon: BarChart3,
      requiresAdmin: true,
    },
    {
      dialectKey: 'kpi_vencimientos',
      fallbackLabel: 'Vencimientos (60d)',
      value: isLoading ? '...' : (metrics?.proximosVencimientos?.toString() || '0'),
      change: t('kpi_operacion', 'A Renovar'),
      trend: 'neutral',
      icon: Clock,
      requiresAdmin: true,
    },
  ];

  const visibleStats = getStats().filter(stat => {
    if (stat.requiresAdmin && !hasPermission(['superadmin', 'admin'])) return false;
    return true;
  });

  const shepherdSteps: ShepherdStep[] = [
    {
      target: '[data-shepherd="dash-kpis"]',
      title: t('tour_dash_kpis_title', 'KPIs Estratégicos'),
      content: t('tour_dash_kpis_desc', 'Este panel le ofrece una vista rápida del estado general de su negocio: propiedades activas, recaudación, morosidad, tasa de ocupación y comisiones. Cada indicador se actualiza en tiempo real.'),
      placement: 'bottom',
    },
    {
      target: '[data-shepherd="dash-suscripcion"]',
      title: t('tour_dash_suscripcion_title', 'Resumen de Suscripción'),
      content: t('tour_dash_suscripcion_desc', 'Aquí se muestra el estado de su suscripción MyProp, el consumo de servicios de IA acumulado y el total a abonar en su próximo pago mensual. Si es miembro VIP, todas las funciones premium están bonificadas.'),
      placement: 'bottom',
    },
    {
      target: '[data-shepherd="dash-acciones"]',
      title: t('tour_dash_acciones_title', 'Acciones Rápidas'),
      content: t('tour_dash_acciones_desc', 'Accesos directos a las tareas más frecuentes: visite su agenda de visitas, gestione cobranzas pendientes o cree un nuevo contrato con un solo clic.'),
      placement: 'top',
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      <LocalShepherd steps={shepherdSteps} storageKey={`enjoy_local_dashboard_${role}`} />

      {/* ── Page Header ── */}
      <div className="opacity-0 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-renta-950 lg:text-3xl font-jakarta">

          {t('panel_titulo', 'Panel de Control')}
        </h1>
        <p className="mt-1 text-sm text-renta-600 font-inter">
          {t('panel_subtitulo', 'Resumen estratégico de tu inmobiliaria.')}{' '}
          <span className="text-renta-400 font-bold ml-1">
             {role.toUpperCase()} MODE
          </span>
        </p>
      </div>

      {/* ── ALERTA PERIODO DE GRACIA ── */}
      {!isLoading && !metrics?.suscripcion?.is_vip && metrics?.suscripcion?.status === 'gracia' && (() => {
        const graceEnd = new Date(metrics.suscripcion.fecha_vencimiento);
        graceEnd.setDate(graceEnd.getDate() + 7);
        const daysLeft = Math.ceil((graceEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return (
          <div className="bg-[#fffbe6] border border-[#ffd666] rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-in-up">
            <Calendar className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-amber-900 text-sm font-medium font-inter">
              Periodo de gracia: {daysLeft > 0
                ? `quedan ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'} antes de que su suscripción expire.`
                : 'su suscripción ha expirado.'}
            </p>
          </div>
        );
      })()}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div data-shepherd="dash-kpis" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="admin-card p-6 animate-pulse bg-white ring-1 ring-inset ring-admin-border border-transparent rounded-2xl">
              <div className="flex justify-between items-start">
                <div className="h-11 w-11 rounded-xl bg-renta-50" />
                <div className="h-5 w-12 rounded-full bg-renta-50" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-8 w-24 bg-renta-100 rounded-lg" />
                <div className="h-4 w-32 bg-renta-50 rounded" />
              </div>
            </div>
          ))
        ) : (
          visibleStats?.map((stat, index) => (
            <StatCard
              key={stat.dialectKey}
              label={t(stat.dialectKey, stat.fallbackLabel)}
              value={stat.value}
              change={stat.change}
              trend={stat.trend}
              icon={stat.icon}
              delay={100 + index * 60}
              loading={isLoading}
            />
          ))
        )}
      </div>

      {/* ── Suscripción y Extras AI ── */}
      {!isLoading && (
        metrics?.suscripcion?.is_vip ? (
          <div data-shepherd="dash-suscripcion" className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 rounded-2xl border border-indigo-800 shadow-xl flex items-center justify-between gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>

            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/10 flex-shrink-0">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg leading-tight uppercase">MIEMBRO VIP</h3>
                <p className="text-indigo-200 text-xs sm:text-sm mt-0.5 font-medium">Disfrutas de acceso ilimitado a todas las funciones premium y AI sin cargo adicional.</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/10">
              <span className="text-indigo-100 font-bold tracking-widest text-sm uppercase">Suscripción Bonificada</span>
            </div>
          </div>
        ) : metrics?.suscripcion && (
          <div data-shepherd="dash-suscripcion" className="bg-gradient-to-r from-renta-900 to-renta-950 p-6 rounded-2xl border border-renta-800 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>

            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/10 flex-shrink-0">
                <Sparkles className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">Zonatia AI & Servicios</h3>
                <p className="text-renta-400 text-xs sm:text-sm mt-0.5 font-medium">Consumo acumulado a liquidar en tu próxima factura.</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-x-8 gap-y-4 items-center justify-end w-full lg:w-auto">
              <div className="text-right">
                <p className="text-[10px] font-bold text-renta-500 uppercase tracking-widest">Abono Base</p>
                <p className="text-white font-mono text-lg font-bold">{formatCurrency(metrics.suscripcion.monto_base)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Consumo IA</p>
                <p className="text-amber-400 font-mono text-xl font-black">+{formatCurrency(metrics.suscripcion.acumulado_ia)}</p>
              </div>
              <div className="h-10 w-[1px] bg-white/10 hidden lg:block" />
              <div className="text-right bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <p className="text-[10px] font-bold text-renta-400 uppercase tracking-widest">Total Próximo Pago</p>
                <p className="text-white font-mono text-2xl font-black">{formatCurrency(metrics.suscripcion.total_proximo)}</p>
              </div>
            </div>
          </div>
        )
      )}

      {/* ── Quick Actions Section ── */}
      <div className="space-y-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
         <h2 className="text-sm font-bold text-renta-900 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-renta-500" /> Acciones Rápidas y Actividad
         </h2>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Visitas de Hoy */}
            <button 
              onClick={() => navigate('/visitas')}
              className="flex items-center justify-between p-4 bg-white ring-1 ring-inset ring-admin-border border-transparent rounded-2xl hover:border-renta-300 hover:shadow-md transition-all group"
            >
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                     <Calendar className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                     <p className="text-xs font-bold text-renta-400 uppercase tracking-tighter">Visitas de Hoy</p>
                     <p className="text-lg font-black text-renta-950">{isLoading ? '...' : (metrics?.visitasHoy || 0)} <span className="text-xs font-medium text-renta-500">agendadas</span></p>
                  </div>
               </div>
               <ChevronRight className="w-5 h-5 text-renta-300 group-hover:text-renta-600 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Cobros Pendientes */}
            <button 
              onClick={() => navigate('/cobranzas')}
              className="flex items-center justify-between p-4 bg-white ring-1 ring-inset ring-admin-border border-transparent rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all group"
            >
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                     <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                     <p className="text-xs font-bold text-renta-400 uppercase tracking-tighter">Cobranzas</p>
                     <p className="text-sm font-bold text-renta-950">Gestionar Pagos</p>
                  </div>
               </div>
               <ChevronRight className="w-5 h-5 text-renta-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Nuevo Contrato */}
            <button 
              onClick={() => navigate('/contratos')}
              className="flex items-center justify-between p-4 bg-renta-950 border border-renta-900 rounded-2xl hover:bg-renta-800 hover:shadow-lg transition-all group"
            >
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-renta-800 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                     <PlusCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                     <p className="text-xs font-bold text-renta-200/50 uppercase tracking-tighter">Operación</p>
                     <p className="text-sm font-bold text-white">Nuevo Contrato</p>
                  </div>
               </div>
               <ChevronRight className="w-5 h-5 text-renta-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
         </div>
      </div>
    </div>
  );
}
