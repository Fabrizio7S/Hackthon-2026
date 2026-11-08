import { openContact } from '../contact/openContact';
import type { OffersApi } from '../data/offersApi';
import type { Offer, RatingSummary as Summary } from '../data/offerTypes';
import { type Coordinates } from '../distance/distance';

export type Props = {
  offerId: string;
  /** Ubicación del vecino; sin ella no se muestra distancia. */
  userLocation?: Coordinates | null;
  /** Para pruebas; por defecto usa el Supabase compartido. */
  api?: Pick<OffersApi, 'getById' | 'ratingSummaries' | 'rate'> &
    Partial<Pick<OffersApi, 'viewerRating' | 'getAuthorName' | 'setStatus'>>;
  onEdit?: () => void;
  onRetired?: () => void;
  /** Para pruebas; por defecto abre el marcador o WhatsApp. */
  contact?: typeof openContact;
};

export type Detail = {
  offer: Offer;
  rating: Summary | null | undefined;
  viewerUserId: string | null;
  myStars: number;
  /** Nombre de quien publicó; null si no se pudo obtener (no bloquea el detalle). */
  authorName: string | null;
};

export const KIND_LABEL = { servicio: 'Servicio', producto: 'Producto' } as const;
