import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as Clipboard from 'expo-clipboard';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { normalizeDisplayName } from './profileService';
import { useProfile } from './useProfile';

export function ProfilePanel({ client, userId, email, onSaved }: {
  client: SupabaseClient;
  userId: string;
  email: string | undefined;
  onSaved?: () => void;
}) {
  const profile = useProfile(client, userId);
  const [name, setName] = useState('');
  const [validation, setValidation] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const copyBusy = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => { setName(profile.profile?.display_name ?? ''); }, [profile.profile]);

  async function copyCode() {
    if (!profile.profile || copyBusy.current) return;
    copyBusy.current = true;
    setCopying(true);
    setCopyMessage(null);
    try {
      const copied = await Clipboard.setStringAsync(profile.profile.personal_code);
      if (mounted.current) setCopyMessage(copied ? 'Código copiado.' : 'No se pudo copiar. Selecciona el código para copiarlo.');
    } catch {
      if (mounted.current) setCopyMessage('No se pudo copiar. Selecciona el código para copiarlo.');
    } finally {
      copyBusy.current = false;
      if (mounted.current) setCopying(false);
    }
  }

  async function save() {
    try {
      const normalized = normalizeDisplayName(name);
      setValidation(null);
      if (await profile.save(normalized)) onSaved?.();
    } catch (failure) {
      setValidation(failure instanceof Error ? failure.message : 'Revisa el nombre.');
    }
  }

  if (profile.status === 'loading') {
    return <View style={styles.section}><ActivityIndicator accessibilityLabel="Cargando perfil" /><Text>Cargando perfil…</Text></View>;
  }
  if (profile.status === 'error') {
    return <View style={styles.section}><Text accessibilityRole="alert">{profile.error}</Text><Button title="Reintentar perfil" onPress={profile.retry} /></View>;
  }
  return <View style={styles.section}>
    <Text accessibilityRole="header" style={styles.title}>Mi perfil</Text>
    <Text>Correo privado: {email ?? 'No disponible'}</Text>
    {!profile.profile && <Text>Completa tu nombre para obtener tu código personal.</Text>}
    <Text>Nombre visible</Text>
    <TextInput accessibilityLabel="Nombre visible" value={name} style={styles.input} editable={!profile.saving} autoComplete="name" onChangeText={value => {
      setName(value);
      setValidation(null);
      profile.clearSaved();
    }} onSubmitEditing={() => { void save(); }} />
    {validation && <Text accessibilityRole="alert">{validation}</Text>}
    {profile.error && <Text accessibilityRole="alert">{profile.error}</Text>}
    {profile.saved && <Text accessibilityLiveRegion="polite">Perfil guardado.</Text>}
    <Button title={profile.saving ? 'Guardando…' : 'Guardar perfil'} disabled={profile.saving} onPress={() => { void save(); }} />
    {profile.profile && <>
      <Text>Tu código personal</Text>
      <Text selectable style={styles.code}>{profile.profile.personal_code}</Text>
      <Text>Compártelo con el representante para recibir una invitación.</Text>
      <Button title={copying ? 'Copiando…' : 'Copiar código'} disabled={copying} onPress={() => { void copyCode(); }} />
      {copyMessage && <Text accessibilityLiveRegion="polite">{copyMessage}</Text>}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  title: { fontSize: 22, fontWeight: '600', color: '#111' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#666', borderRadius: 6, padding: 12, color: '#111' },
  code: { fontSize: 16, color: '#111' },
});
