import { InvitationCard } from './InvitationCard';
import { useInvitationPanel } from '../hooks/useInvitationPanel';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { formatPersonalCode } from '../data/invitationService';
import { colors } from '../../../shared/theme';
import { SkeletonPanel } from '../../../shared/ui/Skeleton';
import { TourTarget } from '../../../shared/ui/tour/TourTargets';
import { styles } from '../styles/invitation.styles';

export function InvitationPanel({
  client,
  canInvite,
  onMembershipChanged,
  onAcceptedListChanged,
}: {
  client: SupabaseClient;
  canInvite: boolean;
  onMembershipChanged: () => void;
  onAcceptedListChanged?: () => void;
}) {
  const model = useInvitationPanel({
    client,
    canInvite,
    onMembershipChanged,
    onAcceptedListChanged,
  });
  const { invitations, code, setCode, validation, setValidation, find } = model;
  return (
    <TourTarget id="community-invitations" style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        Invitaciones
      </Text>

      {invitations.loading ? (
        <SkeletonPanel lines={2} accessibilityLabel="Consultando invitaciones" />
      ) : (
        <>
          {invitations.error && (
            <Text style={styles.errorText} accessibilityRole="alert">
              {invitations.error}
            </Text>
          )}
          {invitations.message && (
            <View style={styles.messageBox}>
              <Text style={styles.messageText} accessibilityLiveRegion="polite">
                {invitations.message}
              </Text>
            </View>
          )}

          {canInvite && (
            <View style={styles.inviteSection}>
              <Text style={styles.label}>Invitar a un nuevo vecino por su código personal</Text>
              <TextInput
                accessibilityLabel="Código personal del vecino"
                style={styles.input}
                value={code}
                editable={!invitations.pending}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Ej. VEC-1A2B-3C4D"
                placeholderTextColor={colors.textMuted}
                onChangeText={(value) => {
                  setCode(value);
                  setValidation(null);
                  invitations.clearNeighbor();
                }}
                onSubmitEditing={() => {
                  void find();
                }}
              />
              {validation && (
                <Text style={styles.errorText} accessibilityRole="alert">
                  {validation}
                </Text>
              )}

              <Pressable
                style={[styles.buttonPrimary, invitations.pending && styles.buttonDisabled]}
                disabled={invitations.pending}
                onPress={() => {
                  void find();
                }}
              >
                <Text style={styles.buttonPrimaryText}>Buscar vecino</Text>
              </Pressable>

              {invitations.neighbor && (
                <View style={styles.neighborFoundCard}>
                  <Text style={styles.neighborName}>{invitations.neighbor.display_name}</Text>
                  <Text selectable style={styles.neighborCode}>
                    {formatPersonalCode(invitations.neighbor.personal_code)}
                  </Text>
                  <Pressable
                    style={[styles.buttonPrimary, invitations.pending && styles.buttonDisabled]}
                    disabled={invitations.pending}
                    onPress={() => {
                      if (invitations.neighbor)
                        void invitations.send(invitations.neighbor.personal_code);
                    }}
                  >
                    <Text style={styles.buttonPrimaryText}>Enviar invitación a la comunidad</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {invitations.pending && (
            <View style={styles.pendingRow}>
              <ActivityIndicator
                color={colors.primary}
                accessibilityLabel="Procesando invitación"
              />
              <Text style={styles.mutedText}>Procesando…</Text>
            </View>
          )}

          {!invitations.error && !invitations.items.length && (
            <Text style={styles.emptyText}>No tienes invitaciones pendientes ni enviadas.</Text>
          )}

          {invitations.items.map((item) => (
            <InvitationCard key={item.id} item={item} model={model} />
          ))}

          <Pressable
            style={styles.buttonOutline}
            disabled={invitations.pending}
            onPress={invitations.refresh}
          >
            <Text style={styles.buttonOutlineText}>Actualizar invitaciones</Text>
          </Pressable>
        </>
      )}
    </TourTarget>
  );
}
