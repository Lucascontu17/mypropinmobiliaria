import { treaty } from '@elysiajs/eden';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useMemo, useState, useEffect } from 'react';

// @ts-ignore
import type { App } from 'mypropapi';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.zonatia.com';

// Alerta de seguridad para entorno Staging/Prod con API apuntando a Localhost
if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && API_BASE.includes('localhost')) {
  console.warn(`[SECURITY-EDEN] High risk detected: Frontend is running on "${window.location.hostname}" but VITE_API_URL is pointing to "${API_BASE}". API calls will fail.`);
}

export const BASE_URL = API_BASE.replace(/\/v1$/, '').replace(/\/api$/, '').replace(/\/$/, '');
const FULL_API_URL = `${BASE_URL}/api/v1`;

/**
 * Eden Client (Constant instance)
 * Uses localStorage for cases where hooks cannot be used or for legacy compatibility.
 */
export const api = treaty<App>(FULL_API_URL, {
    async headers() {
        const isDev = import.meta.env.DEV;
        let region = 'AR';
        const token = localStorage.getItem('zonatia_token');

        if (!isDev) {
            region = localStorage.getItem('zonatia_audit_region') || 'AR';
        }

        return {
            'x-region': region,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    },
    fetch: {
        credentials: 'include'
    }
});

/**
 * useEden hook
 * Pre-fetches the Clerk token synchronously and passes it as a plain
 * headers object to bypass Eden 1.2.0's broken async headers support.
 */
export function useEden() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [token, setToken] = useState<string | null>(null);

  // Pre-fetch the token as soon as Clerk is ready
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      getToken({ template: 'zonatia-session' }).then(t => {
        if (t) {
          console.log('[EDEN] Token cached and saved to localStorage');
          localStorage.setItem('zonatia_token', t);
          setToken(t);
        }
      });
    }
  }, [getToken, isLoaded, isSignedIn]);

  // Recreate the Eden client whenever the token or specific metadata changes
  const region = (user?.publicMetadata?.country_code as string) || 
                 localStorage.getItem('zonatia_audit_region') || 'AR';
  const inmobiliariaId = (user?.publicMetadata?.inmobiliaria_id as string) || '';

  const client = useMemo(() => {
    return treaty<App>(FULL_API_URL, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'x-inmobiliaria-id': inmobiliariaId,
        'x-region': region,
      },
      fetch: {
        credentials: 'include'
      }
    });
  }, [token, region, inmobiliariaId]);

  return {
    client,
    isReady: isLoaded && !!token,
    token
  };
}
