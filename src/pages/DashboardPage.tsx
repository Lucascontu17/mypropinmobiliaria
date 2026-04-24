import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { LocalShepherd, type ShepherdStep } from '@/components/shepherd/LocalShepherd';
import { useEden } from '@/services/eden';

/**
 * DashboardPage — Vista principal del Panel Administrativo.
 * Muestra KPIs de resumen con diseño Luxury Minimalist y animaciones escalonadas.
 * Todos los textos localizados via useRegion().t() desde archivos de dialectos .md.
 */

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  delay: number;
}

function StatCard({ label, value, change, trend, icon: Icon, delay }: StatCardProps) {
  return (
    <div
      className="admin-card-interactive group p-6 opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-renta-100 to-renta-200/50 transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-5 w-5 text-renta-700" />
        </div>
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
      </div>
      <div className="mt-4">
        <p className="admin-stat-value">{value}</p>
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

const STAT_DEFS: StatDef[] = [
  {
    dialectKey: 'kpi_propiedades',
    fallbackLabel: 'Propiedades Activas',
    value: '—',
    change: 'Sin datos',
    trend: 'neutral',
    icon: Building2,
    requiresAdmin: false,
  },
  {
    dialectKey: 'kpi_inquilinos',
    fallbackLabel: 'Inquilinos Registrados',
    value: '—',
    change: 'Sin datos',
    trend: 'neutral',
    icon: Users,
    requiresAdmin: false,
  },
  {
    dialectKey: 'kpi_cobranza',
    fallbackLabel: 'Cobranza del Mes',
    value: '—',
    change: 'Sin datos',
    trend: 'neutral',
    icon: Wallet,
    requiresAdmin: true,
  },
  {
    dialectKey: 'kpi_ocupacion',
    fallbackLabel: 'Tasa de Ocupación',
    value: '—',
    change: 'Sin datos',
    trend: 'neutral',
    icon: TrendingUp,
    requiresAdmin: true,
  },
];

export function DashboardPage() {
  const { role, hasPermission } = useInmobiliaria();
  const { t, formatCurrency } = useRegion();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const eden = useEden();

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      // Modo Demo: Mocks estáticos para presentación
      setTimeout(() => {
        setMetrics({
          totalPropiedades: 42,
          totalInquilinos: 38,
          cobranzaMes: 1250000,
          tasaOcupacion: 92
        });
        setIsLoading(false);
      }, 1000);
    };
    fetchMetrics();
  }, []);

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
      dialectKey: 'kpi_inquilinos',
      fallbackLabel: 'Inquilinos Registrados',
      value: isLoading ? '...' : (metrics?.totalInquilinos?.toString() || '0'),
      change: '+0%',
      trend: 'neutral',
      icon: Users,
      requiresAdmin: false,
    },
    {
      dialectKey: 'kpi_cobranza',
      fallbackLabel: 'Cobranza del Mes',
      value: isLoading ? '...' : (formatCurrency(metrics?.cobranzaMes || 0)),
      change: '+0%',
      trend: 'neutral',
      icon: Wallet,
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
  ];

  // Vendedores no ven finanzas / cobranza
  const visibleStats = getStats().filter(stat => {
    if (stat.requiresAdmin && !hasPermission(['superadmin', 'admin'])) return false;
    return true;
  });

  const shepherdSteps: ShepherdStep[] = [
    {
      target: '[data-shepherd="kpi-grid"]',
      title: t('tour_sa_kpi_title', 'Centro de Control'),
      content: t('tour_sa_kpi_desc', 'Métricas globales en tiempo real. Observe el estado general de su plataforma inmobiliaria.'),
      placement: 'bottom',
    },
    {
       target: '[data-shepherd="user-profile"]',
       title: t('tour_sa_roles_title', 'Su Identidad'),
       content: t('tour_sa_roles_desc', 'Desde aquí puede administrar su cuenta, configurar su perfil y cerrar sesión.'),
       placement: 'bottom',
     }
  ];

  return (
    <div className="space-y-8">
      <LocalShepherd steps={shepherdSteps} storageKey={`enjoy_local_dashboard_${role}`} />
      {/* ── Page Header ── */}
      <div className="opacity-0 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-renta-950 lg:text-3xl">
          {t('panel_titulo', 'Panel de Control')}
        </h1>
        <p className="mt-1 text-sm text-renta-600">
          {t('panel_subtitulo', 'Resumen general de tu inmobiliaria.')}{' '}
          <span className="emphasis-text text-renta-400">
             {t('rol_label', 'Logueado como')} {role.toUpperCase()}
          </span>
        </p>
      </div>

      {/* ── Stats Grid ── */}
      <div 
        data-shepherd="kpi-grid"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {visibleStats.map((stat, index) => (
          <StatCard
            key={stat.dialectKey}
            label={t(stat.dialectKey, stat.fallbackLabel)}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            icon={stat.icon}
            delay={100 + index * 80}
          />
        ))}
      </div>

      {/* ── Quick Actions / Empty State ── */}
      <div
        className="admin-card flex flex-col items-center justify-center p-12 text-center opacity-0 animate-fade-in-up"
        style={{ animationDelay: '500ms' }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-renta-100 to-renta-200/50">
          <Activity className="h-8 w-8 text-renta-600" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-renta-900">
          {t('bienvenida_titulo', 'Bienvenido al Panel MyProp')}
        </h3>
        <p className="mt-2 max-w-md text-sm text-renta-500 leading-relaxed">
          {t('bienvenida_descripcion', 'Este es tu centro de comando. Una vez configurada la conexión con El Búnker, aquí verás el resumen completo de propiedades, inquilinos y cobranzas de tu inmobiliaria.')}
        </p>
        <div className="mt-6 flex gap-3">
          {hasPermission(['superadmin', 'admin']) && (
            <button className="rounded-xl bg-renta-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-renta-950/20 transition-all hover:bg-renta-800 hover:shadow-xl hover:shadow-renta-900/25">
              {t('boton_configurar', 'Configurar Conexión')}
            </button>
          )}
          <button className="rounded-xl border border-admin-border bg-white px-5 py-2.5 text-sm font-semibold text-renta-700 transition-all hover:bg-renta-50 hover:shadow-sm">
            {t('boton_documentacion', 'Ver Documentación')}
          </button>
        </div>
      </div>
    </div>
  );
}
