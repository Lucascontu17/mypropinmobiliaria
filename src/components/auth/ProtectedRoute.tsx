import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useInmobiliaria, type UserRole } from '@/hooks/useInmobiliaria';
import { AccessDenied } from './AccessDenied';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

/**
 * ProtectedRoute — Middleware del Frontend para Autenticación "Stateless" y RBAC en Clerk.
 *
 * @param allowedRoles (Opcional) Array de roles autorizados. Si es nulo, permite a cualquier usuario logueado.
 * @param children El contenido a renderizar si el usuario pasa la jerarquía.
 */
export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, hasPermission, inmobiliaria_id, suscripcion } = useInmobiliaria();
  const { getToken } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (isSignedIn) {
      const syncToken = async () => {
        const token = await getToken({ template: 'zonatia-session' });
        if (token) localStorage.setItem('zonatia_token', token);
      };
      syncToken();
    }
  }, [isSignedIn, getToken]);

  // 1. Mostrar Spinner Global o un Luxury Skeleton mientras Clerk hidrata localmente el state
  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-renta-50">
        <Loader2 className="h-8 w-8 text-renta-400 animate-spin" />
      </div>
    );
  }

  // 2. Si no esta firmado, redirigir al login
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // 3. Si esta firmado pero no tiene vinculacion a inmobiliaria,
  //    redirigir a onboarding/configuracion (evita redirect loop)
  if (!inmobiliaria_id) {
    return <Navigate to="/configuracion" replace />;
  }

  // 4. Evaluar suscripción bloqueada
  if (suscripcion?.isBlocked && !location.pathname.includes('/suscripcion')) {
    return <Navigate to="/suscripcion" replace />;
  }

  // 5. Evaluar permisos Roles para Master Filter B2B
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasPermission(allowedRoles)) {
      return <AccessDenied />;
    }
  }

  // Todo validado, renderizar hijos o rutas en Outlet
  return <>{children || <Outlet />}</>;
}
