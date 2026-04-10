/**
 * useRegion — Hook consumidor del contexto regional.
 *
 * Provee acceso tipado a:
 * - country_code, currency_code, flag
 * - t(key) — Texto localizado desde el dialecto .md
 * - formatCurrency(amount) — Formato de moneda regional
 * - formatPhone(phone) — Prefijo telefónico regional
 * - config — RegionalConfig completo
 * - setAuditRegion — Toggle del Modo Auditoría (dev only)
 *
 * Uso:
 * ```tsx
 * const { t, formatCurrency, country_code } = useRegion();
 * <h1>{t('panel_titulo')}</h1>
 * <span>{formatCurrency(450000)}</span>
 * ```
 */

import { useContext } from 'react';
import { RegionContext } from '@/providers/RegionProvider';
import type { RegionContextValue } from '@/types/region';

export function useRegion(): RegionContextValue {
  const context = useContext(RegionContext);

  if (!context) {
    throw new Error(
      '[useRegion] Este hook debe usarse dentro de <RegionProvider>. ' +
      'Asegúrate de que App.tsx envuelva la aplicación con <RegionProvider>.'
    );
  }

  return context;
}
