import { StyleSheet } from 'react-native';
import { colors } from '../../../shared/theme';

export const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  lock: { borderColor: '#F59E0B', backgroundColor: '#FFF8EB' },
  offer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 6 },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
});
