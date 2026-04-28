/**
 * region.ts — Tipos del sistema multi-región.
 * 
 * Define las interfaces para el contexto regional, dialectos .md
 * y configuración de servicios (Mercado Pago, Google Maps, Twilio).
 * 
 * REGLA DE ORO: country_code SOLO afecta UI/presentación y credenciales de servicio.
 * El filtro raíz de datos sigue siendo inmobiliaria_id (Zero Leaks).
 */

// ── Country & Currency Codes ──
export type CountryCode = 'AR' | 'MX' | 'US';
export type CurrencyCode = 'ARS' | 'MXN' | 'USD';

// ── Mapeo Country → Currency ──
export const COUNTRY_CURRENCY_MAP: Record<CountryCode, CurrencyCode> = {
  AR: 'ARS',
  MX: 'MXN',
  US: 'USD',
};

// ── Mapeo Country → Locale para Intl ──
export const COUNTRY_LOCALE_MAP: Record<CountryCode, string> = {
  AR: 'es-AR',
  MX: 'es-MX',
  US: 'en-US',
};

// ── Mapeo Country → Phone Prefix ──
export const COUNTRY_PHONE_PREFIX: Record<CountryCode, string> = {
  AR: '+54',
  MX: '+52',
  US: '+1',
};

// ── Mapeo Country → Emoji Flag ──
export const COUNTRY_FLAG: Record<CountryCode, string> = {
  AR: '🇦🇷',
  MX: '🇲🇽',
  US: '🇺🇸',
};

// ── Mapeo Country → Currency Symbol ──
export const COUNTRY_CURRENCY_SYMBOL: Record<CountryCode, string> = {
  AR: '$',
  MX: '$',
  US: 'US$',
};

// ── Config Regional (frontmatter del .md + API credentials) ──
export interface RegionalConfig {
  country_code: CountryCode;
  currency_code: CurrencyCode;
  currency_symbol: string;
  currency_locale: string;
  phone_prefix: string;
  id_label: string;
  tax_label: string;
}

// ── Datos del dialecto parseado ──
export interface DialectData {
  config: RegionalConfig;
  texts: Record<string, string>;
}

// ── Contexto Regional expuesto por el Provider ──
export interface RegionContextValue {
  country_code: CountryCode;
  currency_code: CurrencyCode;
  config: RegionalConfig;
  /** Función de traducción: retorna el texto localizado para la key dada */
  t: (key: string, fallback?: string) => string;
  /** Formatea un número como moneda regional */
  formatCurrency: (amount: number, currency?: string) => string;
  /** Retorna el prefijo telefónico regional */
  formatPhone: (phone: string) => string;
  /** Flag emoji del país activo */
  flag: string;
  /** Indica si la región fue forzada por audit mode (no por TLD real) */
  isAuditOverride: boolean;
  /** Permite al Audit Mode sobreescribir la región en memoria */
  setAuditRegion: (code: CountryCode | null) => void;
}

// ── Marketplace Booster Plan (respuesta del API v1.7.0) ──
export interface BoosterPlanAPI {
  id: string;
  nombre: string;
  puntos: number;
  descripcion: string;
  precio: number;
  currency_code: CurrencyCode;
  popular?: boolean;
}
