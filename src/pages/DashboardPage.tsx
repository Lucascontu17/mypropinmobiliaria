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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { useEden } from '@/services/eden';

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
          // @ts-ignore
          setMetrics(data?.metrics);
        }
      } catch (err) {
        setError(t('error_dashboard_conn', 'Error de conexión con el servidor.'));
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

  return (
    <div className="space-y-8 pb-12">
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="admin-card p-6 animate-pulse bg-white border border-admin-border rounded-2xl">
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

      {/* El contenedor de bienvenida fue eliminado por ser redundante en una inmobiliaria con datos activos */}
    </div>
  );
}
