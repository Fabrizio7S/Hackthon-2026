// Adaptador puro de las ofertas de G02 al formato `OfertaMapa` del mapa
// compartido de Persona 5 (`src/features/mapa/types.ts`).
// Cumple los criterios del issue #2:
// - Solo incluye ofertas activas.
// - Solo incluye ofertas con coordenadas válidas (nunca inventa ubicación).
// - Mantiene los mismos identificadores, títulos, tipos y calificaciones que la lista.

import type { OffersApi } from '../data/offersApi';
import type { OfferKind } from '../data/offerTypes';
import { isValidCoordinates } from '../distance/distance';
import { loadOfferListItems, type OfferListItem } from '../list/offerListItems';

/** Compatible con `OfertaMapa` de `src/features/mapa/types.ts` (Persona 5). */
export type ServiceMapOffer = {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: OfferKind | 'emergencia' | 'recurso';
  latitud: number;
  longitud: number;
  calificacionPromedio?: number | null;
  cantidadCalificaciones?: number;
  autorNombre?: string | null;
  etiquetaEstado?: string | null;
};

/**
 * Convierte los elementos del listado en marcadores para el mapa compartido.
 * Omite ofertas retiradas o sin coordenadas reales.
 */
export function toMapOffers(items: readonly OfferListItem[]): ServiceMapOffer[] {
  const result: ServiceMapOffer[] = [];

  for (const { offer, rating, authorName } of items) {
    if (offer.status !== 'activa') continue;
    if (!isValidCoordinates(offer.location)) continue;

    result.push({
      id: offer.id,
      nombre: offer.title,
      descripcion: offer.description ?? '',
      categoria: offer.kind,
      latitud: offer.location.latitude,
      longitud: offer.location.longitude,
      calificacionPromedio: rating ? rating.average : null,
      cantidadCalificaciones: rating ? rating.count : 0,
      autorNombre: authorName ?? null,
    });
  }

  return result;
}

/** Carga las ofertas activas con sus calificaciones listas para `MapaServicios`. */
export async function loadMapOffers(
  api: Pick<OffersApi, 'listActive' | 'ratingSummaries'> & Partial<Pick<OffersApi, 'authorNames'>>,
): Promise<ServiceMapOffer[]> {
  const items = await loadOfferListItems(api);
  return toMapOffers(items);
}
