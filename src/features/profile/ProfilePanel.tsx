import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as Clipboard from 'expo-clipboard';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { normalizeDisplayName } from './profileService';
import { useProfile } from './useProfile';
import { colors } from '../../shared/theme';

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
      if (mounted.current) setCopyMessage(copied ? 'Código copiado al portapapeles.' : 'No se pudo copiar.');
    } catch {
      if (mounted.current) setCopyMessage('No se pudo copiar automáticamente.');
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
    return (
      <View style={styles.card}>
        <ActivityIndicator color={colors.primary} accessibilityLabel="Cargando perfil" />
        <Text style={styles.mutedText}>Cargando perfil…</Text>
      </View>
    );
  }

  if (profile.status === 'error') {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText} accessibilityRole="alert">{profile.error}</Text>
        <Pressable style={styles.buttonOutline} onPress={profile.retry}>
          <Text style={styles.buttonOutlineText}>Reintentar perfil</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={styles.title}>Mi perfil</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Vecino verificado</Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Correo de la cuenta</Text>
        <Text style={styles.emailText}>{email ?? 'No disponible'}</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nombre visible para los vecinos</Text>
        <TextInput
          accessibilityLabel="Nombre visible"
          value={name}
          style={styles.input}
          editable={!profile.saving}
          autoComplete="name"
          placeholder="Tu nombre completo o de confianza"
          placeholderTextColor={colors.textMuted}
          onChangeText={value => {
            setName(value);
            setValidation(null);
            profile.clearSaved();
          }}
          onSubmitEditing={() => { void save(); }}
        />
        {validation && <Text style={styles.errorText} accessibilityRole="alert">{validation}</Text>}
        {profile.error && <Text style={styles.errorText} accessibilityRole="alert">{profile.error}</Text>}
        {profile.saved && (
          <View style={styles.successBox}>
            <Text style={styles.successText} accessibilityLiveRegion="polite">✓ Perfil guardado con éxito.</Text>
          </View>
        )}
      </View>

      <Pressable
        style={[styles.buttonPrimary, profile.saving && styles.buttonDisabled]}
        disabled={profile.saving}
        onPress={() => { void save(); }}
      >
        <Text style={styles.buttonPrimaryText}>{profile.saving ? 'Guardando…' : 'Guardar perfil'}</Text>
      </Pressable>

      {profile.profile && (
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Tu código personal único</Text>
          <Text selectable style={styles.codeValue}>{profile.profile.personal_code}</Text>
          <Text style={styles.codeHelp}>Compártelo con tu representante vecinal para que te invite a la comunidad.</Text>

          <Pressable
            style={[styles.buttonOutline, copying && styles.buttonDisabled]}
            disabled={copying}
            onPress={() => { void copyCode(); }}
          >
            <Text style={styles.buttonOutlineText}>{copying ? 'Copiando…' : '📋 Copiar código personal'}</Text>
          </Pressable>
          {copyMessage && <Text style={styles.copyHelpText} accessibilityLiveRegion="polite">{copyMessage}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.primarySurface,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  emailText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  mutedText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  successBox: {
    backgroundColor: colors.primarySurface,
    borderRadius: 6,
    padding: 8,
  },
  successText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutlineText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  codeContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeHelp: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  copyHelpText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

