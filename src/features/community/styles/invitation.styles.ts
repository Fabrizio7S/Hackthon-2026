import { Platform, StyleSheet } from 'react-native';
import { colors } from '../../../shared/theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
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
    borderRadius: 14,
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
    borderRadius: 14,
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
    borderRadius: 14,
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
    borderRadius: 14,
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
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  directionBadge: {
    borderRadius: 10,
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
    borderRadius: 14,
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
    borderRadius: 14,
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
    borderRadius: 14,
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
    borderRadius: 14,
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
