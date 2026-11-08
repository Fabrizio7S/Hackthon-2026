// Piezas visuales mínimas del módulo de emergencias. La funcionalidad precede al acabado.
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../shared/theme';
import type { ResourceState } from './hooks';

export const tones = {
  danger: { bg: colors.dangerSurface, fg: colors.danger, border: colors.danger },
  warning: { bg: '#FFF3E0', fg: '#B45309', border: '#F59E0B' },
  success: { bg: colors.primarySurface, fg: colors.primary, border: colors.primary },
  neutral: { bg: colors.surface, fg: colors.textMuted, border: colors.border },
  demo: { bg: '#EDE7F6', fg: '#4527A0', border: '#B39DDB' },
} as const;
export type Tone = keyof typeof tones;

export function Badge({ text, tone = 'neutral' }: { text: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

export function Chip({ label, selected, onPress, accessibilityLabel }: {
  label: string; selected: boolean; onPress: () => void; accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

type ButtonKind = 'primary' | 'outline' | 'danger';

export function Button({ label, onPress, kind = 'primary', disabled, busy, accessibilityLabel }: {
  label: string; onPress: () => void; kind?: ButtonKind; disabled?: boolean; busy?: boolean; accessibilityLabel?: string;
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
      style={[styles.button, kind === 'primary' && styles.buttonPrimary, kind === 'danger' && styles.buttonDanger,
        kind === 'outline' && styles.buttonOutline, off && styles.buttonOff]}
    >
      {busy ? <ActivityIndicator color={filled ? colors.onPrimary : colors.primary} /> : null}
      <Text style={[styles.buttonText, filled ? styles.buttonTextOn : styles.buttonTextOutline]}>{label}</Text>
    </Pressable>
  );
}

export function Banner({ tone = 'neutral', text, actionLabel, onAction }: {
  tone?: Tone; text: string; actionLabel?: string; onAction?: () => void;
}) {
  const t = tones[tone];
  return (
    <View style={[styles.banner, { backgroundColor: t.bg, borderColor: t.border }]} accessibilityRole={tone === 'danger' ? 'alert' : undefined}>
      <Text style={[styles.bannerText, { color: tone === 'neutral' ? colors.text : t.fg }]}>{text}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction} style={styles.bannerAction}>
          <Text style={[styles.bannerActionText, { color: t.fg }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Muestra cargando, error con reintento, vacío o el contenido. */
export function StateView<T>({ state, emptyMessage, isEmpty, onRetry, onGoToCommunity, children }: {
  state: ResourceState<T>;
  emptyMessage: string;
  isEmpty?: (data: T) => boolean;
  onRetry: () => void;
  onGoToCommunity?: () => void;
  children: (data: T) => ReactNode;
}) {
  if (state.status === 'cargando') {
    return (
      <View style={styles.center} accessibilityLiveRegion="polite">
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Cargando" />
        <Text style={styles.centerText}>Cargando…</Text>
      </View>
    );
  }
  if (state.status === 'error' || state.data === null) {
    const error = state.error;
    return (
      <View style={styles.center} accessibilityLiveRegion="polite">
        <Text style={styles.centerText} accessibilityRole="alert">{error?.message ?? 'Algo salió mal. Inténtalo de nuevo.'}</Text>
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
      {state.error ? <Banner tone="warning" text={`${state.error.message} Mostramos la última información cargada.`} actionLabel="Reintentar" onAction={onRetry} /> : null}
      {children(state.data)}
    </>
  );
}

export const shared = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, gap: 8 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  body: { fontSize: 15, color: colors.text, lineHeight: 21 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  input: {
    minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: colors.background,
  },
  errorText: { fontSize: 13, color: colors.danger, lineHeight: 18 },
});

const styles = StyleSheet.create({
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  chip: {
    minHeight: 44, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 2,
    borderColor: colors.border, backgroundColor: colors.background, justifyContent: 'center',
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  chipText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  chipTextSelected: { color: colors.primary, fontWeight: '800' },
  button: {
    minHeight: 48, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonDanger: { backgroundColor: colors.danger },
  buttonOutline: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  buttonOff: { opacity: 0.55 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  buttonTextOn: { color: colors.onPrimary },
  buttonTextOutline: { color: colors.text },
  banner: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 6 },
  bannerText: { fontSize: 14, lineHeight: 20 },
  bannerAction: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  bannerActionText: { fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  centerText: { fontSize: 16, color: colors.text, textAlign: 'center', lineHeight: 22 },
});
