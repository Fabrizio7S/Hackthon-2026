import type { SupabaseClient } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  display_name: string;
  personal_code: string;
};

const columns = 'id, display_name, personal_code';

export function normalizeDisplayName(value: string): string {
  const name = value.trim();
  if (!name || Array.from(name).length > 100 || /[\u0000-\u001f\u007f]/.test(name)) {
    throw new Error('Ingresa un nombre de 1 a 100 caracteres, sin saltos de línea.');
  }
  return name;
}

export function profileErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  switch (code) {
    case '42P01':
    case 'PGRST205': return 'El perfil todavía no está disponible. Intenta más tarde.';
    case '42501': return 'No tienes permiso para realizar esta acción. Vuelve a iniciar sesión.';
    case '23514': return 'Revisa el nombre: debe tener de 1 a 100 caracteres y una sola línea.';
    default: return 'No pudimos completar la operación. Revisa tu conexión y vuelve a intentar.';
  }
}

function readProfile(data: unknown, userId: string): Profile {
  if (!data || typeof data !== 'object' || !('id' in data) || data.id !== userId
    || !('display_name' in data) || typeof data.display_name !== 'string'
    || !('personal_code' in data) || typeof data.personal_code !== 'string') {
    throw new Error('Invalid profile response');
  }
  return { id: data.id, display_name: data.display_name, personal_code: data.personal_code };
}

export function createProfileService(client: SupabaseClient, userId: string) {
  let saving = false;

  async function load(): Promise<Profile | null> {
    const { data, error } = await client.from('profiles').select(columns).eq('id', userId).maybeSingle();
    if (error) throw error;
    return data ? readProfile(data, userId) : null;
  }

  async function update(name: string): Promise<Profile> {
    const { data, error } = await client.from('profiles')
      .update({ display_name: name }).eq('id', userId).select(columns).single();
    if (error) throw error;
    return readProfile(data, userId);
  }

  return {
    load,
    async save(value: string): Promise<Profile> {
      if (saving) throw new Error('Profile request already running');
      const name = normalizeDisplayName(value);
      saving = true;
      try {
        if (await load()) return await update(name);
        // Identidad y código se generan en backend; nunca se envían desde el cliente.
        const { data, error } = await client.from('profiles')
          .insert({ display_name: name }).select(columns).single();
        if (error) {
          // Otra solicitud pudo crear el perfil o confirmarse antes de perder la respuesta.
          if (error.code === '23505' && await load()) return await update(name);
          throw error;
        }
        return readProfile(data, userId);
      } finally {
        saving = false;
      }
    },
  };
}
