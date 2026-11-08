import type { SupabaseClient } from '@supabase/supabase-js';
import type { FavorRequest, Publication, Review } from '../model/types';
import {
  type FavorPublicationRow,
  type FavorRequestRow,
  type FavorSavedRow,
  type FavorReviewRow,
} from '../model/rows';
import { mapRowToPublication, mapRowToRequest, mapRowToReview } from './mappers';
import { ensureProfileName } from './profileName';

export async function fetchFavorsData(
  client: SupabaseClient,
  userId: string,
  fallbackEmail?: string,
): Promise<{
  userName: string;
  publications: Publication[];
  requests: FavorRequest[];
  savedIds: string[];
  reviews: Review[];
}> {
  const [userName, pubRes, reqRes, savedRes, revRes] = await Promise.all([
    ensureProfileName(client, userId, fallbackEmail),
    client
      .from('favor_publications')
      .select(
        'id, community_id, owner_id, owner_key, owner_name, kind, title, description, location, terms, symbol, color, image_uri',
      )
      .order('created_at', { ascending: false }),
    client
      .from('favor_requests')
      .select('id, publication_id, requester_id, requester_name, status')
      .order('created_at', { ascending: false }),
    client.from('favor_saved').select('publication_id').eq('user_id', userId),
    client
      .from('favor_reviews')
      .select(
        'id, publication_id, target_owner_id, target_owner_key, author_id, author_name, stars, comment',
      )
      .order('created_at', { ascending: false }),
  ]);

  if (pubRes.error) throw new Error('No se pudieron cargar las publicaciones de favores.');
  if (reqRes.error) throw new Error('No se pudieron cargar las solicitudes de favores.');
  if (savedRes.error) throw new Error('No se pudieron cargar los favores guardados.');

  const pubs = ((pubRes.data ?? []) as FavorPublicationRow[]).map((row) =>
    mapRowToPublication(row, userId),
  );
  const reqs = ((reqRes.data ?? []) as FavorRequestRow[]).map((row) =>
    mapRowToRequest(row, userId),
  );
  const savedIds = ((savedRes.data ?? []) as FavorSavedRow[]).map((row) => row.publication_id);
  const reviews = ((revRes.data ?? []) as FavorReviewRow[]).map((row) => mapRowToReview(row));

  return {
    userName,
    publications: pubs,
    requests: reqs,
    savedIds,
    reviews,
  };
}
