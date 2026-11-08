import type { SupabaseClient } from '@supabase/supabase-js';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isPlaceholderName } from './profileService';
import { useProfile } from './useProfile';
import { colors } from '../../shared/theme';

/**
 * Aviso en Inicio para quien todavía figura con el nombre provisional «Vecino».
 * No aparece mientras carga ni cuando el perfil ya tiene un nombre propio.
 */
export function NamePrompt({ client, userId, onComplete }: {
  client: SupabaseClient;
  userId: string;
  onComplete: () => void;
}) {
  const profile = useProfile(client, userId);
  if (profile.status !== 'ready' || !profile.profile || !isPlaceholderName(profile.profile.display_name)) return null;

  return (
    <View accessibilityRole="alert" style={styles.box}>
      <Text style={styles.title}>Completa tu nombre</Text>
      <Text style={styles.copy}>
        Tus vecinos te ven como «Vecino». Escribe tu nombre para que puedan reconocerte al contactarte.
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Completar mi nombre en el perfil"
        onPress={onComplete} style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
        <Text style={styles.buttonText}>Completar mi nombre</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.warningSurface, borderWidth: 1, borderColor: colors.warningInk, borderRadius: 18, padding: 16, gap: 8 },
  title: { fontSize: 17, fontWeight: '800', color: colors.warningInk },
  copy: { fontSize: 14, lineHeight: 20, color: colors.text },
  button: { alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.onPrimary, fontSize: 14.5, fontWeight: '700' },
});
