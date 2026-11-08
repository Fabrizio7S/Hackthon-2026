import { Pressable, Text, View } from 'react-native';
import type { Offer } from '../data/offerTypes';
import { formatDistance, type Coordinates } from '../distance/distance';
import { type OfferListItem } from '../list/offerListItems';
import { RatingSummary } from '../rating/RatingSummary';
import { colors } from '../theme';
import { AppIcon } from '../../../shared/ui/AppIcon';
import { styles } from '../styles/list.styles';

export const KIND_LABEL = { servicio: 'Servicio', producto: 'Producto' } as const;

export function OfferCard({
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
