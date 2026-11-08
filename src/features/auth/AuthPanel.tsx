import { useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ActivityIndicator, BackHandler, Button, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AccessMode } from './authService';
import { useAuth } from './useAuth';
import { ProfilePanel } from '../profile/ProfilePanel';
import { CommunityPanel } from '../community/CommunityPanel';
import { createOffersApi, ServicesFlowScreen } from '../services';
import { SessionIdentityProvider, useSessionActions, useSessionIdentity } from '../../shared/IdentityContext';

type MainSection = 'comunidad' | 'servicios';

// Una sola fuente de sesión para el flujo de acceso montado en App.tsx.
export function AuthPanel({ client }: { client: SupabaseClient | null }) {
  if (!client) {
    return <View style={styles.container}><Text>No se ha configurado el servicio de acceso. Revisa las variables públicas de Supabase y reinicia Expo.</Text></View>;
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
    return <View style={styles.container}><ActivityIndicator accessibilityLabel="Recuperando sesión" /><Text>Recuperando sesión…</Text></View>;
  }
  if (identity.status === 'error') {
    return <View style={styles.container}>
      <Text accessibilityRole="alert">{identity.error}</Text>
      {auth.error && <Text accessibilityRole="alert">{auth.error}</Text>}
      <Button title="Reintentar" disabled={auth.pending} onPress={sessionActions.retry} />
      <Button title={auth.pending ? 'Cerrando sesión…' : 'Cerrar sesión guardada'} disabled={auth.pending} onPress={() => {
        setPassword('');
        setEmail('');
        void sessionActions.signOut();
      }} />
    </View>;
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
              Comunidad y Perfil
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: section === 'servicios' }}
            style={[styles.navTab, section === 'servicios' && styles.navTabActive]}
            onPress={() => setSection('servicios')}
          >
            <Text style={[styles.navTabText, section === 'servicios' && styles.navTabTextActive]}>
              Servicios y Productos
            </Text>
          </Pressable>
        </View>
        {section === 'servicios' ? (
          <ServicesFlowScreen key={`services:${identity.user.id}`} api={offersApi} />
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
            <Text accessibilityRole="header" style={styles.title}>Sesión iniciada</Text>
            <Text>{identity.user.email}</Text>
            <ProfilePanel key={`profile:${identity.user.id}`} client={client} userId={identity.user.id} email={identity.user.email}
              onSaved={() => setCommunityVersion(value => value + 1)} />
            <CommunityPanel key={`community:${identity.user.id}`} client={client} userId={identity.user.id} refreshVersion={communityVersion} />
            {auth.error && <Text accessibilityRole="alert">{auth.error}</Text>}
            <Button title={auth.pending ? 'Cerrando sesión…' : 'Cerrar sesión'} disabled={auth.pending} onPress={() => {
              setPassword('');
              setEmail('');
              void sessionActions.signOut();
            }} />
          </ScrollView>
        )}
      </View>
    );
  }
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>{mode === 'signIn' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>
        <Text>Correo electrónico</Text>
        <TextInput accessibilityLabel="Correo electrónico" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" editable={!auth.pending} />
        <Text>Contraseña</Text>
        <TextInput accessibilityLabel="Contraseña" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'} editable={!auth.pending} onSubmitEditing={() => { void submit(); }} />
        {auth.error && <Text accessibilityRole="alert">{auth.error}</Text>}
        {auth.message && <Text accessibilityLiveRegion="polite">{auth.message}</Text>}
        <Button title={auth.pending ? 'Enviando…' : mode === 'signIn' ? 'Entrar' : 'Registrarme'} disabled={auth.pending} onPress={() => { void submit(); }} />
        <Button title={mode === 'signIn' ? 'Quiero crear una cuenta' : 'Ya tengo cuenta'} disabled={auth.pending} onPress={() => {
          setMode(mode === 'signIn' ? 'signUp' : 'signIn');
          setPassword('');
          auth.clearFeedback();
        }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '600', color: '#111' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#666', borderRadius: 6, padding: 12, color: '#111' },
  navBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#d0d7de',
    backgroundColor: '#f6f8fa',
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d7de',
    backgroundColor: '#fff',
  },
  navTabActive: {
    borderColor: '#0969da',
    backgroundColor: '#ddf4ff',
  },
  navTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#24292f',
  },
  navTabTextActive: {
    fontWeight: '700',
    color: '#0969da',
  },
});
