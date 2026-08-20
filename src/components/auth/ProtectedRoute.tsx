import { Outlet } from 'react-router-dom';
import { useInmobiliaria, type UserRole } from '@/hooks/useInmobiliaria';
import { AccessDenied } from './AccessDenied';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

/**
 * ProtectedRoute — Middleware de autenticación.
 * En rama MOCK: siempre deja pasar (isSignedIn=true, hasPermission=true).
 */
export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, hasPermission } = useInmobiliaria();

  // Spinner mientras carga
  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-renta-50">
        <Loader2 className="h-8 w-8 text-renta-400 animate-spin" />
      </div>
    );
  }

  // En mock, isSignedIn siempre es true
  if (!isSignedIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-renta-50">
        <p className="text-renta-600 font-inter">Redirigiendo al login...</p>
      </div>
    );
  }

  // Evaluar permisos Roles
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasPermission(allowedRoles)) {
      return <AccessDenied />;
    }
  }

  return <>{children || <Outlet />}</>;
}