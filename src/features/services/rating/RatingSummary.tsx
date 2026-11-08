import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { formatRatingSummary } from './formatRating';

type Props = {
  average: number | null | undefined;
  count: number | null | undefined;
  /** Escala de estrellas; pendiente de Q04. */
  maxStars: number;
};

/** Muestra «★ 4.8 (32)» o «Sin valoraciones». Solo lectura. */
export function RatingSummary({ average, count, maxStars }: Props) {
  const summary = formatRatingSummary(average, count, maxStars);

  return (
    <View
      accessible
      accessibilityLabel={summary.accessibilityLabel}
      accessibilityRole="text"
      style={styles.row}
    >
      {summary.status === 'sin_valoraciones' ? (
        <Text style={styles.muted}>{summary.text}</Text>
      ) : (
        <>
          <Text style={styles.star}>★</Text>
          <Text style={styles.average}>{summary.average}</Text>
          <Text style={styles.muted}>{summary.count}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  star: { color: colors.starInk, fontSize: 15 },
  average: { color: colors.text, fontSize: 14, fontWeight: '700' },
  muted: { color: colors.textMuted, fontSize: 14 },
});
