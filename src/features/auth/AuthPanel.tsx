import { useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ActivityIndicator, BackHandler, Button, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import type { AccessMode } from './authService';
import { useAuth } from './useAuth';
import { ProfilePanel } from '../profile/ProfilePanel';
import { CommunityPanel } from '../community/CommunityPanel';
import { FavorsScreen } from '../favors/FavorsScreen';
import { EmergenciesScreen, type EmergenciesTab } from '../emergencies';
import { createOffersApi, ServicesFlowScreen } from '../services';
import { SessionIdentityProvider, useSessionActions, useSessionIdentity } from '../../shared/IdentityContext';
import { colors, fonts } from '../../shared/theme';
import { AppIcon } from '../../shared/AppIcon';

import { NeighborhoodShell, NeighborhoodHome, WelcomeStory, type NeighborhoodSection, type CreateAction } from '../../shared/NeighborhoodUI';
type MainSection = NeighborhoodSection;

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
  const { width } = useWindowDimensions();
  const sessionActions = useSessionActions();
  const [mode, setMode] = useState<AccessMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [communityVersion, setCommunityVersion] = useState(0);
  const [section, setSection] = useState<MainSection>('inicio');
  const [hasCommunity, setHasCommunity] = useState<boolean | null>(null);
  const [communityName, setCommunityName] = useState<string | null>(null);
  // Pestaña inicial de Emergencias; el contador fuerza a remontar la pantalla al usar los atajos.
  const [emergencyTab, setEmergencyTab] = useState<EmergenciesTab>('alertas');
  const [emergencyNonce, setEmergencyNonce] = useState(0);
  const [createIntent, setCreateIntent] = useState<CreateAction | null>(null);
  const [createNonce, setCreateNonce] = useState(0);
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

  function openEmergencies(tab: EmergenciesTab) {
    setEmergencyTab(tab);
    setEmergencyNonce(value => value + 1);
    setSection('emergencias');
  }

  function navigateSection(next: MainSection) {
    setCreateIntent(null);
    if (next === 'emergencias') openEmergencies('alertas');
    else setSection(next);
  }

  function openCreate(action: CreateAction) {
    setCreateIntent(action);
    setCreateNonce(value => value + 1);
    if (action === 'emergency') openEmergencies('reportar');
    else setSection(action === 'service' ? 'servicios' : 'favores');
  }

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
      <NeighborhoodShell onCreate={openCreate} section={section} communityName={communityName} onNavigate={navigateSection}>
        {section === 'inicio' ? (
          <NeighborhoodHome communityName={communityName} onNavigate={navigateSection}>
            <CommunityPanel key={identity.user.id} client={client} userId={identity.user.id} refreshVersion={communityVersion} onMembershipResolved={(isMember, name) => { setHasCommunity(isMember); setCommunityName(name); }} />
          </NeighborhoodHome>
        ) : section !== 'comunidad' && section !== 'emergencias' && hasCommunity === false ? (
          <View style={styles.centerContainer}>
            <View style={styles.card}>
              <View style={styles.gateArch}><AppIcon name="people" size={30} color={colors.primary} /></View>
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
          <ServicesFlowScreen key={`services:${identity.user.id}:${createNonce}`} api={offersApi} initialTab={createIntent === 'service' ? 'publicar' : 'explorar'} />
        ) : section === 'mapa' ? (
          <ServicesFlowScreen key={`map:${identity.user.id}`} api={offersApi} initialTab="mapa" />
        ) : section === 'favores' ? (
          <FavorsScreen key={`favors:${identity.user.id}:${createNonce}`} client={client} initialCreating={createIntent === 'favor'} />
        ) : section === 'emergencias' ? (
          <EmergenciesScreen
            key={`emergencies:${identity.user.id}:${emergencyNonce}`}
            client={client}
            userId={identity.user.id}
            initialTab={emergencyTab}
            onOpenServices={() => setSection('servicios')}
            onGoToCommunity={() => setSection('comunidad')}
          />
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
            <View style={styles.sessionCard}>
              <View style={styles.sessionHeaderRow}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionLabel} numberOfLines={1}>
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
                  <AppIcon name="logout" size={16} color={colors.danger} weight={2} />
                  <Text style={styles.logoutButtonText}>{auth.pending ? 'Saliendo…' : 'Cerrar sesión'}</Text>
                </Pressable>
              </View>
              {auth.error && <Text style={styles.errorText} accessibilityRole="alert">{auth.error}</Text>}
            </View>

            <View style={styles.emergencyCard}>
              <View style={styles.emergencyHead}>
                <View style={styles.emergencyIcon}><AppIcon name="siren" size={22} color={colors.onDanger} /></View>
                <Text accessibilityRole="header" style={styles.emergencyTitle}>Emergencias y apoyo</Text>
              </View>
              <Text style={styles.emergencyText}>
                Reporta un problema en tu zona, mira las alertas de tu comunidad y encuentra recursos y grupos de apoyo.
              </Text>
              <View style={styles.emergencyActions}>
                <Pressable accessibilityRole="button" accessibilityLabel="Reportar una emergencia" style={styles.emergencyPrimary} onPress={() => openEmergencies('reportar')}>
                  <Text style={styles.emergencyPrimaryText}>Reportar</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Ver alertas de la comunidad" style={styles.emergencySecondary} onPress={() => openEmergencies('alertas')}>
                  <Text style={styles.emergencySecondaryText}>Ver alertas</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Ver recursos y grupos de apoyo" style={styles.emergencySecondary} onPress={() => openEmergencies('apoyo')}>
                  <Text style={styles.emergencySecondaryText}>Recursos y grupos</Text>
                </Pressable>
              </View>
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
      </NeighborhoodShell>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.centerContainer, { alignItems: 'center' }]}>
        <View style={{ width: '100%', maxWidth: 1120, gap: 32, flexDirection: width >= 900 ? 'row' : 'column', alignItems: 'center' }}>
        <WelcomeStory />
        <View style={[styles.authCard, width >= 900 && { flex: 1 }]}>
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
  scrollContent: { padding: 16, gap: 16, backgroundColor: colors.surface, paddingBottom: 40, width: '100%', maxWidth: 820, alignSelf: 'center' },
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
  navTabEmergency: {
    borderColor: colors.danger,
  },
  navTabEmergencyActive: {
    backgroundColor: colors.dangerSurface,
  },
  navTabTextEmergency: {
    color: colors.danger,
  },
  navTabTextEmergencyActive: {
    fontWeight: '800',
    color: colors.danger,
  },
  emergencyCard: { backgroundColor: colors.dangerSurface, borderRadius: 20, padding: 16, gap: 10 },
  emergencyTitle: { fontSize: 18, fontWeight: '800', color: colors.dangerInk, letterSpacing: -0.3 },
  emergencyText: { fontSize: 14, lineHeight: 20, color: colors.dangerInk },
  emergencyHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emergencyIcon: { width: 40, height: 44, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  gateArch: { width: 64, height: 72, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, backgroundColor: colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  emergencyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emergencyPrimary: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.danger },
  emergencyPrimaryText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  emergencySecondary: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.danger, backgroundColor: '#FFFDFB' },
  emergencySecondaryText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  sessionCard: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 14, gap: 8 },
  sessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionLabel: { fontFamily: fonts.mono, fontSize: 11, fontWeight: '600', letterSpacing: 1, color: colors.primary, textTransform: 'uppercase' },
  sessionEmail: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 2 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.dangerBorder, backgroundColor: colors.background, borderRadius: 12, minHeight: 44, paddingHorizontal: 12 },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 22, gap: 14, width: '100%', maxWidth: 520, alignSelf: 'center' },
  authCard: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 24, padding: 24, gap: 16, maxWidth: 480, width: '100%', alignSelf: 'center' },
  authTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.7, color: colors.text },
  authSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: -8, marginBottom: 4 },
  fieldGroup: {
    gap: 6,
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: { minHeight: 50, borderWidth: 1.5, borderColor: colors.borderStrong, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, backgroundColor: colors.background },
  buttonPrimary: { backgroundColor: colors.primary, borderRadius: 16, minHeight: 54, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  buttonPrimaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  buttonOutline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.background, borderRadius: 16, minHeight: 50, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  buttonOutlineText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
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
  errorBox: { backgroundColor: colors.dangerSurface, borderRadius: 12, padding: 12 },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    lineHeight: 18,
  },
  messageBox: { backgroundColor: colors.primarySurface, borderRadius: 12, padding: 12 },
  messageText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 18,
  },
});
