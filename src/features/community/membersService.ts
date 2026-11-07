import type { SupabaseClient } from '@supabase/supabase-js';

export type CommunityMember = {
  display_name: string;
  role: 'representative' | 'member';
  is_current_user: boolean;
};

export type MembersState =
  | { status: 'loading'; members: CommunityMember[]; error: null }
  | { status: 'ready'; members: CommunityMember[]; error: null }
  | { status: 'error'; members: CommunityMember[]; error: string };

export function membersErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  switch (code) {
    case '42501': return 'No tienes acceso a estos integrantes. Actualiza tu comunidad.';
    case '42883':
    case 'PGRST202': return 'El listado de integrantes todavía no está disponible. Intenta más tarde.';
    default: return 'No pudimos consultar los integrantes. Revisa tu conexión y vuelve a intentar.';
  }
}

export function createMembersService(client: SupabaseClient, communityId: string) {
  return {
    async load(): Promise<CommunityMember[]> {
      // La comunidad se resuelve en servidor. El id local solo valida la respuesta.
      const { data, error } = await client.rpc('get_my_community_members');
      if (error) throw error;
      if (!data || data.community_id !== communityId || !Array.isArray(data.members)) {
        throw new Error('Invalid members response');
      }
      return data.members.map((member: unknown): CommunityMember => {
        if (!member || typeof member !== 'object'
          || !('display_name' in member) || typeof member.display_name !== 'string'
          || !('role' in member) || (member.role !== 'representative' && member.role !== 'member')
          || !('is_current_user' in member) || typeof member.is_current_user !== 'boolean') {
          throw new Error('Invalid member response');
        }
        return { display_name: member.display_name, role: member.role, is_current_user: member.is_current_user };
      });
    },
  };
}

// La cancelación evita que una lectura de la cuenta/comunidad anterior llegue a pantalla.
export function observeMembers(service: { load: () => Promise<CommunityMember[]> }, receive: (state: MembersState) => void) {
  let active = true;
  receive({ status: 'loading', members: [], error: null });
  void service.load().then(members => {
    if (active) receive({ status: 'ready', members, error: null });
  }).catch(error => {
    if (active) receive({ status: 'error', members: [], error: membersErrorMessage(error) });
  });
  return () => { active = false; };
}
