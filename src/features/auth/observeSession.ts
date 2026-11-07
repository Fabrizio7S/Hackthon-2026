import type { Session, SupabaseClient } from '@supabase/supabase-js';

type SessionState =
  | { status: 'ready'; session: Session | null }
  | { status: 'error'; session: null };

// Estado interno, sin almacenamiento ni cambios de configuración del cliente.
export function observeSession(client: SupabaseClient, receive: (state: SessionState) => void) {
  let active = true;
  let eventReceived = false;
  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
    // getSession comunica los errores de inicialización; INITIAL_SESSION no debe ocultarlos.
    if (!active || event === 'INITIAL_SESSION') return;
    eventReceived = true;
    receive({ status: 'ready', session });
  });

  void client.auth.getSession().then(({ data, error }) => {
    if (!active || eventReceived) return;
    if (error) {
      receive({ status: 'error', session: null });
    } else {
      receive({ status: 'ready', session: data.session });
    }
  }).catch(() => {
    if (active && !eventReceived) receive({ status: 'error', session: null });
  });

  return () => {
    active = false;
    subscription.unsubscribe();
  };
}
