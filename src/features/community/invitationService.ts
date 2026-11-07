import type { SupabaseClient } from '@supabase/supabase-js';

export type Neighbor = { display_name: string; personal_code: string };
export type Invitation = {
  id: string;
  community_id: string;
  community_name: string;
  status: 'pending' | 'accepted' | 'rejected';
  direction: 'incoming' | 'outgoing';
  recipient_name: string | null;
};

export function normalizePersonalCode(value: string): string {
  const code = value.trim().toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(code)) {
    throw new Error('Ingresa el código personal completo, incluidos los guiones.');
  }
  return code;
}

export function invitationErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  switch (code) {
    case '42501': return 'No tienes permiso para realizar esta acción.';
    case '23505': return 'Ya hay una comunidad asignada. Actualiza los datos para continuar.';
    case 'P0002': return 'No encontramos un vecino con ese código.';
    case '22P02': return 'Revisa que el código esté completo.';
    case '42883':
    case '42P01':
    case 'PGRST202': return 'Las invitaciones todavía no están disponibles. Intenta más tarde.';
    default: return 'No pudimos completar la operación. Revisa tu conexión y vuelve a intentar.';
  }
}

function readInvitation(data: unknown): Invitation {
  if (!data || typeof data !== 'object'
    || !('id' in data) || typeof data.id !== 'string'
    || !('community_id' in data) || typeof data.community_id !== 'string'
    || !('community_name' in data) || typeof data.community_name !== 'string'
    || !('status' in data) || !['pending', 'accepted', 'rejected'].includes(String(data.status))
    || !('direction' in data) || (data.direction !== 'incoming' && data.direction !== 'outgoing')
    || !('recipient_name' in data) || (data.recipient_name !== null && typeof data.recipient_name !== 'string')) {
    throw new Error('Invalid invitation response');
  }
  return { id: data.id, community_id: data.community_id, community_name: data.community_name,
    status: data.status as Invitation['status'], direction: data.direction, recipient_name: data.recipient_name };
}

export function createInvitationService(client: SupabaseClient) {
  let busy = false;
  async function exclusive<T>(action: () => Promise<T>) {
    if (busy) throw new Error('Invitation operation already running');
    busy = true;
    try { return await action(); } finally { busy = false; }
  }
  return {
    async load(): Promise<Invitation[]> {
      const { data, error } = await client.rpc('get_my_invitations');
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error('Invalid invitation list');
      return data.map(readInvitation);
    },
    find(value: string): Promise<Neighbor | null> {
      return exclusive(async () => {
        const code = normalizePersonalCode(value);
        const { data, error } = await client.rpc('find_neighbor', { p_code: code });
        if (error) throw error;
        if (data === null) return null;
        if (!data || typeof data.display_name !== 'string' || data.personal_code !== code) {
          throw new Error('Invalid neighbor response');
        }
        return { display_name: data.display_name, personal_code: data.personal_code };
      });
    },
    send(value: string): Promise<Invitation> {
      return exclusive(async () => {
        const code = normalizePersonalCode(value);
        const { data, error } = await client.rpc('send_invitation', { p_code: code });
        if (error) throw error;
        const invitation = readInvitation(data);
        if (invitation.direction !== 'outgoing' || invitation.status !== 'pending') throw new Error('Invalid send response');
        return invitation;
      });
    },
    process(id: string, accept: boolean): Promise<Invitation> {
      return exclusive(async () => {
        const normalizedId = normalizePersonalCode(id);
        const { data, error } = await client.rpc('process_invitation', { p_id: normalizedId, p_accept: accept });
        if (error) throw error;
        const invitation = readInvitation(data);
        if (invitation.id !== normalizedId || invitation.direction !== 'incoming') throw new Error('Invalid processing response');
        return invitation;
      });
    },
  };
}
