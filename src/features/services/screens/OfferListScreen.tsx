import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { offersApi as defaultApi } from '../data';
import type { OffersApi } from '../data/offersApi';
import type { Offer } from '../data/offerTypes';
import { formatDistance, type Coordinates } from '../distance/distance';
import {
  DEFAULT_OFFER_FILTER,
  filterOfferListItems,
  type OfferFilter,
  type OfferKindFilter,
} from '../list/filterOffers';
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

const KIND_FILTERS: { value: OfferKindFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'servicio', label: 'Servicios' },
  { value: 'producto', label: 'Productos' },
];

/** Listado de ofertas activas con búsqueda, filtro por tipo, calificación y distancia (bloque 2 del issue #2). */
export function OfferListScreen({ userLocation = null, onOpenOffer, api = defaultApi }: Props) {
  const { state, reload } = useListLoader(() => loadOfferListItems(api));
  const [filter, setFilter] = useState<OfferFilter>(DEFAULT_OFFER_FILTER);

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
        {(items) => {
          const filtered = filterOfferListItems(items, filter);
          return (
            <View style={styles.content}>
              <View style={styles.controls}>
                <TextInput
                  accessibilityLabel="Buscar ofertas"
                  onChangeText={(query) => setFilter((prev) => ({ ...prev, query }))}
                  placeholder="Buscar por título o descripción"
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  value={filter.query}
                />
                <View
                  accessibilityLabel="Filtrar por tipo de oferta"
                  accessibilityRole="radiogroup"
                  style={styles.filterRow}
                >
                  {KIND_FILTERS.map((option) => {
                    const selected = filter.kind === option.value;
                    return (
                      <Pressable
                        accessibilityLabel={option.label}
                        accessibilityRole="radio"
                        aria-checked={selected}
                        key={option.value}
                        onPress={() => setFilter((prev) => ({ ...prev, kind: option.value }))}
                        style={[styles.filterChip, selected && styles.filterChipSelected]}
                      >
                        <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {filtered.length === 0 ? (
                <View style={styles.noMatches}>
                  <Text style={styles.noMatchesText}>
                    No encontramos ofertas que coincidan con tu búsqueda.
                  </Text>
                  <Pressable
                    accessibilityLabel="Ver todas las ofertas"
                    accessibilityRole="button"
                    onPress={() => setFilter(DEFAULT_OFFER_FILTER)}
                    style={styles.clearButton}
                  >
                    <Text style={styles.clearButtonText}>Ver todas las ofertas</Text>
                  </Pressable>
                </View>
              ) : (
                <FlatList
                  contentContainerStyle={styles.list}
                  data={filtered}
                  keyExtractor={(item) => item.offer.id}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <OfferCard item={item} onPress={onOpenOffer} userLocation={userLocation} />
                  )}
                />
              )}
            </View>
          );
        }}
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
  content: { flex: 1 },
  controls: { gap: 10, paddingBottom: 12, paddingHorizontal: 16 },
  searchInput: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 17,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 2,
    flex: 1,
    paddingVertical: 10,
  },
  filterChipSelected: { backgroundColor: colors.primarySurface, borderColor: colors.primary },
  filterChipText: { color: colors.text, fontSize: 16 },
  filterChipTextSelected: { fontWeight: '700' },
  noMatches: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  noMatchesText: { color: colors.text, fontSize: 18, textAlign: 'center' },
  clearButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  clearButtonText: { color: colors.onPrimary, fontSize: 17, fontWeight: '600' },
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
