import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const styles = StyleSheet.create({
  circulo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderBottomLeftRadius: 3,
    borderWidth: 3,
    borderColor: colors.background,
  },
});
