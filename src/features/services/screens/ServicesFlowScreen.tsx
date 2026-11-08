import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import type { openContact } from '../contact/openContact';
import { offersApi as defaultApi } from '../data';
import type { OffersApi } from '../data/offersApi';
import type { Offer } from '../data/offerTypes';
import type { Coordinates } from '../distance/distance';
import { loadMapOffers, type ServiceMapOffer } from '../map/toMapOffers';
import { colors } from '../theme';
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
  | { screen: 'editar'; offerId: string };

type Props = {
  /** Pestaña inicial al abrir el módulo de servicios y productos. */
  initialTab?: ServicesTab;
  /** Ubicación actual del vecino proporcionada por Persona 5. */
  userLocation?: Coordinates | null;
  /** API inyectable para pruebas; por defecto usa el cliente de Supabase compartido. */
  api?: OffersApi;
  /** Función de contacto inyectable para pruebas. */
  contact?: typeof openContact;
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
    loadMapOffers(api)
      .then((offers) => {
        if (active) setMapOffers(offers);
      })
      .catch(() => {
        if (active) setMapOffers(undefined);
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
        goBackToTab('mis_ofertas');
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
            <Text style={styles.backButtonText}>← Volver a ofertas</Text>
          </Pressable>
        </View>
        <OfferDetailScreen
          api={api}
          contact={contact}
          key={`detail-${route.offerId}`}
          offerId={route.offerId}
          userLocation={effectiveLocation}
        />
      </View>
    );
  }

  if (route.screen === 'editar') {
    return (
      <View style={styles.screen}>
        <View style={styles.backBar}>
          <Pressable
            accessibilityLabel="Volver a mis ofertas"
            accessibilityRole="button"
            onPress={() => goBackToTab('mis_ofertas')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Volver a mis ofertas</Text>
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
            onVerDetalles={(offerId) =>
              setRoute({ screen: 'detalle', offerId, returnTab: 'mapa' })
            }
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
  screen: { flex: 1, backgroundColor: colors.background },
  tabBar: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 2,
    flex: 1,
    paddingVertical: 10,
  },
  tabButtonSelected: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primary,
  },
  tabText: { color: colors.text, fontSize: 16 },
  tabTextSelected: { fontWeight: '700' },
  body: { flex: 1 },
  backBar: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
});
