// Piezas visuales mínimas del módulo de emergencias. La funcionalidad precede al acabado.
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type IconName } from '../../../shared/ui/AppIcon';
import { SkeletonCardList } from '../../../shared/ui/Skeleton';
import { archRadius, colors, fonts } from '../../../shared/theme';
import type { ResourceState } from '../hooks/useResource';

export const tones = {
  danger: { bg: colors.dangerSurface, fg: colors.danger, border: colors.danger },
  warning: { bg: colors.warningSurface, fg: colors.warningInk, border: colors.warningInk },
  success: { bg: colors.primarySurface, fg: colors.primary, border: colors.primary },
  neutral: { bg: colors.background, fg: colors.textMuted, border: colors.borderStrong },
  demo: { bg: '#EFEAF7', fg: '#4B3A82', border: '#4B3A82' },
} as const;
export type Tone = keyof typeof tones;

export function Badge({ text, tone = 'neutral' }: { text: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{text.toUpperCase()}</Text>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  accessibilityLabel,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      {icon ? (
        <AppIcon name={icon} size={18} color={selected ? colors.dangerDeep : colors.text} />
      ) : null}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

type ButtonKind = 'primary' | 'outline' | 'danger';

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  busy,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
}) {
  const off = !!disabled || !!busy;
  const filled = kind !== 'outline';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: off, busy: !!busy }}
      disabled={off}
      onPress={onPress}
      style={[
        styles.button,
        kind === 'primary' && styles.buttonPrimary,
        kind === 'danger' && styles.buttonDanger,
        kind === 'outline' && styles.buttonOutline,
        off && styles.buttonOff,
      ]}
    >
      {busy ? <ActivityIndicator color={filled ? colors.onPrimary : colors.primary} /> : null}
      <Text style={[styles.buttonText, filled ? styles.buttonTextOn : styles.buttonTextOutline]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Banner({
  tone = 'neutral',
  text,
  actionLabel,
  onAction,
}: {
  tone?: Tone;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const t = tones[tone];
  return (
    <View
      style={[styles.banner, { backgroundColor: t.bg, borderColor: t.border }]}
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
    >
      <Text style={[styles.bannerText, { color: tone === 'neutral' ? colors.text : t.fg }]}>
        {text}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={styles.bannerAction}
        >
          <Text style={[styles.bannerActionText, { color: t.fg }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Baldosa en arco con el icono de la categoría o recurso. */
export function ArchIcon({
  icon,
  tone = 'danger',
  size = 48,
}: {
  icon?: IconName;
  tone?: 'danger' | 'river' | 'warning' | 'success' | 'neutral';
  size?: number;
}) {
  const palette = {
    danger: [colors.dangerSurface, colors.danger],
    river: [colors.riverSurface, colors.river],
    warning: [colors.warningSurface, colors.warningInk],
    success: [colors.primarySurface, colors.primary],
    neutral: [colors.surface, colors.textMuted],
  }[tone];
  return (
    <View
      accessible={false}
      style={[
        styles.arch,
        archRadius(size),
        { width: size, height: size * 1.12, backgroundColor: palette[0] },
      ]}
    >
      {icon ? <AppIcon name={icon} size={Math.round(size / 2)} color={palette[1]} /> : null}
    </View>
  );
}

/** Tres barras de urgencia: 1 media, 2 alta, 3 crítica. */
export function LevelBars({ level }: { level: 1 | 2 | 3 }) {
  return (
    <View accessible={false} style={styles.bars}>
      {[1, 2, 3].map((n) => (
        <View
          key={n}
          style={[
            styles.bar,
            { height: 5 + n * 3, backgroundColor: n <= level ? colors.danger : '#E8D3CB' },
          ]}
        />
      ))}
    </View>
  );
}

/** Muestra cargando, error con reintento, vacío o el contenido. */
export function StateView<T>({
  state,
  emptyMessage,
  isEmpty,
  onRetry,
  onGoToCommunity,
  children,
}: {
  state: ResourceState<T>;
  emptyMessage: string;
  isEmpty?: (data: T) => boolean;
  onRetry: () => void;
  onGoToCommunity?: () => void;
  children: (data: T) => ReactNode;
}) {
  if (state.status === 'cargando') {
    return <SkeletonCardList count={3} accessibilityLabel="Cargando emergencias y recursos" />;
  }
  if (state.status === 'error' || state.data === null) {
    const error = state.error;
    return (
      <View style={styles.center} accessibilityLiveRegion="polite">
        <Text style={styles.centerText} accessibilityRole="alert">
          {error?.message ?? 'Algo salió mal. Inténtalo de nuevo.'}
        </Text>
        {error?.kind === 'sin_comunidad' && onGoToCommunity ? (
          <Button label="Ir a Comunidad" onPress={onGoToCommunity} />
        ) : (
          <Button label="Reintentar" onPress={onRetry} />
        )}
      </View>
    );
  }
  if (isEmpty?.(state.data)) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>{emptyMessage}</Text>
      </View>
    );
  }
  return (
    <>
      {state.error ? (
        <Banner
          tone="warning"
          text={`${state.error.message} Mostramos la última información cargada.`}
          actionLabel="Reintentar"
          onAction={onRetry}
        />
      ) : null}
      {children(state.data)}
    </>
  );
}

export const shared = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.dangerPaper },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#FFFDFB',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#2E2220', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: '#6E5A55', lineHeight: 18 },
  label: { fontSize: 15, fontWeight: '700', color: '#2E2220' },
  body: { fontSize: 15, color: '#2E2220', lineHeight: 21 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  input: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: '#E3CFC6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2E2220',
    backgroundColor: '#FFFDFB',
  },
  errorText: { fontSize: 13, color: colors.danger, lineHeight: 18 },
});

const styles = StyleSheet.create({
  badge: { borderWidth: 1.5, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontFamily: fonts.mono, fontSize: 10.5, fontWeight: '600', letterSpacing: 0.6 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 7,
    borderColor: colors.dangerBorder,
    backgroundColor: '#FFFDFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSelected: { borderColor: colors.danger, backgroundColor: colors.dangerSurface },
  chipText: { fontSize: 14, color: '#2E2220', fontWeight: '600' },
  chipTextSelected: { color: colors.dangerDeep, fontWeight: '800' },
  button: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonDanger: { backgroundColor: colors.danger },
  buttonOutline: { borderWidth: 1.5, borderColor: '#D9C3BA', backgroundColor: '#FFFDFB' },
  arch: { alignItems: 'center', justifyContent: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 4, borderRadius: 1 },
  buttonOff: { opacity: 0.55 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  buttonTextOn: { color: colors.onPrimary },
  buttonTextOutline: { color: '#2E2220' },
  banner: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 },
  bannerText: { fontSize: 14, lineHeight: 20 },
  bannerAction: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  bannerActionText: { fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  centerText: { fontSize: 16, color: colors.text, textAlign: 'center', lineHeight: 22 },
});
