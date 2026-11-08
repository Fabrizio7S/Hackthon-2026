/** Contratos de lectura de G01. Roles y pertenencias siempre se autorizan en backend. */
export type SessionUser = Readonly<{ id: string; email?: string }>;
export type SessionIdentity =
  | Readonly<{ status: 'loading'; user: null; error: null }>
  | Readonly<{ status: 'signedOut'; user: null; error: null }>
  | Readonly<{ status: 'error'; user: null; error: string }>
  | Readonly<{ status: 'authenticated'; user: SessionUser; error: null }>;
export type SessionActions = Readonly<{ signOut: () => Promise<boolean>; retry: () => void }>;
export type CommunityActions = Readonly<{ refresh: () => void }>;

export type CommunityRole = 'representative' | 'member';
export type Community = Readonly<{ id: string; name: string }>;
export type CommunityMembership = Readonly<{
  user_id: string;
  community_id: string;
  community_name: string;
  role: CommunityRole;
  invite_code?: string | null;
}>;

/** Respuesta de get_my_community, conservada para evitar formatos incompatibles. */
export type CommunityStatusData = Readonly<{
  can_create: boolean;
  has_profile: boolean;
  membership: CommunityMembership | null;
}>;

export type CommunityIdentity =
  | Readonly<{ status: 'loading'; userId: string; community: null; membership: null; error: null }>
  | Readonly<{ status: 'error'; userId: string; community: null; membership: null; error: string }>
  | Readonly<{ status: 'withoutCommunity'; userId: string; community: null; membership: null;
      hasProfile: boolean; canCreateCommunity: boolean; canInviteNeighbors: false; error: null }>
  | Readonly<{ status: 'member'; userId: string; community: Community; membership: CommunityMembership;
      hasProfile: boolean; canCreateCommunity: false; canInviteNeighbors: boolean; error: null }>;

// Solo se usa sobre la sesión ya comprobada por observeSession; no valida credenciales.
export function toSessionIdentity(input: {
  restoring: boolean;
  restoreError: string | null;
  user: { id: string; email?: string } | null;
}): SessionIdentity {
  if (input.restoring) return { status: 'loading', user: null, error: null };
  if (input.restoreError) return { status: 'error', user: null, error: input.restoreError };
  if (!input.user) return { status: 'signedOut', user: null, error: null };
  return { status: 'authenticated', user: { id: input.user.id, email: input.user.email }, error: null };
}

export function toCommunityIdentity(userId: string, input: {
  loading: boolean;
  error: string | null;
  data: CommunityStatusData | null;
}): CommunityIdentity {
  if (input.loading) return { status: 'loading', userId, community: null, membership: null, error: null };
  if (!input.data) return { status: 'error', userId, community: null, membership: null,
    error: input.error ?? 'No pudimos consultar tu comunidad.' };
  const data = input.data;
  const membership = data.membership;
  if (!membership) return { status: 'withoutCommunity', userId, community: null, membership: null,
    hasProfile: data.has_profile, canCreateCommunity: data.can_create && data.has_profile,
    canInviteNeighbors: false, error: null };
  if (membership.user_id !== userId || !membership.community_id || !data.has_profile
    || (membership.role !== 'representative' && membership.role !== 'member')) {
    return { status: 'error', userId, community: null, membership: null,
      error: 'No pudimos confirmar tu pertenencia. Actualiza la comunidad.' };
  }
  return { status: 'member', userId,
    community: { id: membership.community_id, name: membership.community_name },
    membership: { user_id: membership.user_id, community_id: membership.community_id,
      community_name: membership.community_name, role: membership.role, invite_code: membership.invite_code },
    hasProfile: data.has_profile, canCreateCommunity: false,
    canInviteNeighbors: data.can_create && membership.role === 'representative', error: null };
}
