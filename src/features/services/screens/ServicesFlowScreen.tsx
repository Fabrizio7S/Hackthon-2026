import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import type { openContact } from '../contact/openContact';
import { offersApi as defaultApi } from '../data';
import type { OffersApi } from '../data/offersApi';
import type { Offer } from '../data/offerTypes';
import type { Coordinates } from '../distance/distance';
import { loadMapOffers, type ServiceMapOffer } from '../map/toMapOffers';
import { colors } from '../theme';
import { AppIcon } from '../../../shared/AppIcon';
import { supabase } from '../../../lib/supabase';
import { createEmergenciesApi, toEmergencyMapPoints, toResourceMapPoints } from '../../emergencies';
import { useUbicacion } from '../../mapa/hooks/useUbicacion';
import MapaServicios from '../../mapa/screens/MapaServicios';
import { EditOfferScreen } from './EditOfferScreen';
import { MyOffersScreen } from './MyOffersScreen';
import { OfferDetailScreen } from './OfferDetailScreen';
import { OfferListScreen } from './OfferListScreen';
import { PublishOfferScreen } from './PublishOfferScreen';

export type ServicesTab = 'explorar' | 'mapa' | 'publicar' | 'mis_ofertas';

export type ServicesRoute =
  | { screen: 'tab'; tab: ServicesTab }
  | { screen: 'detalle'; offerId: string; returnTab: ServicesTab }
  | { screen: 'editar'; offerId: string; fromDetail?: ServicesTab };

type Props = {
  /** Pestaña inicial al abrir el módulo de servicios y productos. */
  initialTab?: ServicesTab;
  /** Ubicación actual del vecino proporcionada por Persona 5. */
  userLocation?: Coordinates | null;
  /** API inyectable para pruebas; por defecto usa el cliente de Supabase compartido. */
  api?: OffersApi;
  /** Función de contacto inyectable para pruebas. */
  contact?: typeof openContact;
  /** Abre la sección de emergencias o recursos cuando se pulsa un marcador de emergencia/recurso en el mapa. */
  onOpenEmergencies?: (tab?: 'alertas' | 'apoyo') => void;
};

const TABS: { value: ServicesTab; label: string }[] = [
  { value: 'explorar', label: 'Explorar' },
  { value: 'mapa', label: 'Mapa' },
  { value: 'publicar', label: 'Publicar' },
  { value: 'mis_ofertas', label: 'Mis ofertas' },
];

/**
 * Recorrido completo del módulo G02 (publicar → descubrir → consultar →
 * contactar/calificar → gestionar propias), listo para integrarse en la
 * navegación compartida sin modificar `App.tsx`.
 */
export function ServicesFlowScreen({
  initialTab = 'explorar',
  userLocation = null,
  api = defaultApi,
  contact,
  onOpenEmergencies,
}: Props) {
  const [route, setRoute] = useState<ServicesRoute>({ screen: 'tab', tab: initialTab });
  const [refreshKey, setRefreshKey] = useState(0);
  const [mapOffers, setMapOffers] = useState<ServiceMapOffer[] | undefined>(undefined);
  const { ubicacion } = useUbicacion();
  const effectiveLocation: Coordinates | null =
    userLocation ??
    (ubicacion ? { latitude: ubicacion.latitude, longitude: ubicacion.longitude } : null);

  useEffect(() => {
    let active = true;
    const emergenciesApi = createEmergenciesApi(supabase);
    Promise.all([
      loadMapOffers(api).catch(() => null),
      emergenciesApi.loadFeed().catch(() => null),
      emergenciesApi.loadSupport().catch(() => null),
    ]).then(([offers, feedRes, supportRes]) => {
      if (!active) return;
      if (!offers && (!feedRes || !feedRes.ok) && (!supportRes || !supportRes.ok)) {
        setMapOffers(undefined);
        return;
      }
      const combined: ServiceMapOffer[] = [...(offers ?? [])];
      if (feedRes?.ok) {
        const emergencyPoints = toEmergencyMapPoints(feedRes.data.items);
        for (const p of emergencyPoints) {
          if (p.kind !== 'emergencia') continue;
          combined.push({
            id: `emergencia:${p.id}`,
            nombre: p.nombre,
            descripcion: p.descripcion,
            categoria: 'emergencia',
            latitud: p.latitud,
            longitud: p.longitud,
            etiquetaEstado: p.estado === 'en_atencion' ? 'En atención vecinal' : 'Alerta activa',
          });
        }
      }
      if (supportRes?.ok) {
        const resourcePoints = toResourceMapPoints(supportRes.data.resources);
        for (const r of resourcePoints) {
          if (r.kind !== 'recurso') continue;
          combined.push({
            id: `recurso:${r.id}`,
            nombre: r.nombre,
            descripcion: r.descripcion,
            categoria: 'recurso',
            latitud: r.latitud,
            longitud: r.longitud,
            etiquetaEstado: r.disponible ? 'Recurso disponible' : 'No disponible',
          });
        }
      }
      setMapOffers(combined);
    });
    return () => {
      active = false;
    };
  }, [api, refreshKey]);

  const goBackToTab = useCallback((tab: ServicesTab) => {
    setRefreshKey((k) => k + 1);
    setRoute({ screen: 'tab', tab });
  }, []);

  // Soporta el botón físico «Atrás» de Android cuando se está en Detalle o Editar.
  useEffect(() => {
    if (route.screen === 'tab') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.screen === 'detalle') {
        goBackToTab(route.returnTab);
        return true;
      }
      if (route.screen === 'editar') {
        if (route.fromDetail) setRoute({ screen: 'detalle', offerId: route.offerId, returnTab: route.fromDetail });
        else goBackToTab('mis_ofertas');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [route, goBackToTab]);

  if (route.screen === 'detalle') {
    return (
      <View style={styles.screen}>
        <View style={styles.backBar}>
          <Pressable
            accessibilityLabel="Volver a ofertas"
            accessibilityRole="button"
            onPress={() => goBackToTab(route.returnTab)}
            style={styles.backButton}
          >
            <AppIcon name="back" size={18} color={colors.primary} weight={2.2} />
            <Text style={styles.backButtonText}>Volver a ofertas</Text>
          </Pressable>
        </View>
        <OfferDetailScreen
          api={api}
          contact={contact}
          key={`detail-${route.offerId}`}
          offerId={route.offerId}
          userLocation={effectiveLocation}
          onEdit={() => setRoute({ screen: 'editar', offerId: route.offerId, fromDetail: route.returnTab })}
          onRetired={() => {
            setMapOffers(current => current?.filter(offer => offer.id !== route.offerId));
            goBackToTab(route.returnTab);
          }}
        />
      </View>
    );
  }

  if (route.screen === 'editar') {
    return (
      <View style={styles.screen}>
        <View style={styles.backBar}>
          <Pressable
            accessibilityLabel={route.fromDetail ? 'Volver al detalle' : 'Volver a mis ofertas'}
            accessibilityRole="button"
            onPress={() => {
              if (route.fromDetail) setRoute({ screen: 'detalle', offerId: route.offerId, returnTab: route.fromDetail });
              else goBackToTab('mis_ofertas');
            }}
            style={styles.backButton}
          >
            <AppIcon name="back" size={18} color={colors.primary} weight={2.2} />
            <Text style={styles.backButtonText}>{route.fromDetail ? 'Volver al detalle' : 'Volver a mis ofertas'}</Text>
          </Pressable>
        </View>
        <EditOfferScreen
          api={api}
          key={`edit-${route.offerId}`}
          offerId={route.offerId}
          onSaved={() => {
            setRefreshKey((k) => k + 1);
          }}
        />
      </View>
    );
  }

  const activeTab = route.tab;

  function selectTab(tab: ServicesTab) {
    if (tab !== activeTab) {
      setRefreshKey((k) => k + 1);
    }
    setRoute({ screen: 'tab', tab });
  }

  function handleOpenOffer(offer: Offer) {
    setRoute({ screen: 'detalle', offerId: offer.id, returnTab: activeTab });
  }

  function handleEditOffer(offer: Offer) {
    setRoute({ screen: 'editar', offerId: offer.id });
  }

  return (
    <View style={styles.screen}>
      <View
        accessibilityLabel="Secciones de servicios y productos"
        accessibilityRole="tablist"
        style={styles.tabBar}
      >
        {TABS.map((t) => {
          const selected = activeTab === t.value;
          return (
            <Pressable
              accessibilityLabel={t.label}
              accessibilityRole="tab"
              aria-selected={selected}
              key={t.value}
              onPress={() => selectTab(t.value)}
              style={[styles.tabButton, selected && styles.tabButtonSelected]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.body}>
        {activeTab === 'explorar' && (
          <OfferListScreen
            api={api}
            key={`list-${refreshKey}`}
            onOpenOffer={handleOpenOffer}
            userLocation={effectiveLocation}
          />
        )}
        {activeTab === 'mapa' && (
          <MapaServicios
            key={`map-${refreshKey}`}
            ofertas={mapOffers}
            onVerDetalles={(offerId) => {
              if (offerId.startsWith('emergencia:')) {
                onOpenEmergencies?.('alertas');
                return;
              }
              if (offerId.startsWith('recurso:')) {
                onOpenEmergencies?.('apoyo');
                return;
              }
              setRoute({ screen: 'detalle', offerId, returnTab: 'mapa' });
            }}
          />
        )}
        {activeTab === 'publicar' && (
          <PublishOfferScreen
            api={api}
            onPublished={() => setRefreshKey((k) => k + 1)}
            userLocation={effectiveLocation}
          />
        )}
        {activeTab === 'mis_ofertas' && (
          <MyOffersScreen
            api={api}
            key={`mine-${refreshKey}`}
            onEditOffer={handleEditOffer}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  tabBar: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tabButton: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 3,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  tabButtonSelected: { borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 15, fontWeight: '500' },
  tabTextSelected: { color: colors.primary, fontWeight: '700' },
  body: { flex: 1 },
  backBar: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
