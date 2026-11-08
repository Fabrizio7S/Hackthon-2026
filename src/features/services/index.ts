// Punto de entrada público del módulo G02 (Servicios, productos, contacto y calificaciones)
// para conectar con la navegación y el mapa compartido de Persona 5.

export { newClientRequestId, offersApi } from './data';
export { createOffersApi, type OffersApi, type SaveResult } from './data/offersApi';
export type {
  Offer,
  OfferKind,
  OfferStatus,
  RatingSummary as OfferRatingSummary,
} from './data/offerTypes';
export {
  distanceKm,
  formatDistance,
  isValidCoordinates,
  type Coordinates,
} from './distance/distance';
export {
  DEFAULT_OFFER_FILTER,
  filterOfferListItems,
  normalizeSearchText,
  type OfferFilter,
  type OfferKindFilter,
} from './list/filterOffers';
export { loadOfferListItems, type OfferListItem } from './list/offerListItems';
export { loadMapOffers, toMapOffers, type ServiceMapOffer } from './map/toMapOffers';
export { EditOfferScreen } from './screens/EditOfferScreen';
export { MyOffersScreen } from './screens/MyOffersScreen';
export { OfferDetailScreen } from './screens/OfferDetailScreen';
export { OfferListScreen } from './screens/OfferListScreen';
export { PublishOfferScreen } from './screens/PublishOfferScreen';
