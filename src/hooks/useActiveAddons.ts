import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { useAuth } from '@clerk/clerk-react';

/**
 * useActiveAddons — Fetches and caches the list of active add-on names
 * for the current agency. Called once globally and cached for the session.
 */

export interface Addon {
  id: string;
  nombre: string;
  descripcion: string;
  costo_mensual: number;
  is_acquired: boolean;
  icon_tag?: string;
}

let globalCache: Addon[] | null = null;

export function useActiveAddons() {
  const [addons, setAddons] = useState<Addon[]>(globalCache || []);
  const [loading, setLoading] = useState<boolean>(globalCache === null);
  const { apiFetch } = useApi();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;
    if (globalCache !== null) {
      setAddons(globalCache);
      setLoading(false);
      return;
    }

    let cancelled = false;

    apiFetch('/marketplace/my-addons')
      .then((res: any) => {
        if (cancelled) return;
        const list: Addon[] = res?.addons || [];
        globalCache = list;
        setAddons(list);
      })
      .catch((err: any) => {
        console.error('[useActiveAddons] Failed to fetch:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [isSignedIn, apiFetch]);

  const hasAddon = useCallback(
    (name: string) => addons.some(a => a.nombre === name && a.is_acquired),
    [addons]
  );

  const getAddonPrice = useCallback(
    (name: string) => addons.find(a => a.nombre === name)?.costo_mensual || 0,
    [addons]
  );

  return { addons, loading, hasAddon, getAddonPrice };
}
