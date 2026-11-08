import type { SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../shared/theme';
import { AlertsScreen } from './AlertsScreen';
import { createEmergenciesApi, type EmergenciesApi } from './emergenciesApi';
import { EmergencyDetailScreen } from './EmergencyDetailScreen';
import { useReportOutbox, useResource } from './hooks';
import type { OutboxStorage } from './outbox';
import { ReportScreen } from './ReportScreen';
import { SupportScreen } from './SupportScreen';
import type { CommunityZone } from './types';

export type EmergenciesTab = 'alertas' | 'reportar' | 'apoyo';

type Props = {
  client: SupabaseClient | null;
  userId: string;
  initialTab?: EmergenciesTab;
  /** Ubicación del dispositivo cuando el equipo de mapa/ubicación (Persona 5) la provee. */
  userLocation?: { latitude: number; longitude: number } | null;
  storage?: OutboxStorage;
  api?: EmergenciesApi;
  onOpenServices?: () => void;
  onGoToCommunity?: () => void;
};

const TABS: { value: EmergenciesTab; label: string }[] = [
  { value: 'alertas', label: 'Alertas' },
  { value: 'reportar', label: 'Reportar' },
  { value: 'apoyo', label: 'Apoyo' },
];

const zoneKey = (userId: string) => `emergencias.zona.v1:${userId}`;

function parseZone(raw: string | null): CommunityZone | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<CommunityZone>;
    if (typeof value.lat === 'number' && typeof value.lng === 'number') {
      return { lat: value.lat, lng: value.lng, name: typeof value.name === 'string' ? value.name : null };
    }
  } catch {
    // Copia local ilegible: se ignora.
  }
  return null;
}

export function EmergenciesScreen({
  client, userId, initialTab = 'alertas', userLocation = null, storage = AsyncStorage, api: apiOverride,
  onOpenServices, onGoToCommunity,
}: Props) {
  const api = useMemo(() => apiOverride ?? createEmergenciesApi(client), [apiOverride, client]);
  const [tab, setTab] = useState<EmergenciesTab>(initialTab);
  const [openId, setOpenId] = useState<string | null>(null);
  const [cachedZone, setCachedZone] = useState<CommunityZone | null>(null);

  const feed = useResource(useCallback(() => api.loadFeed(), [api]));
  const support = useResource(useCallback(() => api.loadSupport(), [api]));

  const reloadFeed = feed.reload;
  const outbox = useReportOutbox({ api, storage, userId, onDelivered: () => void reloadFeed({ silent: true }) });

  // La zona de la comunidad se guarda por usuario para poder reportar sin conexión.
  useEffect(() => {
    let cancelled = false;
    storage.getItem(zoneKey(userId)).then(raw => { if (!cancelled) setCachedZone(parseZone(raw)); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [storage, userId]);

  const serverZone = feed.state.data?.zone ?? null;
  useEffect(() => {
    if (serverZone && serverZone.lat !== null && serverZone.lng !== null) {
      setCachedZone(serverZone);
      storage.setItem(zoneKey(userId), JSON.stringify(serverZone)).catch(() => undefined);
    }
  }, [serverZone, storage, userId]);

  const zone = serverZone && serverZone.lat !== null && serverZone.lng !== null ? serverZone : cachedZone;

  // El botón «atrás» de Android cierra el detalle antes de salir del módulo.
  useEffect(() => {
    if (!openId) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { setOpenId(null); return true; });
    return () => subscription.remove();
  }, [openId]);

  const refreshAll = useCallback(() => {
    void feed.reload({ silent: true });
  }, [feed]);

  if (openId) {
    return (
      <EmergencyDetailScreen
        api={api}
        emergencyId={openId}
        onBack={() => setOpenId(null)}
        onChanged={refreshAll}
        onGoToCommunity={onGoToCommunity}
      />
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map(item => {
          const selected = tab === item.value;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={item.label}
              onPress={() => setTab(item.value)}
              style={[styles.tab, selected && styles.tabSelected]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                {item.label}{item.value === 'reportar' && outbox.entries.length > 0 ? ` (${outbox.entries.length})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'alertas' ? (
        <AlertsScreen
          feed={feed.state}
          pendingCount={outbox.entries.length}
          onReload={() => void feed.reload()}
          onOpen={setOpenId}
          onReport={() => setTab('reportar')}
          onGoToCommunity={onGoToCommunity}
        />
      ) : null}
      {tab === 'reportar' ? (
        <ReportScreen
          outbox={outbox}
          zone={zone}
          userLocation={userLocation}
          onViewAlerts={() => setTab('alertas')}
        />
      ) : null}
      {tab === 'apoyo' ? (
        <SupportScreen
          api={api}
          directory={support.state}
          onReload={() => void support.reload({ silent: true })}
          onOpenServices={onOpenServices}
          onGoToCommunity={onGoToCommunity}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  tabs: { flexDirection: 'row', backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabSelected: { borderBottomColor: colors.danger },
  tabText: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
  tabTextSelected: { color: colors.danger, fontWeight: '800' },
});
