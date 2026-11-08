// Filtrado puro por tipo (Todos / Servicios / Productos) y búsqueda por texto
// en título y descripción (D16, D20; bloque 2 del issue #2).

import type { OfferKind } from '../data/offerTypes';
import type { OfferListItem } from './offerListItems';

export type OfferKindFilter = 'todos' | OfferKind;

export type OfferFilter = {
  kind: OfferKindFilter;
  query: string;
};

export const DEFAULT_OFFER_FILTER: OfferFilter = {
  kind: 'todos',
  query: '',
};

/** Normaliza texto para comparar sin distinguir mayúsculas ni tildes. */
export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Filtra las ofertas cargadas según el tipo elegido y el texto buscado en
 * título o descripción. No modifica el arreglo original.
 */
export function filterOfferListItems(
  items: readonly OfferListItem[],
  filter: OfferFilter,
): OfferListItem[] {
  const normalizedQuery = normalizeSearchText(filter.query);
  const terms = normalizedQuery ? normalizedQuery.split(/\s+/) : [];

  return items.filter(({ offer }) => {
    if (filter.kind !== 'todos' && offer.kind !== filter.kind) {
      return false;
    }
    if (terms.length === 0) {
      return true;
    }
    const haystack = normalizeSearchText(`${offer.title} ${offer.description ?? ''}`);
    return terms.every((term) => haystack.includes(term));
  });
}
