import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

/**
 * useApi — Hook para realizar peticiones autenticadas al Búnker (mypropAPI).
 * Inyecta automáticamente el JWT de Clerk y el Master Filter regional.
 */
export function useApi() {
  const { getToken } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = await getToken();
    
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
