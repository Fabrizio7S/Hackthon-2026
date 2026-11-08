import type { SupabaseClient } from '@supabase/supabase-js';
import type { FavorRequest, Neighbor, Publication, RequestStatus, Review } from './demo';

export type FavorPublicationDraft = Pick<Publication, 'kind' | 'title' | 'description' | 'imageUri'> & {
  imageBase64?: string;
};

type FavorPublicationRow = {
  id: string;
  community_id: string | null;
  owner_id: string | null;
  owner_key: string;
  owner_name: string;
  kind: 'Préstamo' | 'Intercambio';
  title: string;
  description: string;
  location: string;
  terms: string;
  symbol: string;
  color: string;
  image_uri: string | null;
};

type FavorRequestRow = {
  id: string;
  publication_id: string;
  requester_id: string;
  requester_name: string;
  status: RequestStatus;
};

type FavorSavedRow = {
  publication_id: string;
};

type FavorReviewRow = {
  id: string;
  publication_id: string | null;
  target_owner_id: string | null;
  target_owner_key: string;
  author_id: string | null;
  author_name: string;
  stars: number;
  comment: string;
};

function toNeighborKey(ownerId: string | null, ownerKey: string, currentUserId: string): Neighbor {
  if (ownerId && ownerId === currentUserId) return 'ana';
  if (ownerKey === 'carlos') return 'carlos';
  return 'luz';
}

export function mapRowToPublication(row: FavorPublicationRow, currentUserId: string): Publication {
  return {
    id: row.id,
    owner: toNeighborKey(row.owner_id, row.owner_key, currentUserId),
    ownerId: row.owner_id ?? undefined,
    ownerName: row.owner_name,
    kind: row.kind === 'Intercambio' ? 'Intercambio' : 'Préstamo',
    title: row.title,
    description: row.description,
    location: row.location,
    terms: row.terms,
    symbol: row.symbol,
    color: row.color,
    imageUri: row.image_uri ?? undefined,
  };
}

export function mapRowToRequest(row: FavorRequestRow, currentUserId: string): FavorRequest {
  return {
    publicationId: row.publication_id,
    requester: row.requester_id === currentUserId ? 'ana' : 'carlos',
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    status: row.status,
  };
}

export function mapRowToReview(row: FavorReviewRow): Review {
  const validStars = Math.max(1, Math.min(5, Math.round(row.stars))) as 1 | 2 | 3 | 4 | 5;
  return {
    id: row.id,
    publicationId: row.publication_id ?? undefined,
    targetOwnerId: row.target_owner_id ?? undefined,
    targetOwnerKey: row.target_owner_key === 'carlos' ? 'carlos' : row.target_owner_key === 'ana' ? 'ana' : 'luz',
    authorId: row.author_id ?? undefined,
    author: row.author_name,
    stars: validStars,
    comment: row.comment,
  };
}

function decodeBase64ToBytes(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const len = clean.length;
  let pad = 0;
  if (clean.endsWith('==')) pad = 2;
  else if (clean.endsWith('=')) pad = 1;
  const byteLength = (len * 3) / 4 - pad;
  const bytes = new Uint8Array(byteLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = chars.indexOf(clean[i]);
    const encoded2 = chars.indexOf(clean[i + 1]);
    const encoded3 = chars.indexOf(clean[i + 2]);
    const encoded4 = chars.indexOf(clean[i + 3]);
    const triplet = (encoded1 << 18) | (encoded2 << 12) | ((encoded3 & 63) << 6) | (encoded4 & 63);
    if (p < byteLength) bytes[p++] = (triplet >> 16) & 255;
    if (p < byteLength) bytes[p++] = (triplet >> 8) & 255;
    if (p < byteLength) bytes[p++] = triplet & 255;
  }
  return bytes;
}

export async function uploadFavorImage(
  client: SupabaseClient,
  userId: string,
  imageUri?: string,
  imageBase64?: string,
): Promise<string | null> {
  if (!imageUri && !imageBase64) return null;
  if (imageBase64) {
    const filePath = `${userId}/${Date.now()}.jpg`;
    try {
      const bytes = decodeBase64ToBytes(imageBase64);
      const { error } = await client.storage.from('favor-images').upload(filePath, bytes, {
        contentType: 'image/jpeg',
        upsert: true,
      });
      if (!error) {
        const { data } = client.storage.from('favor-images').getPublicUrl(filePath);
        if (data?.publicUrl) return data.publicUrl;
      }
    } catch {
      // Fallback a data URI si el almacenamiento falla
    }
    return `data:image/jpeg;base64,${imageBase64}`;
  }
  return imageUri ?? null;
}

async function ensureProfileName(client: SupabaseClient, userId: string, fallbackEmail?: string): Promise<string> {
  const { data } = await client
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle();

  if (data && typeof data.display_name === 'string' && data.display_name.trim().length > 0) {
    return data.display_name.trim();
  }

  const fallbackName = fallbackEmail?.split('@')[0]?.trim() || 'Vecino';
  await client.from('profiles').upsert({ id: userId, display_name: fallbackName }, { onConflict: 'id' });
  return fallbackName;
}

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
      .select('id, community_id, owner_id, owner_key, owner_name, kind, title, description, location, terms, symbol, color, image_uri')
      .order('created_at', { ascending: false }),
    client
      .from('favor_requests')
      .select('id, publication_id, requester_id, requester_name, status')
      .order('created_at', { ascending: false }),
    client
      .from('favor_saved')
      .select('publication_id')
      .eq('user_id', userId),
    client
      .from('favor_reviews')
      .select('id, publication_id, target_owner_id, target_owner_key, author_id, author_name, stars, comment')
      .order('created_at', { ascending: false }),
  ]);

  if (pubRes.error) throw new Error('No se pudieron cargar las publicaciones de favores.');
  if (reqRes.error) throw new Error('No se pudieron cargar las solicitudes de favores.');
  if (savedRes.error) throw new Error('No se pudieron cargar los favores guardados.');

  const pubs = ((pubRes.data ?? []) as FavorPublicationRow[]).map((row) => mapRowToPublication(row, userId));
  const reqs = ((reqRes.data ?? []) as FavorRequestRow[]).map((row) => mapRowToRequest(row, userId));
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

export async function createFavorPublicationRemote(
  client: SupabaseClient,
  userId: string,
  userName: string,
  communityId: string | null,
  draft: FavorPublicationDraft,
): Promise<Publication> {
  await ensureProfileName(client, userId, userName);
  const uploadedImageUrl = await uploadFavorImage(client, userId, draft.imageUri, draft.imageBase64);

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
    .select('id, community_id, owner_id, owner_key, owner_name, kind, title, description, location, terms, symbol, color, image_uri')
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
  const { error } = await client
    .from('favor_publications')
    .delete()
    .eq('id', publicationId);

  if (error) {
    throw new Error('No se pudo retirar la publicación.');
  }
}

export async function toggleFavorSavedRemote(
  client: SupabaseClient,
  userId: string,
  publicationId: string,
  shouldSave: boolean,
): Promise<void> {
  if (shouldSave) {
    const { error } = await client
      .from('favor_saved')
      .upsert({ user_id: userId, publication_id: publicationId }, { onConflict: 'user_id,publication_id' });
    if (error) throw new Error('No se pudo guardar la publicación.');
  } else {
    const { error } = await client
      .from('favor_saved')
      .delete()
      .eq('user_id', userId)
      .eq('publication_id', publicationId);
    if (error) throw new Error('No se pudo quitar la publicación de guardadas.');
  }
}

export async function createFavorRequestRemote(
  client: SupabaseClient,
  publicationId: string,
  requesterId: string,
  requesterName: string,
): Promise<void> {
  await ensureProfileName(client, requesterId, requesterName);

  const { error } = await client
    .from('favor_requests')
    .upsert(
      {
        publication_id: publicationId,
        requester_id: requesterId,
        requester_name: requesterName,
        status: 'pending',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'publication_id,requester_id' },
    );

  if (error) {
    throw new Error('No se pudo registrar la solicitud en Supabase.');
  }
}

export async function acceptFavorRequestRemote(
  client: SupabaseClient,
  publicationId: string,
  requesterId: string,
): Promise<void> {
  const { error } = await client.rpc('accept_favor_request', {
    p_publication_id: publicationId,
    p_requester_id: requesterId,
  });

  if (error) {
    throw new Error('No se pudo aceptar la solicitud.');
  }
}

export async function cancelFavorRequestRemote(
  client: SupabaseClient,
  publicationId: string,
  requesterId: string,
): Promise<void> {
  const { error } = await client.rpc('cancel_favor_request', {
    p_publication_id: publicationId,
    p_requester_id: requesterId,
  });

  if (error) {
    throw new Error('No se pudo cancelar la solicitud.');
  }
}

export async function finishFavorRequestRemote(
  client: SupabaseClient,
  publicationId: string,
  requesterId: string,
): Promise<void> {
  const { error } = await client
    .from('favor_requests')
    .update({ status: 'finished', updated_at: new Date().toISOString() })
    .eq('publication_id', publicationId)
    .eq('requester_id', requesterId);

  if (error) {
    throw new Error('No se pudo marcar la solicitud como terminada.');
  }
}

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
    .select('id, publication_id, target_owner_id, target_owner_key, author_id, author_name, stars, comment')
    .single();

  if (error || !data) {
    throw new Error('No se pudo guardar la reseña en Supabase.');
  }

  return mapRowToReview(data as FavorReviewRow);
}
