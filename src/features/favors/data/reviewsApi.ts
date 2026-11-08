import type { SupabaseClient } from '@supabase/supabase-js';
import type { Publication, Review } from '../model/types';
import { type FavorReviewRow } from '../model/rows';
import { mapRowToReview } from './mappers';
import { ensureProfileName } from './profileName';

export async function createFavorReviewRemote(
  client: SupabaseClient,
  publication: Publication,
  authorId: string,
  authorName: string,
  stars: 1 | 2 | 3 | 4 | 5,
  comment: string,
): Promise<Review> {
  await ensureProfileName(client, authorId, authorName);

  const payload = {
    publication_id: publication.id,
    target_owner_id: publication.ownerId ?? null,
    target_owner_key: publication.owner,
    author_id: authorId,
    author_name: authorName,
    stars,
    comment: comment.trim(),
  };

  const { data, error } = await client
    .from('favor_reviews')
    .upsert(payload, { onConflict: 'publication_id,author_id' })
    .select(
      'id, publication_id, target_owner_id, target_owner_key, author_id, author_name, stars, comment',
    )
    .single();

  if (error || !data) {
    throw new Error('No se pudo guardar la reseña en Supabase.');
  }

  return mapRowToReview(data as FavorReviewRow);
}
