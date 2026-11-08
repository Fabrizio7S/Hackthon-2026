import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as Clipboard from 'expo-clipboard';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatPersonalCode, normalizeDisplayName } from './profileService';
import { useProfile } from './useProfile';
import { archRadius, colors, fonts } from '../../shared/theme';
import { AppIcon } from '../../shared/AppIcon';
import { SkeletonPanel } from '../../shared/Skeleton';

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
  const displayCode = profile.profile ? formatPersonalCode(profile.profile.personal_code) : '';

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
      const copied = await Clipboard.setStringAsync(displayCode);
      if (mounted.current) setCopyMessage(copied ? `Código ${displayCode} copiado al portapapeles.` : 'No se pudo copiar.');
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
        <SkeletonPanel lines={3} accessibilityLabel="Cargando perfil" />
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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={styles.title}>{name.trim() || 'Mi perfil'}</Text>
          <View style={styles.badge}>
            <AppIcon name="verified" size={15} color={colors.primary} weight={2} />
            <Text style={styles.badgeText}>Vecino verificado</Text>
          </View>
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
            <Text style={styles.successText} accessibilityLiveRegion="polite">Perfil guardado con éxito.</Text>
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
        <View style={styles.codeWrap}>
          <View style={styles.codeTag}>
            <View style={styles.codeStub}>
              <View style={styles.codeHole} />
              <AppIcon name="key" size={22} color={colors.primaryDeep} />
            </View>
            <View style={styles.codeBody}>
              <Text style={styles.codeLabel}>Tu código vecinal corto</Text>
              <Text selectable style={styles.codeValue}>{displayCode}</Text>
              <Text style={styles.codeHelp}>Fácil de dictar o copiar. Compártelo con tu representante vecinal para unirte a la comunidad.</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            style={[styles.buttonOutline, copying && styles.buttonDisabled]}
            disabled={copying}
            onPress={() => { void copyCode(); }}
          >
            <AppIcon name="copy" size={18} color={colors.primary} weight={2} />
            <Text style={styles.buttonOutlineText}>{copying ? 'Copiando…' : 'Copiar código personal'}</Text>
          </Pressable>
          {copyMessage && <Text style={styles.copyHelpText} accessibilityLiveRegion="polite">{copyMessage}</Text>}
        </View>
      )}
    </View>
  );
}

/** Iniciales para el avatar en arco (máximo dos letras). */
function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('');
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 18,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 62,
    height: 70,
    ...archRadius(62, 10),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.lime,
    fontSize: 23,
    fontWeight: '800',
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: colors.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  emailText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  input: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
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
    borderRadius: 10,
    padding: 10,
  },
  successText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 48,
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
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    borderRadius: 14,
    minHeight: 46,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutlineText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  codeWrap: {
    gap: 10,
    marginTop: 2,
  },
  codeTag: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: colors.text,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  codeStub: {
    width: 58,
    backgroundColor: colors.lime,
    borderRightWidth: 1.5,
    borderRightColor: colors.text,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  codeHole: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.text,
    backgroundColor: colors.surface,
  },
  codeBody: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  codeLabel: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  codeValue: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.text,
    fontFamily: fonts.mono,
  },
  codeHelp: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
  },
  copyHelpText: {
    fontSize: 12.5,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
