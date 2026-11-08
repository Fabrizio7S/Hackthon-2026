import { Pressable, Text, View } from 'react-native';
import { ProfilePanel } from '../../features/profile/components/ProfilePanel';
import { CommunityPanel } from '../../features/community/components/CommunityPanel';
import { colors } from '../../shared/theme';
import { AppIcon } from '../../shared/ui/AppIcon';
import { TourScrollView } from '../../shared/ui/tour/TourTargets';
import { styles } from '../../features/auth/styles/auth.styles';
import type { AppViewModel } from '../navigation/SessionRouter';

export function AccountScreen({ model }: { model: AppViewModel }) {
  const {
    identity,
    sessionActions,
    auth,
    communityVersion,
    setCommunityVersion,
    communityName,
    handleMembership,
    openEmergencies,
    client,
    setPassword,
    setEmail,
  } = model;
  return (
    <TourScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}
    >
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
            <Text style={styles.logoutButtonText}>
              {auth.pending ? 'Saliendo…' : 'Cerrar sesión'}
            </Text>
          </Pressable>
        </View>
        {auth.error && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {auth.error}
          </Text>
        )}
      </View>

      <View style={styles.emergencyCard}>
        <View style={styles.emergencyHead}>
          <View style={styles.emergencyIcon}>
            <AppIcon name="siren" size={22} color={colors.onDanger} />
          </View>
          <Text accessibilityRole="header" style={styles.emergencyTitle}>
            Emergencias y apoyo
          </Text>
        </View>
        <Text style={styles.emergencyText}>
          Reporta un problema en tu zona, mira las alertas de tu comunidad y encuentra recursos y
          grupos de apoyo.
        </Text>
        <View style={styles.emergencyActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reportar una emergencia"
            style={styles.emergencyPrimary}
            onPress={() => openEmergencies('reportar')}
          >
            <Text style={styles.emergencyPrimaryText}>Reportar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver alertas de la comunidad"
            style={styles.emergencySecondary}
            onPress={() => openEmergencies('alertas')}
          >
            <Text style={styles.emergencySecondaryText}>Ver alertas</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver recursos y grupos de apoyo"
            style={styles.emergencySecondary}
            onPress={() => openEmergencies('apoyo')}
          >
            <Text style={styles.emergencySecondaryText}>Recursos y grupos</Text>
          </Pressable>
        </View>
      </View>

      <ProfilePanel
        key={`profile:${identity.user.id}`}
        client={client}
        userId={identity.user.id}
        email={identity.user.email}
        onSaved={() => setCommunityVersion((value) => value + 1)}
      />

      <CommunityPanel
        key={`community:${identity.user.id}`}
        client={client}
        userId={identity.user.id}
        refreshVersion={communityVersion}
        onMembershipResolved={handleMembership}
      />
    </TourScrollView>
  );
}
