import type { SupabaseClient } from '@supabase/supabase-js';

export async function ensureProfileName(
  client: SupabaseClient,
  userId: string,
  fallbackEmail?: string,
): Promise<string> {
  const { data } = await client
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle();

  if (data && typeof data.display_name === 'string' && data.display_name.trim().length > 0) {
    return data.display_name.trim();
  }

  const fallbackName = fallbackEmail?.split('@')[0]?.trim() || 'Vecino';
  await client
    .from('profiles')
    .upsert({ id: userId, display_name: fallbackName }, { onConflict: 'id' });
  return fallbackName;
}
