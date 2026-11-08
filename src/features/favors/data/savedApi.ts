import type { SupabaseClient } from '@supabase/supabase-js';

export async function toggleFavorSavedRemote(
  client: SupabaseClient,
  userId: string,
  publicationId: string,
  shouldSave: boolean,
): Promise<void> {
  if (shouldSave) {
    const { error } = await client
      .from('favor_saved')
      .upsert(
        { user_id: userId, publication_id: publicationId },
        { onConflict: 'user_id,publication_id' },
      );
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
