import { useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { communityErrorMessage, createCommunityService, type CommunityStatus } from './communityService';
import { toCommunityIdentity } from '../../shared/identity';

export function useCommunity(client: SupabaseClient, userId: string, refreshVersion: number) {
  const service = useMemo(() => createCommunityService(client, userId), [client, userId]);
  const [data, setData] = useState<CommunityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const version = useRef(0);
  const busy = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const current = ++version.current;
    setLoading(true);
    setError(null);
    setData(null);
    // Una recarga también cancela los resultados de una creación de la vista anterior.
    setCreating(busy.current);
    void service.load().then(next => {
      if (current === version.current) setData(next);
    }).catch(failure => {
      if (current === version.current) setError(communityErrorMessage(failure));
    }).finally(() => {
      if (current === version.current) setLoading(false);
    });
    return () => { version.current++; };
  }, [service, attempt, refreshVersion]);

  async function mutate(operation: () => Promise<CommunityStatus>) {
    if (busy.current || loading) return false;
    const current = version.current;
    busy.current = true;
    setCreating(true);
    setError(null);
    try {
      const next = await operation();
      if (current === version.current) setData(next);
      return true;
    } catch (failure) {
      if (current === version.current) setError(communityErrorMessage(failure));
      return false;
    } finally {
      busy.current = false;
      if (mounted.current) {
        setCreating(false);
        // Si se guardó el perfil durante la creación, consultar de nuevo el resultado confirmado.
        if (current !== version.current) setAttempt(value => value + 1);
      }
    }
  }

  async function create(name: string) {
    if (!data?.can_create || !data.has_profile || data.membership) return;
    await mutate(async () => ({ ...data, membership: await service.create(name) }));
  }

  async function joinByCode(code: string) {
    if (!data?.has_profile || data.membership) return;
    await mutate(async () => ({ ...data, membership: await service.joinByCode(code) }));
  }

  async function leave() {
    if (!data?.membership || data.membership.role !== 'member') return false;
    return mutate(async () => {
      await service.leave();
      return { ...data, membership: null };
    });
  }

  async function rename(name: string) {
    const membership = data?.membership;
    if (!data?.can_create || membership?.role !== 'representative') return false;
    return mutate(async () => ({ ...data, membership: { ...membership, community_name: await service.rename(name) } }));
  }

  const identity = useMemo(() => toCommunityIdentity(userId, { loading, error, data }), [userId, loading, error, data]);

  return { data, loading, creating, error, create, joinByCode, leave, rename, identity,
    refresh: () => { if (!busy.current) setAttempt(value => value + 1); },
  };
}
