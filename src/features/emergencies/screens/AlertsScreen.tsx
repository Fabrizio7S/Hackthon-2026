import { TourTarget, TourScrollView, useTourTargets } from '../../../shared/ui/tour/TourTargets';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../../../shared/theme';
import { AppIcon } from '../../../shared/ui/AppIcon';
import type { ResourceState } from '../hooks/useResource';
import {
  countByStatus,
  filterByStatus,
  formatRelative,
  sortEmergencies,
  type StatusFilter,
} from '../model/logic';
import {
  CATEGORY_OPTIONS,
  LEVEL_OPTIONS,
  STATUS_LABELS,
  type Emergency,
  type EmergencyFeed,
  type EmergencyLevel,
  type EmergencyStatus,
} from '../model/types';
import {
  ArchIcon,
  Badge,
  Banner,
  Button,
  Chip,
  LevelBars,
  StateView,
  shared,
  type Tone,
} from '../components/ui';
import { SosButton } from '../components/SosButton';

const LEVEL_TONE: Record<EmergencyLevel, Tone> = {
  critica: 'danger',
  alta: 'warning',
  media: 'neutral',
};
const STATUS_TONE: Record<EmergencyStatus, Tone> = {
  abierta: 'danger',
  en_atencion: 'warning',
  solucionado: 'success',
};

type Props = {
  feed: ResourceState<EmergencyFeed>;
  pendingCount: number;
  onReload: () => void;
  onOpen: (id: string) => void;
  onReport: () => void;
  onGoToCommunity?: () => void;
  /** El filtro lo conserva EmergenciesScreen para no perderlo al abrir un detalle. */
  filter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  onTriggerSos?: () => Promise<{ ok: boolean; duplicate?: boolean; message: string }>;
};

export function AlertsScreen({
  feed,
  pendingCount,
  onReload,
  onOpen,
  onReport,
  onGoToCommunity,
  filter,
  onFilterChange,
  onTriggerSos,
}: Props) {
  const highlighted = useTourTargets();
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
    <TourScrollView
      style={shared.screen}
      contentContainerStyle={shared.content}
      keyboardShouldPersistTaps="handled"
    >
      {pendingCount > 0 ? (
        <Banner
          tone="warning"
          text={`Tienes ${pendingCount} reporte${pendingCount === 1 ? '' : 's'} guardado${pendingCount === 1 ? '' : 's'} en tu teléfono que aún no se ${pendingCount === 1 ? 'envió' : 'enviaron'}.`}
          actionLabel="Ver y reintentar"
          onAction={onReport}
        />
      ) : null}

      {onTriggerSos ? <SosButton onTriggerSos={onTriggerSos} /> : null}
      {!feed.data && highlighted('emergency-alerts') && (
        <TourTarget id="emergency-alerts" style={shared.card}>
          <Text style={shared.body}>
            Aquí se mostrarán las alertas de tu comunidad. Revisa abajo si falta unirte o volver a
            cargar los datos.
          </Text>
        </TourTarget>
      )}
      <StateView
        state={feed}
        onRetry={onReload}
        onGoToCommunity={onGoToCommunity}
        emptyMessage="Todavía no hay reportes en tu comunidad."
      >
        {(feed) => (
          <>
            <View style={shared.row}>
              <View style={styles.grow}>
                <Text style={shared.title}>Alertas de {feed.communityName}</Text>
                <Text style={shared.subtitle}>Solo ves reportes de tu comunidad.</Text>
              </View>
              <Button label="Actualizar" kind="outline" onPress={onReload} />
            </View>

            <TourTarget
              id="emergency-alerts"
              style={shared.row}
              accessibilityLabel="Filtrar por estado"
            >
              {filters.map((f) => (
                <Chip
                  key={f.value}
                  label={f.label}
                  selected={filter === f.value}
                  onPress={() => onFilterChange(f.value)}
                />
              ))}
            </TourTarget>

            {items.length === 0 ? (
              <View style={shared.card}>
                <Text style={shared.body}>
                  Todavía no hay reportes. Si algo pasa en tu zona, repórtalo.
                </Text>
                <Button label="Reportar una emergencia" kind="danger" onPress={onReport} />
              </View>
            ) : visible.length === 0 ? (
              <View style={shared.card}>
                <Text style={shared.body}>No hay reportes con este estado.</Text>
              </View>
            ) : (
              visible.map((item) => <AlertCard key={item.id} item={item} onOpen={onOpen} />)
            )}
          </>
        )}
      </StateView>
    </TourScrollView>
  );
}

export function AlertCard({ item, onOpen }: { item: Emergency; onOpen: (id: string) => void }) {
  const category = CATEGORY_OPTIONS.find((c) => c.value === item.category);
  const level = LEVEL_OPTIONS.find((l) => l.value === item.level);
  const summary = item.restricted ? 'Detalle reservado por privacidad' : (item.description ?? '');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category?.label}, urgencia ${level?.label}, ${STATUS_LABELS[item.status]}. ${summary}`}
      onPress={() => onOpen(item.id)}
      style={({ pressed }) => [
        shared.card,
        styles.alert,
        item.status === 'solucionado' && styles.closed,
        pressed && { opacity: 0.8 },
      ]}
    >
      <ArchIcon
        icon={category?.icon}
        tone={
          item.status === 'solucionado' ? 'success' : item.level === 'media' ? 'warning' : 'danger'
        }
      />
      <View style={styles.alertBody}>
        <View style={styles.alertTop}>
          <View style={styles.level}>
            <LevelBars level={item.level === 'critica' ? 3 : item.level === 'alta' ? 2 : 1} />
            <Text style={styles.levelText}>{level?.label.toUpperCase()}</Text>
          </View>
          <Badge text={STATUS_LABELS[item.status]} tone={STATUS_TONE[item.status]} />
        </View>
        <Text style={styles.category}>{category?.label}</Text>
        <View style={styles.summaryRow}>
          {item.restricted ? <AppIcon name="lock" size={15} color={colors.textMuted} /> : null}
          <Text
            style={[item.restricted ? styles.restricted : shared.body, { flex: 1 }]}
            numberOfLines={3}
          >
            {summary}
          </Text>
        </View>
        {item.vulnerable || item.isDemo ? (
          <View style={shared.row}>
            {item.vulnerable ? <Badge text="Persona vulnerable" tone="warning" /> : null}
            {item.isDemo ? <Badge text="Datos de demostración" tone="demo" /> : null}
          </View>
        ) : null}
        <Text style={shared.subtitle}>
          {formatRelative(item.createdAt)}
          {item.mine ? ' · Tu reporte' : ''}
          {item.offersCount > 0
            ? ` · ${item.offersCount} ofrecimiento${item.offersCount === 1 ? '' : 's'} de ayuda`
            : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 160 },
  alert: { flexDirection: 'row', gap: 12 },
  alertBody: { flex: 1, minWidth: 0, gap: 5 },
  alertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  level: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  levelText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.dangerDeep,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  category: { fontSize: 16, fontWeight: '800', color: '#2E2220' },
  restricted: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  closed: { opacity: 0.8 },
});
