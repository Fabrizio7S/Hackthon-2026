import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { normalizePersonalCode } from './invitationService';
import { useInvitations } from './useInvitations';
import { colors } from '../../shared/theme';

export function InvitationPanel({ client, canInvite, onMembershipChanged, onAcceptedListChanged }: {
  client: SupabaseClient;
  canInvite: boolean;
  onMembershipChanged: () => void;
  onAcceptedListChanged?: () => void;
}) {
  const invitations = useInvitations(client);
  const [code, setCode] = useState('');
  const [validation, setValidation] = useState<string | null>(null);
  const acceptedKey = invitations.items.filter(item => item.status === 'accepted').map(item => item.id).sort().join('|');

  useEffect(() => {
    if (acceptedKey) onAcceptedListChanged?.();
  }, [acceptedKey, onAcceptedListChanged]);

  async function find() {
    try {
      const normalized = normalizePersonalCode(code);
      setValidation(null);
      await invitations.find(normalized);
    } catch (failure) {
      setValidation(failure instanceof Error ? failure.message : 'Revisa el código.');
    }
  }

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>Invitaciones</Text>

      {invitations.loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} accessibilityLabel="Consultando invitaciones" />
          <Text style={styles.mutedText}>Consultando invitaciones…</Text>
        </View>
      ) : (
        <>
          {invitations.error && <Text style={styles.errorText} accessibilityRole="alert">{invitations.error}</Text>}
          {invitations.message && (
            <View style={styles.messageBox}>
              <Text style={styles.messageText} accessibilityLiveRegion="polite">{invitations.message}</Text>
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
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Pega el código personal (UUID con guiones)"
                placeholderTextColor={colors.textMuted}
                onChangeText={value => {
                  setCode(value);
                  setValidation(null);
                  invitations.clearNeighbor();
                }}
                onSubmitEditing={() => { void find(); }}
              />
              {validation && <Text style={styles.errorText} accessibilityRole="alert">{validation}</Text>}

              <Pressable
                style={[styles.buttonPrimary, invitations.pending && styles.buttonDisabled]}
                disabled={invitations.pending}
                onPress={() => { void find(); }}
              >
                <Text style={styles.buttonPrimaryText}>🔍 Buscar vecino</Text>
              </Pressable>

              {invitations.neighbor && (
                <View style={styles.neighborFoundCard}>
                  <Text style={styles.neighborName}>{invitations.neighbor.display_name}</Text>
                  <Text selectable style={styles.neighborCode}>{invitations.neighbor.personal_code}</Text>
                  <Pressable
                    style={[styles.buttonPrimary, invitations.pending && styles.buttonDisabled]}
                    disabled={invitations.pending}
                    onPress={() => {
                      if (invitations.neighbor) void invitations.send(invitations.neighbor.personal_code);
                    }}
                  >
                    <Text style={styles.buttonPrimaryText}>✉ Enviar invitación a la comunidad</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {invitations.pending && (
            <View style={styles.pendingRow}>
              <ActivityIndicator color={colors.primary} accessibilityLabel="Procesando invitación" />
              <Text style={styles.mutedText}>Procesando…</Text>
            </View>
          )}

          {!invitations.error && !invitations.items.length && (
            <Text style={styles.emptyText}>No tienes invitaciones pendientes ni enviadas.</Text>
          )}

          {invitations.items.map(item => (
            <View key={item.id} style={styles.invitationCard}>
              <View style={styles.invitationHeader}>
                <View style={[styles.directionBadge, item.direction === 'incoming' ? styles.incomingBadge : styles.outgoingBadge]}>
                  <Text style={[styles.directionBadgeText, item.direction === 'incoming' ? styles.incomingBadgeText : styles.outgoingBadgeText]}>
                    {item.direction === 'incoming' ? 'Recibida' : 'Enviada'}
                  </Text>
                </View>
                <Text style={styles.communityTag}>{item.community_name}</Text>
              </View>

              {item.recipient_name && (
                <Text style={styles.recipientText}>Destinatario: <Text style={styles.boldText}>{item.recipient_name}</Text></Text>
              )}

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Estado: </Text>
                <Text style={[
                  styles.statusValue,
                  item.status === 'accepted' ? styles.statusAccepted : item.status === 'rejected' ? styles.statusRejected : styles.statusPending
                ]}>
                  {item.status === 'pending' ? 'Pendiente' : item.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
                </Text>
              </View>

              {item.direction === 'incoming' && item.status === 'pending' && (
                <View style={styles.actionRow}>
                  <Pressable
                    style={[styles.acceptButton, invitations.pending && styles.buttonDisabled]}
                    disabled={invitations.pending}
                    onPress={() => {
                      void invitations.process(item.id, true).then(result => {
                        if (result?.status === 'accepted') onMembershipChanged();
                      });
                    }}
                  >
                    <Text style={styles.acceptButtonText}>Aceptar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.rejectButton, invitations.pending && styles.buttonDisabled]}
                    disabled={invitations.pending}
                    onPress={() => {
                      void invitations.process(item.id, false).then(result => {
                        if (result?.status === 'accepted') onMembershipChanged();
                      });
                    }}
                  >
                    <Text style={styles.rejectButtonText}>Rechazar</Text>
                  </Pressable>
                </View>
              )}
            </View>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  loadingBox: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  mutedText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  messageBox: {
    backgroundColor: colors.primarySurface,
    borderRadius: 8,
    padding: 10,
  },
  messageText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  inviteSection: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  neighborFoundCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    gap: 6,
    marginTop: 4,
  },
  neighborName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  neighborCode: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  invitationCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  directionBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  directionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  incomingBadge: {
    backgroundColor: colors.primarySurface,
  },
  incomingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  outgoingBadge: {
    backgroundColor: '#E8EAED',
  },
  outgoingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  communityTag: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  recipientText: {
    fontSize: 14,
    color: colors.text,
  },
  boldText: {
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusPending: {
    color: colors.warning,
  },
  statusAccepted: {
    color: colors.primary,
  },
  statusRejected: {
    color: colors.danger,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
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
});

