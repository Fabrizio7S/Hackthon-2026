import { StyleSheet } from 'react-native';
import { colors } from '../../../shared/theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.primarySurface,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  loadingBox: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
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
  errorBox: {
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  list: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  memberName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  currentUserTag: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  roleBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontSize: 12,
  },
  repBadge: {
    backgroundColor: colors.primarySurface,
  },
  repBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  normalBadge: {
    backgroundColor: colors.surface,
  },
  normalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
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
    marginTop: 4,
  },
  buttonOutlineText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.75 },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0006',
  },
  dialog: { width: '100%', maxWidth: 400 },
});
