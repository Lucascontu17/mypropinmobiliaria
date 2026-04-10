/**
 * dialectParser.ts — Parser de archivos de dialectos .md
 *
 * Extrae frontmatter YAML (entre ---) y secciones key:value del cuerpo.
 * Los archivos .md se importan como raw strings vía Vite `?raw` suffix.
 *
 * Formato esperado:
 * ---
 * country_code: AR
 * currency_code: ARS
 * ...
 * ---
 * # Sección (ignorada)
 * key: valor
 * otra_key: otro valor
 */

import type { RegionalConfig, DialectData } from '@/types/region';

/**
 * Parsea el frontmatter YAML simplificado (solo key: value planos).
 * No soporta YAML complejo (arrays, objetos anidados) — solo strings.
 */
function parseFrontmatter(raw: string): { config: Record<string, string>; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = raw.trim().match(frontmatterRegex);

  if (!match) {
    return { config: {}, body: raw };
  }

  const [, frontmatterBlock, body] = match;
  const config: Record<string, string> = {};

  frontmatterBlock.split('\n').forEach((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;

    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // Strip surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key) config[key] = value;
  });

  return { config, body };
}

/**
 * Parsea el cuerpo del markdown extrayendo las líneas `key: valor`.
 * Las líneas que comienzan con `#` son headers de sección y se ignoran.
 * Las líneas vacías se ignoran.
 */
function parseBody(body: string): Record<string, string> {
  const texts: Record<string, string> = {};

  body.split('\n').forEach((line) => {
    const trimmed = line.trim();

    // Skip empty lines and section headers
    if (!trimmed || trimmed.startsWith('#')) return;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) return;

    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();

    if (key) texts[key] = value;
  });

  return texts;
}

/**
 * Parsea un archivo de dialecto completo (.md) y retorna la estructura tipada.
 *
 * @param rawContent — String crudo del archivo .md (importado con `?raw`)
 * @returns DialectData con config regional y textos localizados
 */
export function parseDialect(rawContent: string): DialectData {
  const { config: rawConfig, body } = parseFrontmatter(rawContent);
  const texts = parseBody(body);

  const config: RegionalConfig = {
    country_code: (rawConfig.country_code || 'AR') as RegionalConfig['country_code'],
    currency_code: (rawConfig.currency_code || 'ARS') as RegionalConfig['currency_code'],
    currency_symbol: rawConfig.currency_symbol || '$',
    currency_locale: rawConfig.currency_locale || 'es-AR',
    phone_prefix: rawConfig.phone_prefix || '+54',
    id_label: rawConfig.id_label || 'DNI',
    tax_label: rawConfig.tax_label || 'IVA',
  };

  return { config, texts };
}
