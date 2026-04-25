import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { useAuth } from '@clerk/clerk-react';

/**
 * useActiveAddons — Fetches and caches the list of active add-on names
 * for the current agency. Called once globally and cached for the session.
 */

let globalCache: string[] | null = null;

export function useActiveAddons() {
  const [addons, setAddons] = useState<string[]>(globalCache || []);
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
        const active: string[] = res?.active_addons || [];
        globalCache = active;
        setAddons(active);
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
    (name: string) => addons.includes(name),
    [addons]
  );

  return { addons, loading, hasAddon };
}
