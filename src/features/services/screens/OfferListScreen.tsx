import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { offersApi as defaultApi } from '../data';
import type { OffersApi } from '../data/offersApi';
import type { Offer } from '../data/offerTypes';
import { type Coordinates } from '../distance/distance';
import {
  DEFAULT_OFFER_FILTER,
  filterOfferListItems,
  type OfferFilter,
  type OfferKindFilter,
} from '../list/filterOffers';
import { ListStateView } from '../list/ListStateView';
import { loadOfferListItems } from '../list/offerListItems';
import { useListLoader } from '../list/useListLoader';
import { colors } from '../theme';
import { AppIcon } from '../../../shared/ui/AppIcon';
import { TourTarget } from '../../../shared/ui/tour/TourTargets';
import { styles } from '../styles/list.styles';
import { OfferCard } from '../components/OfferCard';

type Props = {
  /** Ubicación del vecino; sin ella no se muestran distancias. */
  userLocation?: Coordinates | null;
  /** Abre el detalle de una oferta (navegación de Persona 5). */
  onOpenOffer?: (offer: Offer) => void;
  /** Para pruebas; por defecto usa el Supabase compartido. */
  api?: Pick<OffersApi, 'listActive' | 'ratingSummaries'> & Partial<Pick<OffersApi, 'authorNames'>>;
};

const KIND_FILTERS: { value: OfferKindFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'servicio', label: 'Servicios' },
  { value: 'producto', label: 'Productos' },
];

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
                          <View
                            style={[
                              styles.filterDot,
                              option.value === 'producto' && styles.filterDotProduct,
                            ]}
                          />
                        )}
                        <Text
                          style={[styles.filterChipText, selected && styles.filterChipTextSelected]}
                        >
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
