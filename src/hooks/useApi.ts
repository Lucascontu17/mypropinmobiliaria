import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

/**
 * useApi — Hook para realizar peticiones autenticadas al Búnker (mypropAPI).
 * Inyecta automáticamente el JWT de Clerk y el Master Filter regional.
 */
export function useApi() {
  const { getToken } = useAuth();
  const RAW_API_URL = import.meta.env.VITE_API_URL || 'https://api.zonatia.com/api/v1';
  const API_URL = RAW_API_URL.endsWith('/v1') ? RAW_API_URL : `${RAW_API_URL.replace(/\/$/, '')}/api/v1`;

  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = await getToken({ template: 'zonatia-session' });
    
    // Obtener región desde localStorage (audit mode) o fallback AR
    const region = localStorage.getItem('zonatia_audit_region') || 'AR';

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-region': region,
      ...options.headers,
    };

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
