import { StyleSheet } from 'react-native';
import { colors } from '../theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  tabBar: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tabButton: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 3,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  tabButtonSelected: { borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 15, fontWeight: '500' },
  tabTextSelected: { color: colors.primary, fontWeight: '700' },
  body: { flex: 1 },
  backBar: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
