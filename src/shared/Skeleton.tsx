import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from './theme';

export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = 10,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 750, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0.45, duration: 750, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no"
      style={[
        styles.box,
        { width, height, borderRadius, opacity: pulse },
        style,
      ]}
    />
  );
}

export function SkeletonCardList({
  count = 3,
  accessibilityLabel = 'Cargando contenido',
  caption,
}: {
  count?: number;
  accessibilityLabel?: string;
  caption?: string;
}) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={styles.listWrap}
    >
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} style={styles.card}>
          <SkeletonBox width={58} height={68} borderRadius={29} />
          <View style={styles.cardBody}>
            <View style={styles.topRow}>
              <SkeletonBox width="32%" height={11} borderRadius={5} />
              <SkeletonBox width={54} height={16} borderRadius={6} />
            </View>
            <SkeletonBox width="78%" height={18} borderRadius={7} />
            <SkeletonBox width="56%" height={13} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SkeletonPanel({
  lines = 3,
  accessibilityLabel = 'Cargando sección',
}: {
  lines?: number;
  accessibilityLabel?: string;
}) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={styles.panel}
    >
      <View style={styles.panelHeader}>
        <SkeletonBox width={50} height={56} borderRadius={25} />
        <View style={styles.cardBody}>
          <SkeletonBox width="62%" height={20} borderRadius={8} />
          <SkeletonBox width="40%" height={13} borderRadius={6} />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, idx) => (
        <SkeletonBox
          key={idx}
          width={idx === lines - 1 ? '68%' : '100%'}
          height={idx === 0 ? 44 : 16}
          borderRadius={idx === 0 ? 12 : 7}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#E3DEC9',
  },
  listWrap: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  caption: {
    color: colors.textMuted,
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  card: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 13,
    padding: 14,
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panel: {
    gap: 12,
    paddingVertical: 6,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
