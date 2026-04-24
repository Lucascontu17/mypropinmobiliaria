import { treaty } from '@elysiajs/eden';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useMemo } from 'react';

// Import the App namespace from the central mypropAPI (El Búnker)
// Make sure 'mypropapi' is properly linked in package.json or published as a package.
// @ts-ignore
import type { App } from 'mypropapi';

// The API Central uses /api/v1 prefix.
// During development on localhost:5174, VITE_API_URL should point to http://localhost:3000/api/v1
// In production, it will point to the public centralized domain (e.g. railway URL + /api/v1)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * Eden Client (Constant instance)
 * Uses localStorage for cases where hooks cannot be used or for legacy compatibility.
 */
export const eden = treaty<App>(API_URL, {
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
 * Preferred way to use the Eden client within React components.
 * Automatically handles fresh tokens from Clerk and injects necessary headers.
 */
export function useEden() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const client = useMemo(() => {
    return treaty<App>(API_URL, {
      async headers() {
        const token = await getToken();
        // Extract metadata for headers
        const inmobiliariaId = (user?.publicMetadata?.inmobiliaria_id as string) || '';
        const region = (user?.publicMetadata?.country_code as string) || 
                       localStorage.getItem('zonatia_audit_region') || 
                       'AR';

        return {
          Authorization: `Bearer ${token}`,
          'x-inmobiliaria-id': inmobiliariaId,
          'x-region': region,
        };
      },
    });
  }, [getToken, user]);

  return client;
}
