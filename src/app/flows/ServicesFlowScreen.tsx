import { useNeighborhoodMapPoints } from '../hooks/useNeighborhoodMapPoints';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import type { openContact } from '../../features/services/contact/openContact';
import { offersApi as defaultApi } from '../../features/services/data';
import type { OffersApi } from '../../features/services/data/offersApi';
import type { Offer } from '../../features/services/data/offerTypes';
import type { Coordinates } from '../../features/services/distance/distance';
import { colors } from '../../features/services/theme';
import { AppIcon } from '../../shared/ui/AppIcon';
import { useUbicacion } from '../../shared/location/useUbicacion';
import MapaServicios from '../../features/mapa/screens/MapaServicios';
import { crearSesionMapa } from '../../features/mapa/model/mapSession';
import { EditOfferScreen } from '../../features/services/screens/EditOfferScreen';
import { MyOffersScreen } from '../../features/services/screens/MyOffersScreen';
import { OfferDetailScreen } from '../../features/services/screens/OfferDetailScreen';
import { OfferListScreen } from '../../features/services/screens/OfferListScreen';
import { PublishOfferScreen } from '../../features/services/screens/PublishOfferScreen';
import { styles } from '../../features/services/styles/flow.styles';
import { type ServicesTab, type ServicesRoute } from '../navigation/services.routes';
import { TABS } from '../navigation/services.tabs';

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

export function ServicesFlowScreen({
  initialTab = 'explorar',
  userLocation = null,
  api = defaultApi,
  contact,
  onOpenEmergencies,
}: Props) {
  const [route, setRoute] = useState<ServicesRoute>({ screen: 'tab', tab: initialTab });
  const [refreshKey, setRefreshKey] = useState(0);
  const { mapOffers, setMapOffers } = useNeighborhoodMapPoints(api, refreshKey);
  // Búsqueda, filtro, selección y cámara del mapa sobreviven a abrir un detalle y volver.
  const mapaSesion = useRef(crearSesionMapa());
  const { ubicacion } = useUbicacion();
  const effectiveLocation: Coordinates | null =
    userLocation ??
    (ubicacion ? { latitude: ubicacion.latitude, longitude: ubicacion.longitude } : null);

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
        if (route.fromDetail)
          setRoute({ screen: 'detalle', offerId: route.offerId, returnTab: route.fromDetail });
        else goBackToTab('mis_ofertas');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [route, goBackToTab]);

  if (route.screen === 'detalle') {
    const textoVolver =
      route.returnTab === 'mapa'
        ? 'Volver al mapa'
        : route.returnTab === 'mis_ofertas'
          ? 'Volver a mis ofertas'
          : 'Volver a ofertas';
    return (
      <View style={styles.screen}>
        <View style={styles.backBar}>
          <Pressable
            accessibilityLabel={textoVolver}
            accessibilityRole="button"
            onPress={() => goBackToTab(route.returnTab)}
            style={styles.backButton}
          >
            <AppIcon name="back" size={18} color={colors.primary} weight={2.2} />
            <Text style={styles.backButtonText}>{textoVolver}</Text>
          </Pressable>
        </View>
        <OfferDetailScreen
          api={api}
          contact={contact}
          key={`detail-${route.offerId}`}
          offerId={route.offerId}
          userLocation={effectiveLocation}
          onEdit={() =>
            setRoute({ screen: 'editar', offerId: route.offerId, fromDetail: route.returnTab })
          }
          onRetired={() => {
            setMapOffers((current) => current?.filter((offer) => offer.id !== route.offerId));
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
              if (route.fromDetail)
                setRoute({
                  screen: 'detalle',
                  offerId: route.offerId,
                  returnTab: route.fromDetail,
                });
              else goBackToTab('mis_ofertas');
            }}
            style={styles.backButton}
          >
            <AppIcon name="back" size={18} color={colors.primary} weight={2.2} />
            <Text style={styles.backButtonText}>
              {route.fromDetail ? 'Volver al detalle' : 'Volver a mis ofertas'}
            </Text>
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
            sesion={mapaSesion.current}
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
          <MyOffersScreen api={api} key={`mine-${refreshKey}`} onEditOffer={handleEditOffer} />
        )}
      </View>
    </View>
  );
}
