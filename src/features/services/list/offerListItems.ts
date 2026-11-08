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
  /** Nombre visible del vecino que publicó la oferta, si está disponible. */
  authorName?: string | null;
};

export async function loadOfferListItems(
  api: Pick<OffersApi, 'listActive' | 'ratingSummaries'> & Partial<Pick<OffersApi, 'authorNames'>>,
): Promise<OfferListItem[]> {
  const offers = await api.listActive();
  if (!offers.ok) throw new ListLoadError(offers.error.message);

  const ids = offers.data.map((o) => o.id);
  const authorIds = offers.data.map((o) => o.authorId);

  const [summaries, authorsResult] = await Promise.all([
    api.ratingSummaries(ids),
    api.authorNames ? api.authorNames(authorIds) : Promise.resolve(null),
  ]);

  const byId = summaries.ok ? new Map(summaries.data.map((s) => [s.offerId, s])) : null;
  const authorsById = authorsResult && authorsResult.ok ? authorsResult.data : {};

  return offers.data.map((offer) => ({
    offer,
    rating: byId ? (byId.get(offer.id) ?? null) : undefined,
    authorName: authorsById[offer.authorId] ?? null,
  }));
}
