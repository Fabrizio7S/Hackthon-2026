import { PersonalCodeCard } from './PersonalCodeCard';
import { ProfileNameForm } from './ProfileNameForm';
import { useProfileForm } from '../hooks/useProfileForm';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../shared/theme';
import { AppIcon } from '../../../shared/ui/AppIcon';
import { SkeletonPanel } from '../../../shared/ui/Skeleton';
import { styles } from '../styles/profile.styles';

export function ProfilePanel({
  client,
  userId,
  email,
  onSaved,
}: {
  client: SupabaseClient;
  userId: string;
  email: string | undefined;
  onSaved?: () => void;
}) {
  const model = useProfileForm({ client, userId, email, onSaved });
  const { profile, name } = model;
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
        <Text style={styles.errorText} accessibilityRole="alert">
          {profile.error}
        </Text>
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
          <Text accessibilityRole="header" style={styles.title}>
            {name.trim() || 'Mi perfil'}
          </Text>
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

      <ProfileNameForm model={model} />

      <PersonalCodeCard model={model} />
    </View>
  );
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
