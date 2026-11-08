import type { Session, SupabaseClient } from '@supabase/supabase-js';

type SessionState =
  | { status: 'checking'; session: null }
  | { status: 'ready'; session: Session | null }
  | { status: 'error'; session: null };

// Estado interno, sin almacenamiento ni cambios de configuración del cliente.
export function observeSession(client: SupabaseClient, receive: (state: SessionState) => void) {
  let active = true;
  let eventReceived = false;
  let version = 0;
  let verifiedUserId: string | null = null;

  async function verify(session: Session | null, expectedVersion: number) {
    if (!active || expectedVersion !== version) return;
    if (!session) {
      verifiedUserId = null;
      receive({ status: 'ready', session: null });
      return;
    }
    const isSameUser = verifiedUserId !== null && verifiedUserId === session.user.id;
    if (!isSameUser) {
      verifiedUserId = null;
      receive({ status: 'checking', session: null });
    }
    try {
      // JWT explícito evita adquirir el bloqueo de sesión dentro de un evento de Auth.
      const { data, error } = await client.auth.getUser(session.access_token);
      if (!active || expectedVersion !== version) return;
      if (error || !data.user || data.user.id !== session.user.id) {
        verifiedUserId = null;
        receive({ status: 'error', session: null });
      } else {
        verifiedUserId = data.user.id;
        receive({ status: 'ready', session: { ...session, user: data.user } });
      }
    } catch {
      if (active && expectedVersion === version) {
        verifiedUserId = null;
        receive({ status: 'error', session: null });
      }
    }
  }
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((event, session) => {
    // getSession comunica los errores de inicialización; INITIAL_SESSION no debe ocultarlos.
    if (!active || event === 'INITIAL_SESSION') return;
    eventReceived = true;
    void verify(session, ++version);
  });

  void client.auth
    .getSession()
    .then(({ data, error }) => {
      if (!active || eventReceived) return;
      if (error) {
        receive({ status: 'error', session: null });
      } else {
        void verify(data.session, version);
      }
    })
    .catch(() => {
      if (active && !eventReceived) receive({ status: 'error', session: null });
    });

  return () => {
    active = false;
    version++;
    subscription.unsubscribe();
  };
}
