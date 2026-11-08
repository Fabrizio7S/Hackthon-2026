// Normalización de números y construcción de enlaces de contacto.
// Funciones puras, sin dependencias de React Native, para poder probarlas aparte.

/**
 * Código de país que se usa cuando el número llega sin él.
 * Supuesto técnico (reto en Perú), pendiente de confirmar junto con Q03.
 */
export const DEFAULT_COUNTRY_CODE = '51';

export type PhoneResult =
  | { ok: true; digits: string }
  | { ok: false; reason: 'vacio' | 'invalido' };

const MIN_DIGITS = 8;
const MAX_DIGITS = 15; // Límite de E.164.

/**
 * Devuelve el número en formato internacional, solo con dígitos y sin «+».
 * Acepta espacios, guiones, puntos y paréntesis. Si el número no tiene
 * código de país, se añade el código indicado.
 */
export function normalizePhone(
  raw: string | null | undefined,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): PhoneResult {
  const trimmed = (raw ?? '').trim();
  if (trimmed === '') return { ok: false, reason: 'vacio' };
  if (/[^\d\s()+.-]/.test(trimmed)) return { ok: false, reason: 'invalido' };

  const hasPlus = trimmed.startsWith('+');
  if (trimmed.indexOf('+', 1) !== -1) return { ok: false, reason: 'invalido' };

  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2); // Prefijo internacional «00».
  } else if (!hasPlus) {
    if (digits.startsWith('0')) digits = digits.slice(1); // Prefijo de larga distancia, p. ej. 01 de Lima.
    if (!digits.startsWith(countryCode)) digits = countryCode + digits;
  }

  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) {
    return { ok: false, reason: 'invalido' };
  }
  return { ok: true, digits };
}

/** Enlace para abrir el marcador telefónico con el número cargado. */
export function buildTelUrl(digits: string): string {
  return `tel:+${digits}`;
}

/** Enlace universal de WhatsApp; abre la app o, si no está, el navegador. */
export function buildWhatsAppUrl(digits: string): string {
  return `https://wa.me/${digits}`;
}
