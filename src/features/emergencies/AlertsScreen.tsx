import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../shared/theme';
import type { ResourceState } from './hooks';
import { countByStatus, filterByStatus, formatRelative, sortEmergencies, type StatusFilter } from './logic';
import {
  CATEGORY_OPTIONS,
  LEVEL_OPTIONS,
  STATUS_LABELS,
  type Emergency,
  type EmergencyFeed,
  type EmergencyLevel,
  type EmergencyStatus,
} from './types';
import { Badge, Banner, Button, Chip, StateView, shared, type Tone } from './ui';

const LEVEL_TONE: Record<EmergencyLevel, Tone> = { critica: 'danger', alta: 'warning', media: 'neutral' };
const STATUS_TONE: Record<EmergencyStatus, Tone> = { abierta: 'danger', en_atencion: 'warning', solucionado: 'success' };

type Props = {
  feed: ResourceState<EmergencyFeed>;
  pendingCount: number;
  onReload: () => void;
  onOpen: (id: string) => void;
  onReport: () => void;
  onGoToCommunity?: () => void;
};

export function AlertsScreen({ feed, pendingCount, onReload, onOpen, onReport, onGoToCommunity }: Props) {
  const [filter, setFilter] = useState<StatusFilter>('todas');
  const data = feed.data;
  const items = useMemo(() => (data ? sortEmergencies(data.items) : []), [data]);
  const counts = useMemo(() => countByStatus(items), [items]);
  const visible = useMemo(() => filterByStatus(items, filter), [items, filter]);

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'todas', label: `Todas (${counts.todas})` },
    { value: 'abierta', label: `Abiertas (${counts.abierta})` },
    { value: 'en_atencion', label: `En atención (${counts.en_atencion})` },
    { value: 'solucionado', label: `Solucionadas (${counts.solucionado})` },
  ];

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content} keyboardShouldPersistTaps="handled">
      {pendingCount > 0 ? (
        <Banner
          tone="warning"
          text={`Tienes ${pendingCount} reporte${pendingCount === 1 ? '' : 's'} guardado${pendingCount === 1 ? '' : 's'} en tu teléfono que aún no se ${pendingCount === 1 ? 'envió' : 'enviaron'}.`}
          actionLabel="Ver y reintentar"
          onAction={onReport}
        />
      ) : null}

      <StateView
        state={feed}
        onRetry={onReload}
        onGoToCommunity={onGoToCommunity}
        emptyMessage="Todavía no hay reportes en tu comunidad."
      >
        {feed => (
          <>
            <View style={shared.row}>
              <View style={styles.grow}>
                <Text style={shared.title}>Alertas de {feed.communityName}</Text>
                <Text style={shared.subtitle}>Solo ves reportes de tu comunidad.</Text>
              </View>
              <Button label="Actualizar" kind="outline" onPress={onReload} />
            </View>

            <View style={shared.row} accessibilityLabel="Filtrar por estado">
              {filters.map(f => (
                <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
              ))}
            </View>

            {items.length === 0 ? (
              <View style={shared.card}>
                <Text style={shared.body}>Todavía no hay reportes. Si algo pasa en tu zona, repórtalo.</Text>
                <Button label="Reportar una emergencia" kind="danger" onPress={onReport} />
              </View>
            ) : visible.length === 0 ? (
              <View style={shared.card}>
                <Text style={shared.body}>No hay reportes con este estado.</Text>
              </View>
            ) : (
              visible.map(item => <AlertCard key={item.id} item={item} onOpen={onOpen} />)
            )}
          </>
        )}
      </StateView>
    </ScrollView>
  );
}

export function AlertCard({ item, onOpen }: { item: Emergency; onOpen: (id: string) => void }) {
  const category = CATEGORY_OPTIONS.find(c => c.value === item.category);
  const level = LEVEL_OPTIONS.find(l => l.value === item.level);
  const summary = item.restricted ? 'Detalle reservado por privacidad' : item.description ?? '';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category?.label}, urgencia ${level?.label}, ${STATUS_LABELS[item.status]}. ${summary}`}
      onPress={() => onOpen(item.id)}
      style={[shared.card, item.status === 'solucionado' && styles.closed]}
    >
      <View style={shared.row}>
        <Text style={styles.category}>{category?.symbol} {category?.label}</Text>
        <Badge text={`Urgencia ${level?.label.toLowerCase()}`} tone={LEVEL_TONE[item.level]} />
        <Badge text={STATUS_LABELS[item.status]} tone={STATUS_TONE[item.status]} />
        {item.vulnerable ? <Badge text="Persona vulnerable" tone="warning" /> : null}
        {item.isDemo ? <Badge text="Datos de demostración" tone="demo" /> : null}
      </View>
      <Text style={item.restricted ? styles.restricted : shared.body} numberOfLines={3}>
        {item.restricted ? '🔒 ' : ''}{summary}
      </Text>
      <Text style={shared.subtitle}>
        {formatRelative(item.createdAt)}
        {item.mine ? ' · Tu reporte' : ''}
        {item.offersCount > 0 ? ` · 🤝 ${item.offersCount} ofrecimiento${item.offersCount === 1 ? '' : 's'}` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 160 },
  category: { fontSize: 16, fontWeight: '800', color: colors.text },
  restricted: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  closed: { opacity: 0.8 },
});
