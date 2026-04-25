import { useUser } from '@clerk/clerk-react';
import type { CountryCode } from '@/types/region';

export type UserRole = 'superadmin' | 'admin' | 'vendedor';

export interface InmobiliariaMetadata {
  inmobiliaria_id: string;
  nombre: string;
  logo_url: string;
  role: UserRole;
  country_code: CountryCode;
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

  const metadata = (user?.publicMetadata ?? {}) as Partial<InmobiliariaMetadata>;

  const role = metadata.role ?? 'vendedor';

  /**
   * Valida jerarquías de roles contra la UI para componentes que necesitan ocultarse o 
   * mostrarse de manera condicional (Middlewares Frontend).
   * 
   * @param allowedRoles Lista de jerarquías permitidas para visualizar o accionar.
   * @returns boolean
   */
  const hasPermission = (allowedRoles: UserRole[]): boolean => {
    // Para simplificar la validación en caso de que un rol pueda acceder a ciertos recursos específicos
    // o para componentes que requieran permisos de "read|write" de la etapa 2.
    if (!isSignedIn) return false;
    return allowedRoles.includes(role);
  };

  return {
    inmobiliaria_id: metadata.inmobiliaria_id ?? undefined,
    nombre: metadata.nombre ?? 'Mi Inmobiliaria',
    logo_url: metadata.logo_url ?? undefined,
    country_code: metadata.country_code ?? undefined,
    role,
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    hasPermission,
    // Note: User property omitida intencionalmente fuera de "hasPermission" check para evitar Zero Leaks accidentales del tenant
  };
}
