import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizePersonalCode } from '../data/invitationService';
import { useInvitations } from './useInvitations';

export function useInvitationPanel({
  client,
  canInvite,
  onMembershipChanged,
  onAcceptedListChanged,
}: {
  client: SupabaseClient;
  canInvite: boolean;
  onMembershipChanged: () => void;
  onAcceptedListChanged?: () => void;
}) {
  const invitations = useInvitations(client);

  const [code, setCode] = useState('');

  const [validation, setValidation] = useState<string | null>(null);

  const acceptedKey = invitations.items
    .filter((item) => item.status === 'accepted')
    .map((item) => item.id)
    .sort()
    .join('|');

  useEffect(() => {
    if (acceptedKey) onAcceptedListChanged?.();
  }, [acceptedKey, onAcceptedListChanged]);

  async function find() {
    try {
      const normalized = normalizePersonalCode(code);
      setValidation(null);
      await invitations.find(normalized);
    } catch (failure) {
      setValidation(failure instanceof Error ? failure.message : 'Revisa el código.');
    }
  }
  return {
    invitations,
    code,
    setCode,
    validation,
    setValidation,
    find,
    canInvite,
    onMembershipChanged,
  };
}
export type InvitationPanelModel = ReturnType<typeof useInvitationPanel>;
