/**
 * RegionProvider.tsx — Proveedor de contexto regional multi-país.
 *
 * Responsabilidades:
 * 1. Detecta la región vía estado interno y localStorage (post-TLD migration)
 * 2. En dev, fuerza la región a VITE_FORCE_REGION (default: AR)
 * 3. Carga el archivo de dialecto .md correspondiente
 * 4. Expone `t()`, `formatCurrency()`, `formatPhone()` y el config regional
 * 5. Soporta "Audit Mode": un superadmin en dev puede conmutar la región en memoria
 *
 * REGLA DE ORO: La región NUNCA afecta el filtro de datos (inmobiliaria_id).
 * Solo afecta presentación, credenciales de servicio y localización de textos.
 */

import { createContext, useState, useMemo, type ReactNode } from 'react';
import { parseDialect } from '@/lib/dialectParser';
import type {
  CountryCode,
  RegionContextValue,
  DialectData,
} from '@/types/region';
import {
  COUNTRY_CURRENCY_MAP,
  COUNTRY_FLAG,
} from '@/types/region';

// ── Import dialect files as raw strings ──
import arDialectRaw from '@/locales/ar.md?raw';
import mxDialectRaw from '@/locales/mx.md?raw';
import usDialectRaw from '@/locales/us.md?raw';

// ── Pre-parse all dialects at module load ──
const DIALECTS: Record<CountryCode, DialectData> = {
  AR: parseDialect(arDialectRaw),
  MX: parseDialect(mxDialectRaw),
  US: parseDialect(usDialectRaw),
};

// ── TLD Detection ──
function detectCountryFromTLD(): CountryCode {
  // En este panel forzamos AR por defecto
  return 'AR';
}

// ── Context ──
export const RegionContext = createContext<RegionContextValue | null>(null);

interface RegionProviderProps {
  children: ReactNode;
}

export function RegionProvider({ children }: RegionProviderProps) {
  const detectedRegion = useMemo(() => detectCountryFromTLD(), []);

  // Audit Mode: allows superadmin to override region in-memory (dev only)
  const [auditOverride, setAuditOverride] = useState<CountryCode | null>(null);

  const activeCountry: CountryCode = auditOverride ?? detectedRegion;
  const dialect = DIALECTS[activeCountry];

  const contextValue = useMemo<RegionContextValue>(() => {
    const { config, texts } = dialect;

    return {
      country_code: activeCountry,
      currency_code: COUNTRY_CURRENCY_MAP[activeCountry],
      config,
      flag: COUNTRY_FLAG[activeCountry],
      isAuditOverride: auditOverride !== null,

      /**
       * t(key, fallback?) — Translation function.
       * Returns localized text from the dialect, or the fallback, or the key itself.
       */
      t: (key: string, fallback?: string): string => {
        return texts[key] ?? fallback ?? key;
      },

      /**
       * formatCurrency(amount) — Formats a number in the regional currency.
       * Uses Intl.NumberFormat for proper locale-aware formatting.
       */
      formatCurrency: (amount: number): string => {
        return new Intl.NumberFormat(config.currency_locale, {
          style: 'currency',
          currency: config.currency_code,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
      },

      /**
       * formatPhone(phone) — Prepends regional prefix if needed.
       */
      formatPhone: (phone: string): string => {
        if (phone.startsWith('+')) return phone;
        return `${config.phone_prefix}${phone}`;
      },

      /**
       * setAuditRegion — Audit Mode toggle (dev only).
       * Pass null to reset to TLD-detected region.
       */
      setAuditRegion: (code: CountryCode | null) => {
        setAuditOverride(code);
      },
    };
  }, [activeCountry, dialect, auditOverride]);

  return (
    <RegionContext.Provider value={contextValue}>
      {children}
    </RegionContext.Provider>
  );
}
