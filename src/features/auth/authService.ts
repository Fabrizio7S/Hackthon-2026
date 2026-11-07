import type { SupabaseClient } from '@supabase/supabase-js';

export type AccessMode = 'signIn' | 'signUp';

export function validateCredentials(email: string, password: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Ingresa un correo válido.';
  }
  // La política de longitud y complejidad la aplica el proyecto de Supabase.
  if (!password.length) return 'Ingresa tu contraseña.';
  return null;
}

export function authErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code) : '';
  switch (code) {
    case 'invalid_credentials': return 'El correo o la contraseña no son correctos.';
    case 'email_not_confirmed': return 'Confirma tu correo antes de iniciar sesión.';
    case 'weak_password': return 'La contraseña no cumple los requisitos del servicio. Usa una más larga y combina letras, números y símbolos.';
    case 'user_already_exists': return 'No pudimos registrar esta cuenta. Intenta iniciar sesión.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit': return 'Hay demasiados intentos. Espera un momento y vuelve a intentar.';
    case 'signup_disabled': return 'El registro no está disponible en este momento.';
    case 'auth_busy': return 'Espera a que termine la solicitud actual.';
    default: return 'No pudimos completar la solicitud. Revisa tu conexión y vuelve a intentar.';
  }
}

// Recibe el cliente único en el punto de integración; no crea otro ni cambia su configuración.
export function createAuthService(client: SupabaseClient) {
  let busy = false;

  async function exclusive<T>(action: () => Promise<T>): Promise<T> {
    if (busy) throw { code: 'auth_busy' };
    busy = true;
    try { return await action(); } finally { busy = false; }
  }

  return {
    submit(mode: AccessMode, email: string, password: string) {
      return exclusive(async () => {
        const validation = validateCredentials(email, password);
        if (validation) throw new Error(validation);
        const credentials = { email: email.trim(), password };
        const { data, error } = mode === 'signUp'
          ? await client.auth.signUp(credentials)
          : await client.auth.signInWithPassword(credentials);
        if (error) throw error;
        return data.session;
      });
    },
    signOut() {
      return exclusive(async () => {
        const { error } = await client.auth.signOut({ scope: 'local' });
        if (error) throw error;
      });
    },
  };
}
