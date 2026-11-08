import type { SupabaseClient } from '@supabase/supabase-js';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useSessionActions, useSessionIdentity } from '../../shared/identity/IdentityContext';
import { colors } from '../../shared/theme';
import { styles } from '../../features/auth/styles/auth.styles';
import { AuthenticatedApp } from '../AuthenticatedApp';
import { useNeighborhoodNavigation } from './useNeighborhoodNavigation';
import { AccessForm } from '../../features/auth/components/AccessForm';
import { useAccessForm } from '../../features/auth/hooks/useAccessForm';
import type { SessionIdentity, SessionActions } from '../../shared/identity/contracts';

export function SessionRouter({
  client,
  auth,
}: {
  client: SupabaseClient;
  auth: ReturnType<typeof useAuth>;
}) {
  const identity = useSessionIdentity();
  const sessionActions = useSessionActions();
  const access = useAccessForm(auth);
  const navigation = useNeighborhoodNavigation(
    client,
    identity.status === 'authenticated' ? identity.user.id : null,
  );
  const { setPassword, setEmail } = access;
  if (identity.status === 'loading') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          accessibilityLabel="Recuperando sesión"
        />
      </View>
    );
  }

  if (identity.status === 'error') {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.card}>
          <Text style={styles.errorText} accessibilityRole="alert">
            {identity.error}
          </Text>
          {auth.error && (
            <Text style={styles.errorText} accessibilityRole="alert">
              {auth.error}
            </Text>
          )}
          <Pressable
            style={styles.buttonPrimary}
            disabled={auth.pending}
            onPress={sessionActions.retry}
          >
            <Text style={styles.buttonPrimaryText}>Reintentar conexión</Text>
          </Pressable>
          <Pressable
            style={styles.buttonOutline}
            disabled={auth.pending}
            onPress={() => {
              setPassword('');
              setEmail('');
              void sessionActions.signOut();
            }}
          >
            <Text style={styles.buttonOutlineText}>
              {auth.pending ? 'Cerrando sesión…' : 'Cerrar sesión guardada'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }
  if (identity.status === 'authenticated')
    return (
      <AuthenticatedApp
        model={{ ...navigation, identity, sessionActions, auth, setPassword, setEmail }}
      />
    );
  return <AccessForm model={{ ...access, auth }} />;
}

export type AppViewModel = ReturnType<typeof useNeighborhoodNavigation> &
  Pick<ReturnType<typeof useAccessForm>, 'setPassword' | 'setEmail'> & {
    identity: Extract<SessionIdentity, { status: 'authenticated' }>;
    sessionActions: SessionActions;
    auth: ReturnType<typeof useAuth>;
  };
