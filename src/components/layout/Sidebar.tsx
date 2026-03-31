import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Gem,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInmobiliaria, type UserRole } from '@/hooks/useInmobiliaria';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, allowedRoles: ['superadmin', 'admin', 'vendedor'] },
  { label: 'Propiedades', href: '/propiedades', icon: Building2, allowedRoles: ['superadmin', 'admin', 'vendedor'] },
  { label: 'Inquilinos', href: '/inquilinos', icon: Users, allowedRoles: ['superadmin', 'admin'] },
  { label: 'Cobranzas', href: '/cobranzas', icon: Wallet, allowedRoles: ['superadmin', 'admin'] },
  { label: 'Configuración', href: '/configuracion', icon: Settings, allowedRoles: ['superadmin'] },
];

/**
 * Sidebar — Navegación principal del Panel Administrativo.
 * Diseño Luxury Minimalist con fondo renta-950 y transiciones suaves.
 */
export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { hasPermission, role } = useInmobiliaria();

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
              MyProp
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
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/90'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-renta-400' : 'text-white/40 group-hover:text-white/70'
                )}
              />
              {!isCollapsed && (
                <span className="animate-fade-in truncate">{item.label}</span>
              )}
              {isActive && !isCollapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-renta-400 shadow-sm shadow-renta-400/50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Version Badge ── */}
      {!isCollapsed && (
        <div className="animate-fade-in border-t border-white/10 px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">
            Búnker v0.1.0
          </p>
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
