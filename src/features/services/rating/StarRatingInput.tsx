import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  /** Estrellas marcadas (0 si ninguna). */
  value: number;
  onSelect: (stars: number) => void;
  disabled?: boolean;
};

const MAX_STARS = 5; // D18

/** Fila de 5 estrellas para calificar (D18). Cada estrella es un botón accesible. */
export function StarRatingInput({ value, onSelect, disabled = false }: Props) {
  return (
    <View accessibilityRole="radiogroup" style={styles.row}>
      {Array.from({ length: MAX_STARS }, (_, i) => {
        const stars = i + 1;
        const filled = stars <= value;
        return (
          <Pressable
            accessibilityLabel={`${stars} ${stars === 1 ? 'estrella' : 'estrellas'}`}
            accessibilityRole="radio"
            aria-checked={stars === value}
            aria-disabled={disabled}
            disabled={disabled}
            hitSlop={6}
            key={stars}
            onPress={() => onSelect(stars)}
            style={styles.star}
          >
            <Text style={[styles.starText, filled ? styles.filled : styles.empty]}>{filled ? '★' : '☆'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, marginTop: 8 },
  star: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 48, minWidth: 48 },
  starText: { fontSize: 26 },
  filled: { color: colors.starInk },
  empty: { color: colors.borderStrong },
});
