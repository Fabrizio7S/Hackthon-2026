import { useEffect, useMemo, useRef, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

import { authErrorMessage, createAuthService, validateCredentials, type AccessMode } from './authService';

// Estado interno del módulo; no constituye todavía el contrato compartido del equipo.
export function useAuth(client: SupabaseClient) {
  const service = useMemo(() => createAuthService(client), [client]);
  const [session, setSession] = useState<Session | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const operation = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    let eventReceived = false;
    setRestoring(true);
    setRestoreError(null);
    setSession(null);
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      eventReceived = true;
      setSession(next);
      setRestoreError(null);
      setRestoring(false);
    });
    // Una lectura atrasada nunca debe sobrescribir un evento más reciente (p. ej. cierre).
    void client.auth.getSession().then(({ data, error: failure }) => {
      if (!active || eventReceived) return;
      if (failure) throw failure;
      setSession(data.session);
      setRestoring(false);
    }).catch(() => {
      if (!active || eventReceived) return;
      setSession(null);
      setRestoreError('No pudimos recuperar la sesión. Revisa tu conexión y vuelve a intentar.');
      setRestoring(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [client, attempt]);

  async function run(action: () => Promise<void>) {
    if (operation.current || restoring || restoreError) return false;
    operation.current = true;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      await action();
      return true;
    } catch (failure) {
      if (mounted.current) setError(authErrorMessage(failure));
      return false;
    } finally {
      operation.current = false;
      if (mounted.current) setPending(false);
    }
  }

  return {
    session, restoring, restoreError, pending, message, error,
    retry: () => setAttempt(value => value + 1),
    clearFeedback: () => { setMessage(null); setError(null); },
    submit: (mode: AccessMode, email: string, password: string) => {
      const validation = validateCredentials(email, password);
      if (validation) { setError(validation); return Promise.resolve(false); }
      return run(async () => {
        const next = await service.submit(mode, email, password);
        if (!mounted.current) return;
        if (mode === 'signUp' && !next) {
          setMessage('Revisa tu correo para confirmar el registro si corresponde. Luego intenta iniciar sesión.');
        }
        // La suscripción de Auth es la fuente de estado, también durante el registro.
      });
    },
    signOut: () => run(async () => {
      await service.signOut();
      if (mounted.current) setSession(null);
    }),
  };
}
