import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ActivityIndicator, BackHandler, Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AccessMode } from './authService';
import { useAuth } from './useAuth';
import { ProfilePanel } from '../profile/ProfilePanel';
import { CommunityPanel } from '../community/CommunityPanel';

// Una sola fuente de sesión para el flujo de acceso montado en App.tsx.
export function AuthPanel({ client }: { client: SupabaseClient | null }) {
  if (!client) {
    return <View style={styles.container}><Text>No se ha configurado el servicio de acceso. Revisa las variables públicas de Supabase y reinicia Expo.</Text></View>;
  }
  return <ConfiguredAuthPanel client={client} />;
}

function ConfiguredAuthPanel({ client }: { client: SupabaseClient }) {
  const auth = useAuth(client);
  const [mode, setMode] = useState<AccessMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [communityVersion, setCommunityVersion] = useState(0);

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

  if (auth.restoring) {
    return <View style={styles.container}><ActivityIndicator accessibilityLabel="Recuperando sesión" /><Text>Recuperando sesión…</Text></View>;
  }
  if (auth.restoreError) {
    return <View style={styles.container}>
      <Text accessibilityRole="alert">{auth.restoreError}</Text>
      {auth.error && <Text accessibilityRole="alert">{auth.error}</Text>}
      <Button title="Reintentar" disabled={auth.pending} onPress={auth.retry} />
      <Button title={auth.pending ? 'Cerrando sesión…' : 'Cerrar sesión guardada'} disabled={auth.pending} onPress={() => {
        setPassword('');
        setEmail('');
        void auth.signOut();
      }} />
    </View>;
  }
  if (auth.session) {
    return (
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>Sesión iniciada</Text>
        <Text>{auth.session.user.email}</Text>
        <ProfilePanel key={auth.session.user.id} client={client} userId={auth.session.user.id} email={auth.session.user.email}
          onSaved={() => setCommunityVersion(value => value + 1)} />
        <CommunityPanel key={auth.session.user.id} client={client} userId={auth.session.user.id} refreshVersion={communityVersion} />
        {auth.error && <Text accessibilityRole="alert">{auth.error}</Text>}
        <Button title={auth.pending ? 'Cerrando sesión…' : 'Cerrar sesión'} disabled={auth.pending} onPress={() => {
          setPassword('');
          setEmail('');
          void auth.signOut();
        }} />
      </ScrollView>
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
});
