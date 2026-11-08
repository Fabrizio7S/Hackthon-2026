import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import type { ListState } from './listLoader';

type Props<T> = {
  state: ListState<T>;
  onRetry: () => void;
  emptyMessage: string;
  /** Se muestra solo cuando hay elementos. */
  children: (items: T[]) => ReactNode;
};

/**
 * Muestra el estado de una lista: cargando, vacía, error con «Reintentar»
 * o los elementos. Estilos mínimos: la funcionalidad precede al acabado visual.
 */
export function ListStateView<T>({ state, onRetry, emptyMessage, children }: Props<T>) {
  switch (state.status) {
    case 'cargando':
      return (
        <View accessibilityLiveRegion="polite" style={styles.center}>
          <ActivityIndicator accessibilityLabel="Cargando" color={colors.primary} size="large" />
          <Text style={styles.text}>Cargando…</Text>
        </View>
      );
    case 'vacio':
      return (
        <View style={styles.center}>
          <Text style={styles.text}>{emptyMessage}</Text>
        </View>
      );
    case 'error':
      return (
        <View accessibilityLiveRegion="polite" style={styles.center}>
          <Text accessibilityRole="alert" style={styles.text}>
            {state.message}
          </Text>
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </Pressable>
        </View>
      );
    case 'listo':
      return <>{children(state.items)}</>;
  }
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { color: colors.text, fontSize: 18, marginTop: 12, textAlign: 'center' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  buttonText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600' },
});
