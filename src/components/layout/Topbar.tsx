import { useMemo } from 'react';
import { Bell, Search, LogOut } from 'lucide-react';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';
import { useClerk } from '@clerk/clerk-react';
import { cn } from '@/lib/utils';
import { BASE_URL } from '@/services/eden';

interface TopbarProps {
  isSidebarCollapsed: boolean;
}

/**
 * Topbar — Header del Panel Administrativo.
 * Muestra el nombre del tenant (inmobiliaria), región activa, búsqueda global y acciones rápidas.
 * Textos localizados via useRegion().t() desde archivos de dialectos .md.
 */
export function Topbar({ isSidebarCollapsed: _isSidebarCollapsed }: TopbarProps) {
  const { nombre, logo_url, role, isSignedIn } = useInmobiliaria();
  const { t, flag, country_code, isAuditOverride } = useRegion();
  const { signOut } = useClerk();

  // Resolver URL del logo
  const resolvedLogoUrl = useMemo(() => {
    if (!logo_url) return null;
    if (logo_url.startsWith('http')) return logo_url;
    
    const cleanPath = logo_url.startsWith('/') ? logo_url : `/${logo_url}`;
    const publicPath = cleanPath.startsWith('/public') ? cleanPath : `/public${cleanPath}`;
    return `${BASE_URL}${publicPath}`;
  }, [logo_url]);

  return (
    <header className="admin-topbar flex h-16 shrink-0 items-center justify-between px-6">
      {/* ── Left: Search ── */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-renta-400" />
          <input
            type="text"
            data-shepherd="search-bar"
            placeholder={t('buscar_placeholder', 'Buscar propiedades, inquilinos...')}
            className={cn(
              'h-9 w-72 rounded-xl border border-admin-border bg-renta-50/50 pl-10 pr-4',
              'text-sm text-renta-900 placeholder:text-renta-400',
              'transition-all duration-200',
              'focus:border-renta-300 focus:outline-none focus:ring-2 focus:ring-renta-200/50'
            )}
          />
        </div>
      </div>

      {/* ── Right: Region + Actions + User ── */}
      <div className="flex items-center gap-4">
        {/* Region Badge */}
        <div 
          data-shepherd="region-indicator"
          className={cn(
          "hidden sm:flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all",
          isAuditOverride
            ? "border-amber-300 bg-amber-50 text-amber-700"
            : "border-admin-border bg-white text-renta-600"
        )}>
          <span className="text-sm">{flag}</span>
          <span>{country_code}</span>
          {isAuditOverride && (
            <span className="text-[8px] uppercase tracking-wider text-amber-500">AUDIT</span>
          )}
        </div>

        {/* Notifications */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-admin-border bg-white text-renta-600 transition-all hover:bg-renta-50 hover:shadow-sm"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-renta-500" />
        </button>

        {/* Tenant Badge */}
        <div 
          data-shepherd="user-profile"
          className="flex items-center gap-3 rounded-xl border border-admin-border bg-white px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white overflow-hidden border border-renta-100 text-xs font-bold text-renta-600">
            {resolvedLogoUrl ? (
              <img src={resolvedLogoUrl} alt={nombre} className="h-full w-full object-contain" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-renta-500 to-renta-700 text-white">
                {nombre.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-renta-900 leading-tight">
              {isSignedIn ? nombre : 'Demo Mode'}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-renta-500">
              {role}
            </p>
          </div>
        </div>

        {/* Logout Action */}
        <button
          onClick={() => signOut({ redirectUrl: window.location.origin })}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition-all hover:bg-red-100 hover:shadow-sm"
          title={t('cerrar_sesion', 'Cerrar Sesión')}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
