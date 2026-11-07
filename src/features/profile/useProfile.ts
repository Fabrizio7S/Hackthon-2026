import { useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createProfileService, profileErrorMessage, type Profile } from './profileService';

type State =
  | { status: 'loading'; profile: null }
  | { status: 'error'; profile: null }
  | { status: 'ready'; profile: Profile | null };

export function useProfile(client: SupabaseClient, userId: string) {
  const service = useMemo(() => createProfileService(client, userId), [client, userId]);
  const [state, setState] = useState<State>({ status: 'loading', profile: null });
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const version = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    const current = ++version.current;
    setState({ status: 'loading', profile: null });
    setError(null);
    setSaved(false);
    void service.load().then(profile => {
      if (current === version.current) setState({ status: 'ready', profile });
    }).catch(failure => {
      if (current !== version.current) return;
      setState({ status: 'error', profile: null });
      setError(profileErrorMessage(failure));
    });
    return () => { version.current++; };
  }, [service, attempt]);

  async function save(name: string) {
    if (busy.current || state.status !== 'ready') return;
    const current = version.current;
    busy.current = true;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const profile = await service.save(name);
      if (current !== version.current) return;
      setState({ status: 'ready', profile });
      setSaved(true);
    } catch (failure) {
      if (current === version.current) setError(profileErrorMessage(failure));
    } finally {
      busy.current = false;
      if (current === version.current) setSaving(false);
    }
  }

  return { ...state, saving, saved, error, save,
    retry: () => { if (!busy.current) setAttempt(value => value + 1); },
    clearSaved: () => setSaved(false),
  };
}
