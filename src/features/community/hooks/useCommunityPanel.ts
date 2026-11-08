import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeCommunityName } from '../data/communityService';
import { useCommunity } from './useCommunity';
import type { CommunityRole } from '../../../shared/identity/contracts';
import { useTourTargets } from '../../../shared/ui/tour/TourTargets';

export function useCommunityPanel({
  client,
  userId,
  refreshVersion,
  onMembershipResolved,
}: {
  client: SupabaseClient;
  userId: string;
  refreshVersion: number;
  onMembershipResolved?: (
    isMember: boolean,
    communityName: string | null,
    role?: CommunityRole | null,
  ) => void;
}) {
  const community = useCommunity(client, userId, refreshVersion);

  const highlighted = useTourTargets();

  const identity = community.identity;

  const [name, setName] = useState('');

  const [newName, setNewName] = useState<string | null>(null);

  const [confirmLeave, setConfirmLeave] = useState(false);

  const [communityCode, setCommunityCode] = useState('');

  const [copiedInvite, setCopiedInvite] = useState(false);

  const [validation, setValidation] = useState<string | null>(null);

  const [membersVersion, setMembersVersion] = useState(0);

  const refreshMembers = useCallback(() => setMembersVersion((value) => value + 1), []);

  useEffect(() => {
    if (identity.status === 'member') {
      onMembershipResolved?.(true, identity.community.name, identity.membership.role);
    } else if (identity.status === 'withoutCommunity') {
      onMembershipResolved?.(false, null, null);
    }
  }, [identity, onMembershipResolved]);

  async function create() {
    try {
      const normalized = normalizeCommunityName(name);
      setValidation(null);
      await community.create(normalized);
    } catch (failure) {
      setValidation(
        failure instanceof Error ? failure.message : 'Revisa el nombre de la comunidad.',
      );
    }
  }

  async function saveName() {
    if (newName === null) return;
    try {
      const normalized = normalizeCommunityName(newName);
      setValidation(null);
      if (await community.rename(normalized)) setNewName(null);
    } catch (failure) {
      setValidation(
        failure instanceof Error ? failure.message : 'Revisa el nombre de la comunidad.',
      );
    }
  }
  return {
    community,
    highlighted,
    identity,
    name,
    setName,
    newName,
    setNewName,
    confirmLeave,
    setConfirmLeave,
    communityCode,
    setCommunityCode,
    copiedInvite,
    setCopiedInvite,
    validation,
    setValidation,
    membersVersion,
    refreshMembers,
    create,
    saveName,
    client,
    userId,
    refreshVersion,
  };
}
export type CommunityPanelModel = ReturnType<typeof useCommunityPanel>;
