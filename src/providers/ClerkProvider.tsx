import { ClerkProvider as ClerkReactProvider } from '@clerk/clerk-react';
import type { ReactNode } from 'react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn(
    '[MyProp Auth] VITE_CLERK_PUBLISHABLE_KEY no está configurada. ' +
    'La autenticación no funcionará correctamente.'
  );
}

interface ClerkProviderProps {
  children: ReactNode;
}

/**
 * ClerkProvider — Wrapper de autenticación para el Panel Administrativo.
 * 
 * Cada usuario autenticado tiene en su publicMetadata:
 * - inmobiliaria_id: string — El Master Filter para aislar datos por tenant.
 * - role: 'admin' | 'agent' | 'viewer' — Rol dentro de la inmobiliaria.
 */
export function ClerkProvider({ children }: ClerkProviderProps) {
  return (
    <ClerkReactProvider publishableKey={PUBLISHABLE_KEY || ''}>
      {children}
    </ClerkReactProvider>
  );
}
