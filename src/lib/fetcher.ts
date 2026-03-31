import { eden } from '@/services/eden';

/**
 * Función fetcher principal para SWR.
 * Utiliza Eden Treaty para mantener el Tipado Completo de extremo a extremo (TypeSafe).
 * 
 * En el frontend se llamará de esta forma:
 * const { data, error } = useSWR(['/owner', inmobiliaria_id], fetcher);
 */
export const edenFetcher = async (url: string, params: Record<string, string> = {}) => {
  // @ts-ignore - Eden dynamic path resolving
  const response = await eden[url.replace(/^\//, '')].get({
    query: {
      ...params
    }
  });

  if (response.error) {
    throw new Error(response.error.value?.message || 'Error al obtener datos del Búnker');
  }

  return response.data;
};
