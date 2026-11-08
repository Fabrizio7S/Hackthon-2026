// Tipos de oferta en la app y conversión desde las filas de Supabase.
// Contrato: D16-D19 y supabase/migrations/20261107233000_g02_service_offers.sql.

import type { Coordinates } from '../distance/distance';

export type OfferKind = 'servicio' | 'producto';
export type OfferStatus = 'activa' | 'retirada';

export type Offer = {
  id: string;
  authorId: string;
  kind: OfferKind;
  title: string;
  description: string | null;
  contactPhone: string;
  location: Coordinates | null;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
};

/** Fila tal como la devuelve Supabase. */
export type OfferRow = {
  id: string;
  author_id: string;
  kind: OfferKind;
  title: string;
  description: string | null;
  contact_phone: string;
  latitude: number | null;
  longitude: number | null;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
};

export const OFFER_COLUMNS =
  'id, author_id, kind, title, description, contact_phone, latitude, longitude, status, created_at, updated_at';

export function rowToOffer(row: OfferRow): Offer {
  return {
    id: row.id,
    authorId: row.author_id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    contactPhone: row.contact_phone,
    location:
      row.latitude !== null && row.longitude !== null
        ? { latitude: row.latitude, longitude: row.longitude }
        : null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type RatingSummary = { offerId: string; average: number; count: number };
