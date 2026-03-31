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

/**
 * DashboardPage — Vista principal del Panel Administrativo.
 * Muestra KPIs de resumen con diseño Luxury Minimalist y animaciones escalonadas.
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
      className="admin-card group p-6 opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
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

const STATS: Omit<StatCardProps, 'delay'>[] = [
  {
    label: 'Propiedades Activas',
    value: '—',
    change: 'Sin datos',
    trend: 'neutral',
    icon: Building2,
  },
  {
    label: 'Inquilinos Registrados',
    value: '—',
    change: 'Sin datos',
    trend: 'neutral',
    icon: Users,
  },
  {
    label: 'Cobranza del Mes',
    value: '—',
    change: 'Sin datos',
    trend: 'neutral',
    icon: Wallet,
  },
  {
    label: 'Tasa de Ocupación',
    value: '—',
    change: 'Sin datos',
    trend: 'neutral',
    icon: TrendingUp,
  },
];

export function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="opacity-0 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-renta-950 lg:text-3xl">
          Panel de Control
        </h1>
        <p className="mt-1 text-sm text-renta-600">
          Resumen general de tu inmobiliaria.{' '}
          <span className="emphasis-text text-renta-400">
            Conecta con El Búnker para ver datos en tiempo real.
          </span>
        </p>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat, index) => (
          <StatCard key={stat.label} {...stat} delay={100 + index * 80} />
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
          Bienvenido al Panel MyProp
        </h3>
        <p className="mt-2 max-w-md text-sm text-renta-500 leading-relaxed">
          Este es tu centro de comando. Una vez configurada la conexión con{' '}
          <span className="font-semibold text-renta-700">El Búnker</span>, aquí
          verás el resumen completo de propiedades, inquilinos y cobranzas de tu
          inmobiliaria.
        </p>
        <div className="mt-6 flex gap-3">
          <button className="rounded-xl bg-renta-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-renta-950/20 transition-all hover:bg-renta-800 hover:shadow-xl hover:shadow-renta-900/25">
            Configurar Conexión
          </button>
          <button className="rounded-xl border border-admin-border bg-white px-5 py-2.5 text-sm font-semibold text-renta-700 transition-all hover:bg-renta-50 hover:shadow-sm">
            Ver Documentación
          </button>
        </div>
      </div>
    </div>
  );
}
