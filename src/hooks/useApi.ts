import { useAuth, useUser } from '@clerk/clerk-react';
import { useCallback, useMemo } from 'react';

/**
 * useApi — Hook para realizar peticiones autenticadas al Búnker (mypropAPI).
 * Inyecta automáticamente el JWT de Clerk y el Master Filter regional.
 */
export function useApi() {
  const { getToken } = useAuth();
  const { user } = useUser();
  
  const API_URL = useMemo(() => {
    const raw = import.meta.env.VITE_API_URL || 'https://api.zonatia.com/api/v1';
    
    // Alerta de seguridad para entorno Staging/Prod con API apuntando a Localhost
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && raw.includes('localhost')) {
      console.warn(`[SECURITY] High risk detected: Frontend is running on "${window.location.hostname}" but API_URL is pointing to "${raw}". Connectivity will fail.`);
    }

    // Si ya termina en /v1 se usa tal cual.
    // Si no, se normaliza: se elimina cualquier /api o /v1 final, luego se concatena /api/v1.
    // Esto evita URL duplicadas como /api/api/v1 cuando raw ya contiene /api.
    return raw.endsWith('/v1')
      ? raw
      : `${raw.replace(/\/api\/?$/, '').replace(/\/$/, '')}/api/v1`;
  }, []);

  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = await getToken({ template: 'zonatia-session' });
    
    // Obtener región desde localStorage (audit mode) o fallback AR
    const region = localStorage.getItem('zonatia_audit_region') || 'AR';

    const inmobiliariaId = (user?.publicMetadata?.inmobiliaria_id as string) || '';
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'x-region': region,
      'x-inmobiliaria-id': inmobiliariaId,
      ...options.headers as Record<string, string>,
    };

    // Only set Content-Type for non-FormData bodies
    // FormData needs the browser to auto-set Content-Type with the multipart boundary
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'API Request Failed');
    }

    return response.json();
  }, [getToken, API_URL]);

  return { apiFetch };
}
