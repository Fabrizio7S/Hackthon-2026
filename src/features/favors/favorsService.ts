import type { SupabaseClient } from '@supabase/supabase-js';
import type { FavorRequest, Neighbor, Publication, RequestStatus } from './demo';

export type FavorPublicationDraft = Pick<Publication, 'kind' | 'title' | 'description' | 'imageUri'>;

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
}> {
  const [userName, pubRes, reqRes, savedRes] = await Promise.all([
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
  ]);

  if (pubRes.error) throw new Error('No se pudieron cargar las publicaciones de favores.');
  if (reqRes.error) throw new Error('No se pudieron cargar las solicitudes de favores.');
  if (savedRes.error) throw new Error('No se pudieron cargar los favores guardados.');

  const pubs = ((pubRes.data ?? []) as FavorPublicationRow[]).map((row) => mapRowToPublication(row, userId));
  const reqs = ((reqRes.data ?? []) as FavorRequestRow[]).map((row) => mapRowToRequest(row, userId));
  const savedIds = ((savedRes.data ?? []) as FavorSavedRow[]).map((row) => row.publication_id);

  return {
    userName,
    publications: pubs,
    requests: reqs,
    savedIds,
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
    image_uri: draft.imageUri ?? null,
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
