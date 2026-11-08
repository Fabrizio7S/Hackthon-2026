import type { SupabaseClient } from '@supabase/supabase-js';
import type { CommunityMembership, CommunityStatusData } from '../../shared/identity';

export type Membership = CommunityMembership;
export type CommunityStatus = CommunityStatusData;

export function normalizeCommunityName(value: string): string {
  const name = value.trim();
  if (!name || Array.from(name).length > 100 || /[\u0000-\u001f\u007f]/.test(name)) {
    throw new Error('Ingresa un nombre de comunidad de 1 a 100 caracteres, en una sola línea.');
  }
  return name;
}

export function communityErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  switch (code) {
    case '42501': return 'Tu cuenta no está autorizada para realizar esta acción.';
    case '23503': return 'Completa y guarda tu perfil antes de continuar.';
    case '23505': return 'Ya perteneces a una comunidad. Actualiza para consultar tu pertenencia.';
    case '22023': return 'Revisa el código o nombre ingresado.';
    case 'P0002': return 'No encontramos una comunidad con ese código de invitación.';
    case '42883':
    case '42P01':
    case 'PGRST202': return 'Las comunidades todavía no están disponibles. Intenta más tarde.';
    default: return 'No pudimos completar la operación. Revisa tu conexión y vuelve a intentar.';
  }
}

function membershipFrom(data: unknown, userId: string): Membership {
  if (!data || typeof data !== 'object' || !('user_id' in data) || data.user_id !== userId
    || !('community_id' in data) || typeof data.community_id !== 'string'
    || !('community_name' in data) || typeof data.community_name !== 'string'
    || !('role' in data) || (data.role !== 'representative' && data.role !== 'member')) {
    throw new Error('Invalid membership response');
  }
  const inviteCode = 'invite_code' in data && typeof data.invite_code === 'string' ? data.invite_code : null;
  return {
    user_id: data.user_id,
    community_id: data.community_id,
    community_name: data.community_name,
    role: data.role,
    invite_code: inviteCode,
  };
}

export function createCommunityService(client: SupabaseClient, userId: string) {
  let creating = false;
  return {
    async load(): Promise<CommunityStatus> {
      const { data, error } = await client.rpc('get_my_community');
      if (error) throw error;
      if (!data || typeof data.can_create !== 'boolean' || typeof data.has_profile !== 'boolean'
        || !('membership' in data)) throw new Error('Invalid community status');
      return { can_create: data.can_create, has_profile: data.has_profile,
        membership: data.membership === null ? null : membershipFrom(data.membership, userId) };
    },
    async create(value: string): Promise<Membership> {
      if (creating) throw new Error('Creation already running');
      const name = normalizeCommunityName(value);
      creating = true;
      try {
        // El servidor obtiene el actor de auth.uid() y decide sus permisos.
        const { data, error } = await client.rpc('create_community', { p_name: name });
        if (error) throw error;
        const membership = membershipFrom(data, userId);
        if (membership.role !== 'representative') throw new Error('Invalid creation response');
        return membership;
      } finally { creating = false; }
    },
    async joinByCode(code: string): Promise<Membership> {
      if (creating) throw new Error('Join operation already running');
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) throw new Error('Ingresa el código de invitación.');
      creating = true;
      try {
        const { data, error } = await client.rpc('join_community_by_code', { p_code: cleanCode });
        if (error) throw error;
        return membershipFrom(data, userId);
      } finally { creating = false; }
    },
  };
}
