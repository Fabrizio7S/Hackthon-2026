import { useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { communityErrorMessage, createCommunityService, type CommunityStatus } from './communityService';

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

  async function create(name: string) {
    if (busy.current || loading || !data?.can_create || !data.has_profile || data.membership) return;
    const current = version.current;
    busy.current = true;
    setCreating(true);
    setError(null);
    try {
      const membership = await service.create(name);
      if (current === version.current) setData({ ...data, membership });
    } catch (failure) {
      if (current === version.current) setError(communityErrorMessage(failure));
    } finally {
      busy.current = false;
      if (mounted.current) {
        setCreating(false);
        // Si se guardó el perfil durante la creación, consultar de nuevo el resultado confirmado.
        if (current !== version.current) setAttempt(value => value + 1);
      }
    }
  }

  return { data, loading, creating, error, create,
    refresh: () => { if (!busy.current) setAttempt(value => value + 1); },
  };
}
