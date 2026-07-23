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
       * formatCurrency(amount, currency?) — Formats a number with explicit currency code.
       * Uses Intl.NumberFormat with currencyDisplay: 'code' to avoid ambiguity between ARS/MXN.
       */
      formatCurrency: (amount: number, currency?: string): string => {
        return new Intl.NumberFormat(config.currency_locale, {
          style: 'currency',
          currency: currency || config.currency_code,
          currencyDisplay: 'narrowSymbol',
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

      /**
       * formatInputNumber(value) — Formats a number with thousands separators for use in text inputs.
       * Soporta tanto números en formato local (input del usuario) como en formato BD (343242.00).
       */
      formatInputNumber: (value: number | string | undefined | null): string => {
        if (value === undefined || value === null || value === '') return '';
        const strValue = value.toString().replace(/[^0-9.,-]/g, '');
        if (!strValue) return '';
        
        if (activeCountry === 'AR') {
          // AR: Separador miles = '.' , separador decimal = ','
          // La BD puede devolver "343242.00" (formato estándar con punto decimal)
          // Detectamos automáticamente el formato:
          
          let numericValue: number;
          
          if (strValue.includes(',')) {
            // ✅ Formato LOCAL: "343.242,50" (punto = miles, coma = decimal)
            numericValue = parseFloat(strValue.replace(/\./g, '').replace(',', '.'));
          } else if (strValue.includes('.')) {
            // Puede ser BD ("343242.00") o formateado ("343.242")
            const dotCount = (strValue.match(/\./g) || []).length;
            if (dotCount > 1) {
              // Múltiples puntos → es formato con separadores de miles
              numericValue = parseFloat(strValue.replace(/\./g, ''));
            } else if (/\.\d{0,2}$/.test(strValue)) {
              // Un solo punto seguido de 0-2 dígitos al final → BD format
              numericValue = parseFloat(strValue);
            } else {
              // Un solo punto con +2 dígitos → separador de miles
              numericValue = parseFloat(strValue.replace(/\./g, ''));
            }
          } else {
            // Número plano sin separadores: "343242"
            numericValue = parseFloat(strValue);
          }
          
          if (isNaN(numericValue)) return '';
          
          return new Intl.NumberFormat(config.currency_locale, {
            useGrouping: true,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(numericValue);
        } else {
          // MX/US: Separador miles = ',' , separador decimal = '.'
          const parts = strValue.split('.');
          const integerPart = parts[0].replace(/[^0-9-]/g, '');
          const decimalPart = parts[1];

          const formattedInteger = new Intl.NumberFormat(config.currency_locale, {
            useGrouping: true,
            minimumFractionDigits: 0,
          }).format(Number(integerPart));

          if (decimalPart !== undefined) {
             return formattedInteger + '.' + decimalPart.slice(0, 2);
          }
          return formattedInteger;
        }
      },


      /**
       * parseInputNumber(value) — Removes thousands separators and normalizes decimal separator.
       */
      parseInputNumber: (value: string): number => {
        if (!value) return 0;
        // AR uses '.' as thousands and ',' as decimal
        // MX/US uses ',' as thousands and '.' as decimal
        let cleanValue = value;
        if (activeCountry === 'AR') {
          cleanValue = value.replace(/\./g, '').replace(',', '.');
        } else {
          cleanValue = value.replace(/,/g, '');
        }
        return parseFloat(cleanValue) || 0;
      }
    };
  }, [activeCountry, dialect, auditOverride]);

  return (
    <RegionContext.Provider value={contextValue}>
      {children}
    </RegionContext.Provider>
  );
}
