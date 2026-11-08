import type { SupabaseClient } from '@supabase/supabase-js';
import { ensureProfileName } from './profileName';

export async function createFavorRequestRemote(
  client: SupabaseClient,
  publicationId: string,
  requesterId: string,
  requesterName: string,
): Promise<void> {
  await ensureProfileName(client, requesterId, requesterName);

  const { error } = await client.from('favor_requests').upsert(
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
