import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { offersApi as defaultApi } from '../data';
import type { OffersApi } from '../data/offersApi';
import type { Offer } from '../data/offerTypes';
import { formatDistance, type Coordinates } from '../distance/distance';
import { ListStateView } from '../list/ListStateView';
import { loadOfferListItems, type OfferListItem } from '../list/offerListItems';
import { useListLoader } from '../list/useListLoader';
import { RatingSummary } from '../rating/RatingSummary';
import { colors } from '../theme';

type Props = {
  /** Ubicación del vecino; sin ella no se muestran distancias. */
  userLocation?: Coordinates | null;
  /** Abre el detalle de una oferta (navegación de Persona 5). */
  onOpenOffer?: (offer: Offer) => void;
  /** Para pruebas; por defecto usa el Supabase compartido. */
  api?: Pick<OffersApi, 'listActive' | 'ratingSummaries'>;
};

const KIND_LABEL = { servicio: 'Servicio', producto: 'Producto' } as const;

/** Listado de ofertas activas con calificación y distancia (bloque 2 del issue #2). */
export function OfferListScreen({ userLocation = null, onOpenOffer, api = defaultApi }: Props) {
  const { state, reload } = useListLoader(() => loadOfferListItems(api));

  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={styles.header}>
        Servicios y productos
      </Text>
      <ListStateView
        emptyMessage="Aún no hay ofertas en tu comunidad. ¡Sé el primero en publicar!"
        onRetry={() => void reload()}
        state={state}
      >
        {(items) => (
          <FlatList
            contentContainerStyle={styles.list}
            data={items}
            keyExtractor={(item) => item.offer.id}
            renderItem={({ item }) => (
              <OfferCard item={item} onPress={onOpenOffer} userLocation={userLocation} />
            )}
          />
        )}
      </ListStateView>
    </View>
  );
}

function OfferCard({
  item,
  userLocation,
  onPress,
}: {
  item: OfferListItem;
  userLocation: Coordinates | null;
  onPress?: (offer: Offer) => void;
}) {
  const { offer, rating } = item;
  const distance = formatDistance(userLocation, offer.location);

  return (
    <Pressable
      accessibilityHint={onPress ? 'Abre el detalle de la oferta' : undefined}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={() => onPress?.(offer)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Text style={styles.kind}>{KIND_LABEL[offer.kind]}</Text>
      <Text numberOfLines={2} style={styles.title}>
        {offer.title}
      </Text>
      <View style={styles.meta}>
        {rating !== undefined && (
          <RatingSummary average={rating?.average} count={rating?.count} maxStars={5} />
        )}
        {distance && <Text style={styles.distance}>{distance}</Text>}
      </View>
      {offer.description && (
        <Text numberOfLines={2} style={styles.description}>
          {offer.description}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { color: colors.text, fontSize: 24, fontWeight: '700', paddingHorizontal: 20, paddingVertical: 16 },
  list: { gap: 12, paddingBottom: 24, paddingHorizontal: 16 },
  card: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  cardPressed: { backgroundColor: colors.primarySurface },
  kind: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySurface,
    borderRadius: 6,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  meta: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 6 },
  distance: { color: colors.textMuted, fontSize: 15 },
  description: { color: colors.textMuted, fontSize: 15, marginTop: 6 },
});
