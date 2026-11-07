// Validación de una oferta antes de enviarla. Repite en la app las reglas de la
// base de datos para mostrar errores claros; la base de datos sigue validando.

import { normalizePhone } from '../contact/phone';
import { isValidCoordinates, type Coordinates } from '../distance/distance';
import type { OfferKind } from './offerTypes';

export const TITLE_MIN = 3;
export const TITLE_MAX = 80;
export const DESCRIPTION_MAX = 500;

/** Lo que escribe el vecino en el formulario. */
export type OfferForm = {
  kind: OfferKind | null;
  title: string;
  description: string;
  contactPhone: string;
  location: Coordinates | null;
};

/** Datos listos para guardar. */
export type OfferValues = {
  kind: OfferKind;
  title: string;
  description: string | null;
  contactPhone: string;
  location: Coordinates | null;
};

export type OfferField = keyof OfferForm;
export type OfferErrors = Partial<Record<OfferField, string>>;

export type OfferValidation = { ok: true; values: OfferValues } | { ok: false; errors: OfferErrors };

export function validateOffer(form: OfferForm): OfferValidation {
  const errors: OfferErrors = {};

  if (form.kind !== 'servicio' && form.kind !== 'producto') {
    errors.kind = 'Elige si ofreces un servicio o un producto.';
  }

  const title = form.title.trim();
  if (title.length < TITLE_MIN) {
    errors.title = `Escribe un título de al menos ${TITLE_MIN} letras.`;
  } else if (title.length > TITLE_MAX) {
    errors.title = `El título puede tener hasta ${TITLE_MAX} caracteres.`;
  }

  const description = form.description.trim();
  if (description.length > DESCRIPTION_MAX) {
    errors.description = `La descripción puede tener hasta ${DESCRIPTION_MAX} caracteres.`;
  }

  const phone = normalizePhone(form.contactPhone);
  if (!phone.ok) {
    errors.contactPhone =
      phone.reason === 'vacio'
        ? 'Escribe un número para que los vecinos te contacten.'
        : 'Revisa el número: usa solo dígitos, por ejemplo 987 654 321.';
  }

  if (form.location !== null && !isValidCoordinates(form.location)) {
    errors.location = 'La ubicación no es válida. Puedes publicar sin ubicación.';
  }

  if (Object.keys(errors).length > 0 || !phone.ok) return { ok: false, errors };

  return {
    ok: true,
    values: {
      kind: form.kind as OfferKind,
      title,
      description: description === '' ? null : description,
      contactPhone: `+${phone.digits}`,
      location: form.location,
    },
  };
}

/** Valida una calificación según D18: entero de 1 a 5. */
export function isValidStars(stars: number): boolean {
  return Number.isInteger(stars) && stars >= 1 && stars <= 5;
}
