import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../shared/theme';
import { formatRelative } from './logic';
import { OUTBOX_STATUS_LABELS, type OutboxEntry, type OutboxStatus } from './outbox';
import { CATEGORY_OPTIONS } from './types';
import { Badge, Button, shared, type Tone } from './ui';

const STATUS_TONE: Record<OutboxStatus, Tone> = {
  guardado_local: 'warning',
  enviando: 'neutral',
  pendiente: 'warning',
  error: 'danger',
};

/** Reportes guardados en el teléfono que el servidor todavía NO confirmó. */
export function PendingList({ entries, busy, onRetry, onDiscard }: {
  entries: readonly OutboxEntry[];
  busy: boolean;
  onRetry: (id: string) => void;
  onDiscard: (id: string) => void;
}) {
  if (entries.length === 0) return null;
  return (
    <View style={styles.wrap} accessibilityLabel="Reportes sin enviar">
      <Text style={shared.title}>Sin enviar ({entries.length})</Text>
      <Text style={shared.subtitle}>
        Estos reportes están guardados en tu teléfono. Tus vecinos todavía no los reciben.
      </Text>
      {entries.map(entry => {
        const category = CATEGORY_OPTIONS.find(c => c.value === entry.report.category);
        return (
          <View key={entry.clientRequestId} style={shared.card}>
            <View style={shared.row}>
              <Text style={shared.label}>{category?.symbol} {category?.label}</Text>
              <Badge text={OUTBOX_STATUS_LABELS[entry.status]} tone={STATUS_TONE[entry.status]} />
            </View>
            <Text style={shared.body} numberOfLines={3}>{entry.report.description}</Text>
            <Text style={shared.subtitle}>
              Guardado {formatRelative(entry.savedAt)}
              {entry.attempts > 0 ? ` · ${entry.attempts} intento${entry.attempts === 1 ? '' : 's'}` : ''}
            </Text>
            {entry.lastError ? <Text style={shared.errorText}>{entry.lastError}</Text> : null}
            <View style={shared.row}>
              <Button label="Reintentar envío" onPress={() => onRetry(entry.clientRequestId)} disabled={busy} />
              <Button label="Descartar" kind="outline" onPress={() => onDiscard(entry.clientRequestId)} disabled={busy} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, borderLeftWidth: 4, borderLeftColor: colors.warning, paddingLeft: 10 },
});
