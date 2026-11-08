import type { SupabaseClient } from '@supabase/supabase-js';

export function decodeBase64ToBytes(base64: string): Uint8Array {
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
