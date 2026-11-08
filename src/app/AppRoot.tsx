import type { SupabaseClient } from '@supabase/supabase-js';
import { Text, View } from 'react-native';
import { useAuth } from '../features/auth/hooks/useAuth';
import { SessionIdentityProvider } from '../shared/identity/IdentityContext';
import { styles } from '../features/auth/styles/auth.styles';
import { SessionRouter } from './navigation/SessionRouter';

export function AppRoot({ client }: { client: SupabaseClient | null }) {
  if (!client) {
    return (
      <View style={styles.centerContainer}>
        <Text>
          No se ha configurado el servicio de acceso. Revisa las variables públicas de Supabase y
          reinicia Expo.
        </Text>
      </View>
    );
  }
  return <ConfiguredApp client={client} />;
}

function ConfiguredApp({ client }: { client: SupabaseClient }) {
  const auth = useAuth(client);
  return (
    <SessionIdentityProvider
      value={auth.identity}
      actions={{ signOut: auth.signOut, retry: auth.retry }}
    >
      <SessionRouter
        key={auth.identity.status === 'authenticated' ? auth.identity.user.id : 'guest'}
        client={client}
        auth={auth}
      />
    </SessionIdentityProvider>
  );
}
