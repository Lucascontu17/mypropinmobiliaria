import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  UsersRound,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Gem,
  UserCheck,
  Handshake,
  Store,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInmobiliaria, type UserRole } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { useJoyride } from '@/providers/JoyrideProvider';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  /** Key del dialecto .md para el label */
  dialectKey: string;
  /** Fallback si el dialecto no tiene la key */
  fallbackLabel: string;
  href: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { dialectKey: 'nav_dashboard', fallbackLabel: 'Dashboard', href: '/', icon: LayoutDashboard, allowedRoles: ['superadmin', 'admin', 'vendedor'] },
  { dialectKey: 'nav_propietarios', fallbackLabel: 'Propietarios', href: '/propietarios', icon: UserCheck, allowedRoles: ['superadmin', 'admin', 'vendedor'] },
  { dialectKey: 'nav_propiedades', fallbackLabel: 'Propiedades', href: '/propiedades', icon: Building2, allowedRoles: ['superadmin', 'admin', 'vendedor'] },
  { dialectKey: 'nav_contratos', fallbackLabel: 'Contratos', href: '/contratos', icon: Handshake, allowedRoles: ['superadmin', 'admin', 'vendedor'] },
  { dialectKey: 'nav_inquilinos', fallbackLabel: 'Inquilinos', href: '/inquilinos', icon: Users, allowedRoles: ['superadmin', 'admin'] },
  { dialectKey: 'nav_cobranzas', fallbackLabel: 'Cobranzas', href: '/cobranzas', icon: Wallet, allowedRoles: ['superadmin', 'admin'] },
  { dialectKey: 'nav_marketplace', fallbackLabel: 'Marketplace', href: '/marketplace', icon: Store, allowedRoles: ['superadmin', 'admin'] },
  { dialectKey: 'nav_equipo', fallbackLabel: 'Equipo', href: '/equipo', icon: UsersRound, allowedRoles: ['superadmin', 'admin'] },
  { dialectKey: 'nav_configuracion', fallbackLabel: 'Configuración', href: '/configuracion', icon: Settings, allowedRoles: ['superadmin'] },
];

/**
 * Sidebar — Navegación principal del Panel Administrativo.
 * Diseño Luxury Minimalist con fondo renta-950 y transiciones suaves.
 * Labels localizados via useRegion().t() desde archivos de dialectos .md.
 */
export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useInmobiliaria();
  const { t, flag, country_code, isAuditOverride } = useRegion();
  const { resetTour } = useJoyride();

  // Filter items based on user role
  const visibleNavItems = NAV_ITEMS.filter(item => hasPermission(item.allowedRoles));

  return (
    <aside
      className={cn(
        'admin-sidebar relative flex flex-col transition-all duration-300 ease-out',
        isCollapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* ── Logo Area ── */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-renta-400 to-renta-600 shadow-lg shadow-renta-500/20">
          <Gem className="h-5 w-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="animate-fade-in overflow-hidden">
            <h1 className="text-base font-bold tracking-tight text-white">
              Zonatia
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-renta-400">
              Admin Panel
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          const label = t(item.dialectKey, item.fallbackLabel);
          return (
            <Link
              key={item.href}
              to={item.href}
              data-joyride={`nav-${item.dialectKey.replace('nav_', '')}`}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/90'
              )}
              title={isCollapsed ? label : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-renta-400' : 'text-white/40 group-hover:text-white/70'
                )}
              />
              {!isCollapsed && (
                <span className="animate-fade-in truncate">{label}</span>
              )}
              {isActive && !isCollapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-renta-400 shadow-sm shadow-renta-400/50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Region Badge + Version ── */}
      {!isCollapsed && (
        <div className="animate-fade-in border-t border-white/10 px-4 py-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm" aria-label={`Región: ${country_code}`}>{flag}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              {country_code}
            </span>
            {isAuditOverride && (
              <span className="text-[8px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                AUDIT
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">
              Búnker v2.0.0
            </p>
            <button
              onClick={() => {
                resetTour();
                navigate('/');
              }}
              className="flex items-center gap-2 rounded-lg py-1 px-0 text-[10px] font-bold uppercase tracking-wider text-renta-400 transition-colors hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              {t('reiniciar_tutorial', 'Reiniciar tutorial')}
            </button>
          </div>
        </div>
      )}

      {/* ── Collapse Toggle ── */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-admin-border bg-white text-renta-700 shadow-md transition-all hover:scale-110 hover:shadow-lg"
        aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
}
