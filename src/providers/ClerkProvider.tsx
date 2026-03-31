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
 * - role: 'superadmin' | 'admin' | 'vendedor' — Jerarquías RBAC.
 */
export function ClerkProvider({ children }: ClerkProviderProps) {
  return (
    <ClerkReactProvider 
      publishableKey={PUBLISHABLE_KEY || ''}
      signInUrl="/login"
      signUpUrl="/registro"
      afterSignOutUrl="/login"
      appearance={{
        layout: {
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "auto",
        },
        variables: {
          colorPrimary: "#34706f", // renta-600
          colorBackground: "#ffffff",
          colorText: "#213d3d", // renta-900
          colorPrimaryForeground: "#ffffff",
          colorInputBackground: "#f5f8f8", // renta-50
          colorInputText: "#213d3d", // renta-900
          colorSuccess: "#34706f", // renta-600
          colorDanger: "#ef4444",
          borderRadius: "0.75rem", // rounded-xl
          fontFamily: "'Inter', sans-serif"
        },
        elements: {
          card: "shadow-2xl border border-[#e2e8f0]",
          headerTitle: "font-jakarta font-bold tracking-tight text-[#102324]", // renta-950
          headerSubtitle: "text-[#34706f]", // renta-600
          formButtonPrimary: "transition-all duration-200 hover:bg-[#254949] shadow-md", // hover:renta-800
          footerActionLink: "text-[#5ea8a6] hover:text-[#34706f] font-medium" // renta-400 -> renta-600
        }
      }}
    >
      {children}
    </ClerkReactProvider>
  );
}
