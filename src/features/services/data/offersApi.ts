// Acceso a ofertas y calificaciones en Supabase.
// Los permisos reales los aplica la base de datos (RLS); aquí solo se traducen
// resultados y errores para la pantalla.

import type { SupabaseClient } from '@supabase/supabase-js';

import { dataError, mapDataError, UNIQUE_VIOLATION, type DataResult } from './dataError';
import { isValidStars, validateOffer, type OfferErrors, type OfferForm } from './offerValidation';
import {
  OFFER_COLUMNS,
  rowToOffer,
  type Offer,
  type OfferRow,
  type OfferStatus,
  type RatingSummary,
} from './offerTypes';

export type SaveResult = DataResult<Offer> | { ok: false; error: { kind: 'formulario'; errors: OfferErrors } };

/** Identificador único por envío para no duplicar ofertas al reintentar. */
export function newClientRequestId(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  // Hermes no siempre trae crypto; basta con un UUID v4 no criptográfico.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function createOffersApi(client: SupabaseClient | null) {
  async function currentUserId(): Promise<DataResult<string>> {
    if (!client) return { ok: false, error: dataError('sin_configuracion') };
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return { ok: false, error: dataError('sin_sesion') };
    return { ok: true, data: data.user.id };
  }

  return {
    /** Ofertas activas visibles para el vecino, de la más reciente a la más antigua. */
    async listActive(): Promise<DataResult<Offer[]>> {
      if (!client) return { ok: false, error: dataError('sin_configuracion') };
      const { data, error } = await client
        .from('service_offers')
        .select(OFFER_COLUMNS)
        .eq('status', 'activa')
        .order('created_at', { ascending: false });
      if (error) return { ok: false, error: mapDataError(error) };
      return { ok: true, data: (data as OfferRow[]).map(rowToOffer) };
    },

    /** Ofertas propias, activas y retiradas. */
    async listMine(): Promise<DataResult<Offer[]>> {
      const user = await currentUserId();
      if (!user.ok) return user;
      const { data, error } = await client!
        .from('service_offers')
        .select(OFFER_COLUMNS)
        .eq('author_id', user.data)
        .order('created_at', { ascending: false });
      if (error) return { ok: false, error: mapDataError(error) };
      return { ok: true, data: (data as OfferRow[]).map(rowToOffer) };
    },

    async getById(id: string): Promise<DataResult<Offer>> {
      if (!client) return { ok: false, error: dataError('sin_configuracion') };
      const { data, error } = await client
        .from('service_offers')
        .select(OFFER_COLUMNS)
        .eq('id', id)
        .maybeSingle();
      if (error) return { ok: false, error: mapDataError(error) };
      if (!data) return { ok: false, error: dataError('no_encontrado') };
      return { ok: true, data: rowToOffer(data as OfferRow) };
    },

    /**
     * Publica una oferta. Si el mismo envío ya llegó antes (mismo
     * clientRequestId), devuelve la oferta existente en lugar de duplicarla.
     */
    async create(form: OfferForm, clientRequestId: string): Promise<SaveResult> {
      const valid = validateOffer(form);
      if (!valid.ok) return { ok: false, error: { kind: 'formulario', errors: valid.errors } };
      if (!client) return { ok: false, error: dataError('sin_configuracion') };

      const v = valid.values;
      const { data, error } = await client
        .from('service_offers')
        .insert({
          kind: v.kind,
          title: v.title,
          description: v.description,
          contact_phone: v.contactPhone,
          latitude: v.location?.latitude ?? null,
          longitude: v.location?.longitude ?? null,
          client_request_id: clientRequestId,
        })
        .select(OFFER_COLUMNS)
        .single();

      if (error?.code === UNIQUE_VIOLATION) {
        const existing = await client
          .from('service_offers')
          .select(OFFER_COLUMNS)
          .eq('client_request_id', clientRequestId)
          .maybeSingle();
        if (existing.data) return { ok: true, data: rowToOffer(existing.data as OfferRow) };
        return { ok: false, error: mapDataError(existing.error ?? error) };
      }
      if (error) return { ok: false, error: mapDataError(error) };
      return { ok: true, data: rowToOffer(data as OfferRow) };
    },

    /** Edita una oferta propia. El tipo no se puede cambiar (D19). */
    async update(id: string, form: OfferForm): Promise<SaveResult> {
      const valid = validateOffer(form);
      if (!valid.ok) return { ok: false, error: { kind: 'formulario', errors: valid.errors } };
      if (!client) return { ok: false, error: dataError('sin_configuracion') };

      const v = valid.values;
      const { data, error } = await client
        .from('service_offers')
        .update({
          title: v.title,
          description: v.description,
          contact_phone: v.contactPhone,
          latitude: v.location?.latitude ?? null,
          longitude: v.location?.longitude ?? null,
        })
        .eq('id', id)
        .select(OFFER_COLUMNS)
        .maybeSingle();
      if (error) return { ok: false, error: mapDataError(error) };
      // RLS oculta las filas ajenas: 0 filas significa sin permiso o inexistente.
      if (!data) return { ok: false, error: dataError('sin_permiso') };
      return { ok: true, data: rowToOffer(data as OfferRow) };
    },

    /** Retira o reactiva una oferta propia (D19). */
    async setStatus(id: string, status: OfferStatus): Promise<DataResult<Offer>> {
      if (!client) return { ok: false, error: dataError('sin_configuracion') };
      const { data, error } = await client
        .from('service_offers')
        .update({ status })
        .eq('id', id)
        .select(OFFER_COLUMNS)
        .maybeSingle();
      if (error) return { ok: false, error: mapDataError(error) };
      if (!data) return { ok: false, error: dataError('sin_permiso') };
      return { ok: true, data: rowToOffer(data as OfferRow) };
    },

    /** Califica o cambia la propia calificación (D18). */
    async rate(offerId: string, stars: number): Promise<DataResult<null>> {
      if (!isValidStars(stars)) return { ok: false, error: dataError('validacion') };
      const user = await currentUserId();
      if (!user.ok) return user;
      const { error } = await client!
        .from('service_offer_ratings')
        .upsert({ offer_id: offerId, rater_id: user.data, stars }, { onConflict: 'offer_id,rater_id' });
      if (error) return { ok: false, error: mapDataError(error) };
      return { ok: true, data: null };
    },

    /** Promedio y cantidad de valoraciones de varias ofertas. */
    async ratingSummaries(offerIds: string[]): Promise<DataResult<RatingSummary[]>> {
      if (!client) return { ok: false, error: dataError('sin_configuracion') };
      if (offerIds.length === 0) return { ok: true, data: [] };
      const { data, error } = await client
        .from('service_offer_rating_summary')
        .select('offer_id, average, rating_count')
        .in('offer_id', offerIds);
      if (error) return { ok: false, error: mapDataError(error) };
      return {
        ok: true,
        data: (data as { offer_id: string; average: number | string; rating_count: number }[]).map((r) => ({
          offerId: r.offer_id,
          average: Number(r.average),
          count: r.rating_count,
        })),
      };
    },
  };
}

export type OffersApi = ReturnType<typeof createOffersApi>;
