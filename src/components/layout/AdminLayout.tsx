import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useInmobiliaria } from '@/hooks/useInmobiliaria';
import { useRegion } from '@/hooks/useRegion';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

/**
 * AdminLayout — Layout principal del Panel Administrativo.
 * Estructura: Sidebar colapsable (izquierda) + Topbar (arriba) + Content area.
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { country_code, suscripcion } = useInmobiliaria();
  const { setAuditRegion } = useRegion();

  // Sincronización inmutable de región post-login
  useEffect(() => {
    if (country_code) {
      localStorage.setItem('zonatia_audit_region', country_code);
      setAuditRegion(country_code);
    }
  }, [country_code, setAuditRegion]);

  const renderGraceBanner = () => {
    if (suscripcion?.status !== 'gracia') return null;
    
    const graceEnd = new Date(suscripcion.fecha_vencimiento);
    graceEnd.setDate(graceEnd.getDate() + 7); // Asumiendo 7 días de gracia según backend
    const daysLeft = Math.ceil((graceEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return (
      <div className="bg-red-500 text-white px-4 py-2 text-center text-sm font-medium z-50">
        ⚠️ Tu suscripción está en periodo de gracia. Se bloqueará el acceso en {daysLeft} {daysLeft === 1 ? 'día' : 'días'}. 
        <a href="/suscripcion" className="underline ml-2 hover:text-red-100">Renovar ahora</a>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-renta-50 flex-col">
      {renderGraceBanner()}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <Topbar isSidebarCollapsed={isSidebarCollapsed} />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="mx-auto max-w-7xl animate-fade-in">
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
