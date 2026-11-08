import { useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  createInvitationService,
  invitationErrorMessage,
  type Invitation,
  type Neighbor,
} from '../data/invitationService';

export function useInvitations(client: SupabaseClient) {
  const service = useMemo(() => createInvitationService(client), [client]);
  const [items, setItems] = useState<Invitation[]>([]);
  const [neighbor, setNeighbor] = useState<Neighbor | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const version = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    const current = ++version.current;
    setLoading(true);
    setError(null);
    setItems([]);
    setNeighbor(null);
    setMessage(null);
    void service
      .load()
      .then((next) => {
        if (current === version.current) setItems(next);
      })
      .catch((failure) => {
        if (current === version.current) setError(invitationErrorMessage(failure));
      })
      .finally(() => {
        if (current === version.current) setLoading(false);
      });
    return () => {
      version.current++;
    };
  }, [service, attempt]);

  async function run<T>(
    action: () => Promise<T>,
    completed: (value: T) => void,
  ): Promise<T | null> {
    if (busy.current || loading) return null;
    const current = version.current;
    busy.current = true;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await action();
      if (current !== version.current) return null;
      completed(result);
      return result;
    } catch (failure) {
      if (current === version.current) setError(invitationErrorMessage(failure));
      return null;
    } finally {
      busy.current = false;
      if (current === version.current) setPending(false);
    }
  }

  function replace(invitation: Invitation) {
    setItems((previous) => [invitation, ...previous.filter((item) => item.id !== invitation.id)]);
  }

  return {
    items,
    neighbor,
    loading,
    pending,
    error,
    message,
    refresh: () => {
      if (!busy.current) setAttempt((value) => value + 1);
    },
    clearNeighbor: () => {
      setNeighbor(null);
      setMessage(null);
    },
    find: (code: string) => {
      setNeighbor(null);
      return run(
        () => service.find(code),
        (result) => {
          setNeighbor(result);
          if (!result) setMessage('No encontramos un vecino con ese código.');
        },
      );
    },
    send: (code: string) =>
      run(
        () => service.send(code),
        (result) => {
          replace(result);
          setNeighbor(null);
          setMessage('Invitación pendiente de respuesta.');
        },
      ),
    process: (id: string, accept: boolean) =>
      run(
        () => service.process(id, accept),
        (result) => {
          replace(result);
          setMessage(
            result.status === 'accepted'
              ? 'Invitación aceptada.'
              : result.status === 'rejected'
                ? 'Invitación rechazada.'
                : 'La invitación continúa pendiente.',
          );
        },
      ),
  };
}
