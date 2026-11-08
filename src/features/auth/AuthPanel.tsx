import { useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ActivityIndicator, BackHandler, Button, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AccessMode } from './authService';
import { useAuth } from './useAuth';
import { ProfilePanel } from '../profile/ProfilePanel';
import { CommunityPanel } from '../community/CommunityPanel';
import { FavorsScreen } from '../favors/FavorsScreen';
import { createOffersApi, ServicesFlowScreen } from '../services';
import { SessionIdentityProvider, useSessionActions, useSessionIdentity } from '../../shared/IdentityContext';
import { colors } from '../../shared/theme';

type MainSection = 'comunidad' | 'servicios' | 'favores';

// Una sola fuente de sesión para el flujo de acceso montado en App.tsx.
export function AuthPanel({ client }: { client: SupabaseClient | null }) {
  if (!client) {
    return <View style={styles.centerContainer}><Text>No se ha configurado el servicio de acceso. Revisa las variables públicas de Supabase y reinicia Expo.</Text></View>;
  }
  return <ConfiguredAuthPanel client={client} />;
}

function ConfiguredAuthPanel({ client }: { client: SupabaseClient }) {
  const auth = useAuth(client);
  return <SessionIdentityProvider value={auth.identity} actions={{ signOut: auth.signOut, retry: auth.retry }}>
    <AuthContent client={client} auth={auth} />
  </SessionIdentityProvider>;
}

function AuthContent({ client, auth }: { client: SupabaseClient; auth: ReturnType<typeof useAuth> }) {
  const identity = useSessionIdentity();
  const sessionActions = useSessionActions();
  const [mode, setMode] = useState<AccessMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [communityVersion, setCommunityVersion] = useState(0);
  const [section, setSection] = useState<MainSection>('comunidad');
  const [hasCommunity, setHasCommunity] = useState<boolean | null>(null);
  const [communityName, setCommunityName] = useState<string | null>(null);
  const offersApi = useMemo(() => createOffersApi(client), [client]);

  useEffect(() => {
    if (mode !== 'signUp' || auth.session) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!auth.pending) {
        setMode('signIn');
        setPassword('');
        auth.clearFeedback();
      }
      return true;
    });
    return () => subscription.remove();
  }, [mode, auth.session, auth.pending, auth.clearFeedback]);

  async function submit() {
    if (await auth.submit(mode, email, password)) setPassword('');
  }

  if (identity.status === 'loading') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Recuperando sesión" />
        <Text style={styles.mutedText}>Recuperando sesión…</Text>
      </View>
    );
  }
  if (identity.status === 'error') {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.card}>
          <Text style={styles.errorText} accessibilityRole="alert">{identity.error}</Text>
          {auth.error && <Text style={styles.errorText} accessibilityRole="alert">{auth.error}</Text>}
          <Pressable style={styles.buttonPrimary} disabled={auth.pending} onPress={sessionActions.retry}>
            <Text style={styles.buttonPrimaryText}>Reintentar conexión</Text>
          </Pressable>
          <Pressable style={styles.buttonOutline} disabled={auth.pending} onPress={() => {
            setPassword('');
            setEmail('');
            void sessionActions.signOut();
          }}>
            <Text style={styles.buttonOutlineText}>{auth.pending ? 'Cerrando sesión…' : 'Cerrar sesión guardada'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  if (identity.status === 'authenticated') {
    return (
      <View style={styles.root}>
        <View style={styles.navBar} accessibilityRole="tablist">
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: section === 'comunidad' }}
            style={[styles.navTab, section === 'comunidad' && styles.navTabActive]}
            onPress={() => setSection('comunidad')}
          >
            <Text style={[styles.navTabText, section === 'comunidad' && styles.navTabTextActive]}>
              Comunidad
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: section === 'servicios' }}
            style={[styles.navTab, section === 'servicios' && styles.navTabActive]}
            onPress={() => setSection('servicios')}
          >
            <Text style={[styles.navTabText, section === 'servicios' && styles.navTabTextActive]}>
              Servicios
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: section === 'favores' }}
            style={[styles.navTab, section === 'favores' && styles.navTabActive]}
            onPress={() => setSection('favores')}
          >
            <Text style={[styles.navTabText, section === 'favores' && styles.navTabTextActive]}>
              Favores
            </Text>
          </Pressable>
        </View>

        {section !== 'comunidad' && hasCommunity === false ? (
          <View style={styles.centerContainer}>
            <View style={styles.card}>
              <Text style={styles.authTitle} accessibilityRole="header">
                Únete a una comunidad primero
              </Text>
              <Text style={styles.mutedText}>
                Para explorar y publicar servicios, productos y favores de tus vecinos, primero debes pertenecer a una comunidad de tu cuadra.
              </Text>
              <Pressable
                style={styles.buttonPrimary}
                onPress={() => setSection('comunidad')}
              >
                <Text style={styles.buttonPrimaryText}>Ir a Comunidad</Text>
              </Pressable>
            </View>
          </View>
        ) : section === 'servicios' ? (
          <ServicesFlowScreen key={`services:${identity.user.id}`} api={offersApi} />
        ) : section === 'favores' ? (
          <FavorsScreen key={`favors:${identity.user.id}`} client={client} />
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
            <View style={styles.sessionCard}>
              <View style={styles.sessionHeaderRow}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionLabel}>
                    {communityName ? `Comunidad: ${communityName}` : 'Cuenta activa'}
                  </Text>
                  <Text style={styles.sessionEmail}>{identity.user.email}</Text>
                </View>
                <Pressable
                  style={styles.logoutButton}
                  disabled={auth.pending}
                  onPress={() => {
                    setPassword('');
                    setEmail('');
                    void sessionActions.signOut();
                  }}
                >
                  <Text style={styles.logoutButtonText}>{auth.pending ? 'Saliendo…' : 'Cerrar sesión'}</Text>
                </Pressable>
              </View>
              {auth.error && <Text style={styles.errorText} accessibilityRole="alert">{auth.error}</Text>}
            </View>

            <ProfilePanel
              key={`profile:${identity.user.id}`}
              client={client}
              userId={identity.user.id}
              email={identity.user.email}
              onSaved={() => setCommunityVersion(value => value + 1)}
            />

            <CommunityPanel
              key={`community:${identity.user.id}`}
              client={client}
              userId={identity.user.id}
              refreshVersion={communityVersion}
              onMembershipResolved={(isMember, name) => {
                setHasCommunity(isMember);
                setCommunityName(name);
              }}
            />
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.centerContainer}>
        <View style={styles.authCard}>
          <Text accessibilityRole="header" style={styles.authTitle}>
            {mode === 'signIn' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Text>
          <Text style={styles.authSubtitle}>Red de apoyo, productos y servicios vecinales</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              accessibilityLabel="Correo electrónico"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              placeholder="tu@correo.com"
              placeholderTextColor={colors.textMuted}
              editable={!auth.pending}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              accessibilityLabel="Contraseña"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              editable={!auth.pending}
              onSubmitEditing={() => { void submit(); }}
            />
          </View>

          {auth.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} accessibilityRole="alert">{auth.error}</Text>
            </View>
          )}

          {auth.message && (
            <View style={styles.messageBox}>
              <Text style={styles.messageText} accessibilityLiveRegion="polite">{auth.message}</Text>
            </View>
          )}

          <Pressable
            style={[styles.buttonPrimary, auth.pending && styles.buttonDisabled]}
            disabled={auth.pending}
            onPress={() => { void submit(); }}
          >
            <Text style={styles.buttonPrimaryText}>
              {auth.pending ? 'Enviando…' : mode === 'signIn' ? 'Entrar a mi red vecinal' : 'Crear mi cuenta'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.buttonSwitch}
            disabled={auth.pending}
            onPress={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setPassword('');
              auth.clearFeedback();
            }}
          >
            <Text style={styles.buttonSwitchText}>
              {mode === 'signIn' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    backgroundColor: colors.surface,
    paddingBottom: 40,
  },
  navBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  navTabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  navTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  navTabTextActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  sessionCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  sessionEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 20,
    gap: 14,
  },
  authCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 24,
    gap: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonOutline: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutlineText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonSwitch: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  buttonSwitchText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  mutedText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: colors.dangerSurface,
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    lineHeight: 18,
  },
  messageBox: {
    backgroundColor: colors.primarySurface,
    borderRadius: 8,
    padding: 10,
  },
  messageText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 18,
  },
});
