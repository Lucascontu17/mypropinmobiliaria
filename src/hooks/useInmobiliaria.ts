// useInmobiliaria — Rama MOCK: devuelve datos estáticos sin depender de Clerk
import type { CountryCode } from '@/types/region';

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

const MOCK_INMOBILIARIA = {
  inmobiliaria_id: 'imm_001',
  nombre: 'Propiedades del Plata',
  logo_url: '',
  role: 'superadmin' as UserRole,
  country_code: 'AR' as CountryCode,
  requires_logo_upload: false,
  suscripcion: {
    status: 'activa' as const,
    isBlocked: false,
    is_vip: false,
    fecha_vencimiento: '2026-06-15',
    proximo_pago: '2026-05-15',
  },
};

export function useInmobiliaria() {
  return {
    inmobiliaria_id: MOCK_INMOBILIARIA.inmobiliaria_id,
    nombre: MOCK_INMOBILIARIA.nombre,
    logo_url: MOCK_INMOBILIARIA.logo_url,
    requires_logo_upload: MOCK_INMOBILIARIA.requires_logo_upload,
    country_code: MOCK_INMOBILIARIA.country_code,
    role: MOCK_INMOBILIARIA.role,
    isLoaded: true,
    isSignedIn: true,
    isDbLoading: false,
    hasPermission: (_allowedRoles: UserRole[]) => true,
    suscripcion: MOCK_INMOBILIARIA.suscripcion,
  };
}