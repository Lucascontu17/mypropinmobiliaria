import { treaty } from '@elysiajs/eden';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useMemo, useState, useEffect } from 'react';

// @ts-ignore
import type { App } from 'mypropapi';

const FULL_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
export const BASE_URL = FULL_API_URL.replace(/\/api\/v1\/?$/, "").replace(/\/v1\/?$/, "").replace(/\/$/, "");

/**
 * Eden Client (Constant instance)
 * Uses localStorage for cases where hooks cannot be used or for legacy compatibility.
 */
export const eden = treaty<App>(FULL_API_URL, {
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
        console.log('[EDEN] Token cached with zonatia-session template:', t ? 'YES' : 'NO');
        setToken(t);
      });
    }
  }, [getToken, isLoaded, isSignedIn]);

  // Recreate the Eden client whenever the token or user changes
  const client = useMemo(() => {
    const region = (user?.publicMetadata?.country_code as string) || 
                   localStorage.getItem('zonatia_audit_region') || 'AR';
    const inmobiliariaId = (user?.publicMetadata?.inmobiliaria_id as string) || '';

    // PLAIN OBJECT headers — no async, no function, guaranteed to be injected
    const realClient = treaty<App>(FULL_API_URL, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'x-inmobiliaria-id': inmobiliariaId,
        'x-region': region,
      }
    });

    // MOCK INTERCEPTION FOR DEV BRANCH
    // We wrap the client in a Proxy to catch calls to .admin.<route>.get()
    return new Proxy(realClient, {
        get(target, prop) {
            const val = target[prop as keyof typeof target];
            if (prop === 'admin') {
                return new Proxy(val, {
                    get(adminTarget, adminProp) {
                        const route = adminTarget[adminProp as keyof typeof adminTarget];
                        return new Proxy(route, {
                            get(routeTarget, routeProp) {
                                if (routeProp === 'get') {
                                    return async (...args: any[]) => {
                                        // IMPORT MOCK_DATA dynamically to avoid circular dependencies if any
                                        const { MOCK_DATA } = await import('./mockData');
                                        const mockKey = adminProp as keyof typeof MOCK_DATA;
                                        
                                        if (MOCK_DATA[mockKey]) {
                                            console.log(`[MOCK] Returning mock data for admin.${adminProp}`);
                                            return { data: MOCK_DATA[mockKey], error: null };
                                        }
                                        
                                        return (routeTarget as any).get(...args);
                                    };
                                }
                                return routeTarget[routeProp as keyof typeof routeTarget];
                            }
                        });
                    }
                });
            }
            return val;
        }
    });
  }, [token, user]);

  return {
    client,
    isReady: isLoaded && !!token,
    token
  };
}
