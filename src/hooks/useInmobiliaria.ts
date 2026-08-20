import { useUser, useAuth } from '@clerk/clerk-react';
import type { CountryCode } from '@/types/region';
import useSWR from 'swr';
import { BASE_URL } from '@/services/eden';

export type UserRole = 'superadmin' | 'admin' | 'vendedor';

export interface InmobiliariaMetadata {
  inmobiliaria_id: string;
  nombre: string;
  logo_url: string;
  role: UserRole;
  country_code: CountryCode;
  requires_logo_upload?: boolean;
  suscripcion?: {
    status: 'activa' | 'gracia' | 'vencida';
    isBlocked: boolean;
    is_vip?: boolean;
    fecha_vencimiento: string;
    proximo_pago: string;
  };
}

/**
 * useInmobiliaria — Hook que extrae el Master Filter y los Roles de Clerk metadata.
 * 
 * Este hook es la pieza central de la arquitectura "Zero Leaks"
 * aislando los datos tenant. Su metadata NUNCA debe loggearse globalmente.
 * 
 * @returns { inmobiliaria_id, nombre, role, isLoaded, isSignedIn, hasPermission }
 */
export function useInmobiliaria() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { isLoaded: isAuthLoaded, getToken } = useAuth();
  const isReady = isAuthLoaded && !!user;

  const metadata = (user?.publicMetadata ?? {}) as Partial<InmobiliariaMetadata>;

  // Fetch real-time data from DB as fallback/sync for branding (Zero Leaks compliant)
  // NOTA: Usamos fetch nativo porque Eden Treaty 1.x no maneja correctamente
  // la autenticación con Clerk JWT en algunos casos y devuelve 403.
  const { data: dbData, isValidating: isDbLoading } = useSWR(
    isSignedIn && isReady ? '/admin/me' : null,
    async () => {
      try {
        const token = await getToken({ template: 'zonatia-session' });
        const region = localStorage.getItem('zonatia_audit_region') || 'AR';
        const response = await fetch(`${BASE_URL}/api/v1/admin/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-region': region,
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        return json?.data;
      } catch (err) {
        console.warn('[useInmobiliaria] DB branding fetch failed, using metadata.', err);
        return null;
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const role = metadata.role ?? 'vendedor';
  const nombre = dbData?.nombre ?? metadata.nombre ?? 'Mi Inmobiliaria';
  const logo_url = dbData?.logo_url ?? metadata.logo_url ?? undefined;
  const requires_logo_upload = dbData?.requires_logo_upload ?? metadata.requires_logo_upload ?? false;

  /**
   * Valida jerarquías de roles contra la UI para componentes que necesitan ocultarse o 
   * mostrarse de manera condicional (Middlewares Frontend).
   * 
   * @param allowedRoles Lista de jerarquías permitidas para visualizar o accionar.
   * @returns boolean
   */
  const hasPermission = (allowedRoles: UserRole[]): boolean => {
    if (!isSignedIn) return false;
    return allowedRoles.includes(role);
  };

  return {
    inmobiliaria_id: metadata.inmobiliaria_id ?? undefined,
    nombre,
    logo_url,
    requires_logo_upload,
    country_code: metadata.country_code ?? undefined,
    role,
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    isDbLoading,
    hasPermission,
    suscripcion: dbData?.suscripcion
  };
}
