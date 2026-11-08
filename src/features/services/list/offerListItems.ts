// Junta las ofertas activas con su resumen de calificaciones para el listado.

import type { OffersApi } from '../data/offersApi';
import type { Offer, RatingSummary } from '../data/offerTypes';
import { ListLoadError } from './listLoader';

export type OfferListItem = {
  offer: Offer;
  /**
   * `null`: la oferta no tiene valoraciones.
   * `undefined`: no se pudieron cargar; la pantalla no muestra calificación
   * para no presentar un dato que no conoce.
   */
  rating: RatingSummary | null | undefined;
};

export async function loadOfferListItems(
  api: Pick<OffersApi, 'listActive' | 'ratingSummaries'>,
): Promise<OfferListItem[]> {
  const offers = await api.listActive();
  if (!offers.ok) throw new ListLoadError(offers.error.message);

  const ids = offers.data.map((o) => o.id);
  const summaries = await api.ratingSummaries(ids);
  const byId = summaries.ok ? new Map(summaries.data.map((s) => [s.offerId, s])) : null;

  return offers.data.map((offer) => ({
    offer,
    rating: byId ? (byId.get(offer.id) ?? null) : undefined,
  }));
}
