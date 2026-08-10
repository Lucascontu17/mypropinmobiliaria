// ClerkProvider wrapper - En rama MOCK simplemente wrappea los children
import type { ReactNode } from 'react';

interface ClerkProviderProps {
  children: ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  // En modo MOCK, no usamos Clerk para nada
  return children;
}