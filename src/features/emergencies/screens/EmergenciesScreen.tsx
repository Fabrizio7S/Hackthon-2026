import type { SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/theme';
import { useUbicacion } from '../../../shared/location/useUbicacion';
import { TOUR_RED, useTourTargets } from '../../../shared/ui/tour/TourTargets';
import { AlertsScreen } from './AlertsScreen';
import {
  createEmergenciesApi,
  newClientRequestId,
  type EmergenciesApi,
} from '../data/emergenciesApi';
import { EmergencyDetailScreen } from './EmergencyDetailScreen';
import { useReportOutbox } from '../hooks/useReportOutbox';
import { useResource } from '../hooks/useResource';
import type { OutboxStorage } from '../data/outbox';
import { resolveReportLocation, type StatusFilter } from '../model/logic';
import { ReportScreen } from './ReportScreen';
import { SupportScreen } from './SupportScreen';
import type { CommunityZone } from '../model/types';

export type EmergenciesTab = 'alertas' | 'reportar' | 'apoyo';

type Props = {
  client: SupabaseClient | null;
  userId: string;
  initialTab?: EmergenciesTab;
  guidedTab?: EmergenciesTab;
  onTabChange?: () => void;
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
      return {
        lat: value.lat,
        lng: value.lng,
        name: typeof value.name === 'string' ? value.name : null,
      };
    }
  } catch {
    // Copia local ilegible: se ignora.
  }
  return null;
}

export function EmergenciesScreen({
  client,
  userId,
  initialTab = 'alertas',
  userLocation = null,
  storage = AsyncStorage,
  api: apiOverride,
  onOpenServices,
  onGoToCommunity,
  guidedTab,
  onTabChange,
}: Props) {
  const highlighted = useTourTargets();
  const { ubicacion } = useUbicacion();
  const effectiveLocation = userLocation ?? ubicacion;
  const api = useMemo(() => apiOverride ?? createEmergenciesApi(client), [apiOverride, client]);
  const [tab, setTab] = useState<EmergenciesTab>(initialTab);
  const [openId, setOpenId] = useState<string | null>(null);
  // Se conserva aquí para que el filtro de Alertas sobreviva a abrir y cerrar un detalle.
  const [alertFilter, setAlertFilter] = useState<StatusFilter>('todas');
  const [cachedZone, setCachedZone] = useState<CommunityZone | null>(null);

  useEffect(() => {
    if (guidedTab) {
      setOpenId(null);
      setTab(guidedTab);
    }
  }, [guidedTab]);

  function selectTab(next: EmergenciesTab) {
    onTabChange?.();
    setTab(next);
  }

  const feed = useResource(useCallback(() => api.loadFeed(), [api]));
  const support = useResource(useCallback(() => api.loadSupport(), [api]));

  const reloadFeed = feed.reload;
  const outbox = useReportOutbox({
    api,
    storage,
    userId,
    onDelivered: () => void reloadFeed({ silent: true }),
  });

  // La zona de la comunidad se guarda por usuario para poder reportar sin conexión.
  useEffect(() => {
    let cancelled = false;
    storage
      .getItem(zoneKey(userId))
      .then((raw) => {
        if (!cancelled) setCachedZone(parseZone(raw));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [storage, userId]);

  const serverZone = feed.state.data?.zone ?? null;
  useEffect(() => {
    if (serverZone && serverZone.lat !== null && serverZone.lng !== null) {
      setCachedZone(serverZone);
      storage.setItem(zoneKey(userId), JSON.stringify(serverZone)).catch(() => undefined);
    }
  }, [serverZone, storage, userId]);

  const zone =
    serverZone && serverZone.lat !== null && serverZone.lng !== null ? serverZone : cachedZone;

  // El botón «atrás» de Android cierra el detalle antes de salir del módulo.
  useEffect(() => {
    if (!openId) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpenId(null);
      return true;
    });
    return () => subscription.remove();
  }, [openId]);

  const handleTriggerSos = useCallback(async () => {
    const loc = resolveReportLocation(effectiveLocation, zone);
    if (!loc) {
      return {
        ok: false,
        message:
          'No se pudo determinar tu ubicación para enviar la alerta SOS. Activa la ubicación o conéctate para sincronizar la zona.',
      };
    }
    const clientRequestId = newClientRequestId();
    const outcome = await outbox.submit({
      category: 'salud',
      level: 'critica',
      description: '¡ALERTA SOS! Solicitud de auxilio urgente en el sector.',
      vulnerable: false,
      lat: loc.lat,
      lng: loc.lng,
      locationOrigin: loc.origin,
      clientRequestId,
    });
    void reloadFeed({ silent: true });
    if (outcome.state === 'enviado') {
      return {
        ok: true,
        duplicate: outcome.duplicate,
        message:
          loc.origin === 'dispositivo'
            ? '¡Alerta SOS enviada! Tus vecinos pueden ver la ubicación capturada en el mapa.'
            : '¡Alerta SOS enviada con la zona aproximada de tu comunidad! No se obtuvo tu ubicación del teléfono.',
      };
    } else if (outcome.state === 'pendiente') {
      return {
        ok: false,
        message: outcome.saved
          ? 'Alerta guardada en el teléfono, pendiente de envío. Todavía no es visible para tus vecinos ni en el mapa. Reintenta desde Reportar.'
          : 'La alerta no se envió ni pudo guardarse en el teléfono. Vuelve a intentarlo.',
      };
    } else {
      return { ok: false, message: outcome.error.message };
    }
  }, [outbox, effectiveLocation, zone, reloadFeed]);

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
        {TABS.map((item) => {
          const selected = tab === item.value;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              aria-selected={selected}
              accessibilityLabel={item.label}
              testID={
                highlighted(`emergency-tab:${item.value}`) ? `tour-tab:${item.value}` : undefined
              }
              onPress={() => selectTab(item.value)}
              style={[
                styles.tab,
                selected && styles.tabSelected,
                highlighted(`emergency-tab:${item.value}`) && styles.tourTab,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  selected && styles.tabTextSelected,
                  highlighted(`emergency-tab:${item.value}`) && { color: colors.dangerDeep },
                ]}
              >
                {item.label}
                {item.value === 'reportar' && outbox.entries.length > 0
                  ? ` (${outbox.entries.length})`
                  : ''}
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
          onReport={() => selectTab('reportar')}
          onGoToCommunity={onGoToCommunity}
          filter={alertFilter}
          onFilterChange={setAlertFilter}
          onTriggerSos={handleTriggerSos}
        />
      ) : null}
      {tab === 'reportar' ? (
        <ReportScreen
          outbox={outbox}
          zone={zone}
          userLocation={effectiveLocation}
          onViewAlerts={() => selectTab('alertas')}
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
  tourTab: {
    borderWidth: 3,
    borderColor: TOUR_RED,
    borderBottomColor: TOUR_RED,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  root: { flex: 1, backgroundColor: colors.dangerPaper },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  tab: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabSelected: { borderBottomColor: colors.onDanger },
  tabText: { fontSize: 15, color: '#FBDCD3', fontWeight: '500' },
  tabTextSelected: { color: colors.onDanger, fontWeight: '700' },
});
