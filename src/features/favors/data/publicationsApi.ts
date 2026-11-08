import type { SupabaseClient } from '@supabase/supabase-js';
import type { Publication } from '../model/types';
import { type FavorPublicationDraft, type FavorPublicationRow } from '../model/rows';
import { mapRowToPublication } from './mappers';
import { uploadFavorImage } from './images';
import { ensureProfileName } from './profileName';

export async function createFavorPublicationRemote(
  client: SupabaseClient,
  userId: string,
  userName: string,
  communityId: string | null,
  draft: FavorPublicationDraft,
): Promise<Publication> {
  await ensureProfileName(client, userId, userName);
  const uploadedImageUrl = await uploadFavorImage(
    client,
    userId,
    draft.imageUri,
    draft.imageBase64,
  );

  const payload = {
    community_id: communityId,
    owner_id: userId,
    owner_key: 'ana',
    owner_name: userName,
    kind: draft.kind,
    title: draft.title.trim(),
    description: draft.description.trim(),
    location: 'En tu comunidad',
    terms: 'Coordinar disponibilidad con quien publicó.',
    symbol: draft.kind === 'Préstamo' ? '📦' : '🔄',
    color: draft.kind === 'Préstamo' ? '#e5eddf' : '#f2e9db',
    image_uri: uploadedImageUrl,
  };

  const { data, error } = await client
    .from('favor_publications')
    .insert(payload)
    .select(
      'id, community_id, owner_id, owner_key, owner_name, kind, title, description, location, terms, symbol, color, image_uri',
    )
    .single();

  if (error || !data) {
    throw new Error('No se pudo publicar en Supabase. Inténtalo de nuevo.');
  }

  return mapRowToPublication(data as FavorPublicationRow, userId);
}

export async function deleteFavorPublicationRemote(
  client: SupabaseClient,
  publicationId: string,
): Promise<void> {
  const { error } = await client.from('favor_publications').delete().eq('id', publicationId);

  if (error) {
    throw new Error('No se pudo retirar la publicación.');
  }
}
