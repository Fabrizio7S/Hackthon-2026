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
import { AppIcon } from '../../../shared/AppIcon';
import { archRadius, fonts } from '../../../shared/theme';
import { TourTarget } from '../../../shared/TourTargets';

type Props = {
  /** Ubicación del vecino; sin ella no se muestran distancias. */
  userLocation?: Coordinates | null;
  /** Abre el detalle de una oferta (navegación de Persona 5). */
  onOpenOffer?: (offer: Offer) => void;
  /** Para pruebas; por defecto usa el Supabase compartido. */
  api?: Pick<OffersApi, 'listActive' | 'ratingSummaries'> & Partial<Pick<OffersApi, 'authorNames'>>;
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
    <TourTarget id="services-explorer" style={styles.screen}>
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>TALENTO A LA VUELTA</Text>
        <Text accessibilityRole="header" style={styles.header}>
          Servicios y productos
        </Text>
      </View>
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
                <View style={styles.searchBox}>
                  <AppIcon name="search" size={20} color={colors.textMuted} />
                  <TextInput
                    accessibilityLabel="Buscar ofertas"
                    onChangeText={(query) => setFilter((prev) => ({ ...prev, query }))}
                    placeholder="Buscar por título o descripción"
                    placeholderTextColor={colors.textMuted}
                    style={styles.searchInput}
                    value={filter.query}
                  />
                </View>
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
                        {option.value !== 'todos' && (
                          <View style={[styles.filterDot, option.value === 'producto' && styles.filterDotProduct]} />
                        )}
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
    </TourTarget>
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
  const { offer, rating, authorName } = item;
  const distance = formatDistance(userLocation, offer.location);

  const product = offer.kind === 'producto';
  const tint = product ? colors.claySurface : colors.primarySurface;
  const ink = product ? colors.clay : colors.primary;

  return (
    <Pressable
      accessibilityHint={onPress ? 'Abre el detalle de la oferta' : undefined}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={() => onPress?.(offer)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.thumb, { backgroundColor: tint }]}>
        <AppIcon name={product ? 'bag' : 'services'} size={26} color={ink} weight={1.7} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={[styles.kind, { color: ink }]}>{KIND_LABEL[offer.kind].toUpperCase()}</Text>
          {distance && <Text style={styles.distance}>{distance}</Text>}
        </View>
        <Text numberOfLines={2} style={styles.title}>
          {offer.title}
        </Text>
        {authorName && (
          <Text numberOfLines={1} style={styles.author}>
            Publicado por {authorName}
          </Text>
        )}
        {rating !== undefined && (
          <View style={styles.meta}>
            <RatingSummary average={rating?.average} count={rating?.count} maxStars={5} />
          </View>
        )}
        {offer.description && (
          <Text numberOfLines={2} style={styles.description}>
            {offer.description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  headerBlock: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 },
  eyebrow: { color: colors.primary, fontFamily: fonts.mono, fontSize: 11, fontWeight: '600', letterSpacing: 1.4 },
  header: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.9, marginTop: 4 },
  content: { flex: 1 },
  controls: { gap: 10, paddingBottom: 14, paddingHorizontal: 16 },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  searchInput: { color: colors.text, flex: 1, fontSize: 16, paddingVertical: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 7,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  filterChipSelected: { backgroundColor: colors.text, borderColor: colors.text },
  filterChipText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  filterChipTextSelected: { color: colors.background },
  filterDot: { backgroundColor: colors.primary, borderRadius: 4, height: 8, width: 8 },
  filterDotProduct: { backgroundColor: '#B5562F', borderRadius: 2 },
  noMatches: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  noMatchesText: { color: colors.text, fontSize: 18, textAlign: 'center' },
  clearButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  clearButtonText: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
  list: { gap: 12, paddingBottom: 28, paddingHorizontal: 16, width: '100%', maxWidth: 900, alignSelf: 'center' },
  card: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 13,
    padding: 12,
  },
  cardPressed: { backgroundColor: colors.primarySurface },
  thumb: { alignItems: 'center', justifyContent: 'center', minHeight: 76, width: 62, ...archRadius(62) },
  cardBody: { flex: 1, gap: 3, justifyContent: 'center', minWidth: 0 },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  kind: { fontFamily: fonts.mono, fontSize: 11, fontWeight: '600', letterSpacing: 0.8 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', lineHeight: 22 },
  author: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: 1 },
  meta: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 2 },
  distance: {
    borderColor: colors.text,
    borderRadius: 6,
    borderWidth: 1.5,
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 2 },
});
