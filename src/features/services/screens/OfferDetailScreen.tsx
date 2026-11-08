import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  CONTACT_MESSAGES,
  openContact,
  type ContactChannel,
} from '../contact/openContact';
import { offersApi as defaultApi } from '../data';
import type { OffersApi } from '../data/offersApi';
import type { Offer, RatingSummary as Summary } from '../data/offerTypes';
import { formatDistance, type Coordinates } from '../distance/distance';
import { ListLoadError } from '../list/listLoader';
import { ListStateView } from '../list/ListStateView';
import { useListLoader } from '../list/useListLoader';
import { RatingSummary } from '../rating/RatingSummary';
import { StarRatingInput } from '../rating/StarRatingInput';
import { useSubmitOnce } from '../submit/useSubmitOnce';
import { colors } from '../theme';
import { AppIcon, type IconName } from '../../../shared/AppIcon';
import { fonts } from '../../../shared/theme';

type Props = {
  offerId: string;
  /** Ubicación del vecino; sin ella no se muestra distancia. */
  userLocation?: Coordinates | null;
  /** Para pruebas; por defecto usa el Supabase compartido. */
  api?: Pick<OffersApi, 'getById' | 'ratingSummaries' | 'rate'> &
    Partial<Pick<OffersApi, 'viewerRating' | 'getAuthorName'>>;
  /** Para pruebas; por defecto abre el marcador o WhatsApp. */
  contact?: typeof openContact;
};

type Detail = {
  offer: Offer;
  rating: Summary | null | undefined;
  viewerUserId: string | null;
  myStars: number;
  /** Nombre de quien publicó; null si no se pudo obtener (no bloquea el detalle). */
  authorName: string | null;
};

const KIND_LABEL = { servicio: 'Servicio', producto: 'Producto' } as const;

async function loadDetail(api: NonNullable<Props['api']>, offerId: string): Promise<Detail[]> {
  const offer = await api.getById(offerId);
  if (!offer.ok) throw new ListLoadError(offer.error.message);
  const summaries = await api.ratingSummaries([offerId]);
  const rating = summaries.ok ? (summaries.data[0] ?? null) : undefined;
  const viewer = api.viewerRating ? await api.viewerRating(offerId) : null;
  const viewerUserId = viewer?.ok ? viewer.data.userId : null;
  const myStars = viewer?.ok && viewer.data.stars ? viewer.data.stars : 0;
  const author = api.getAuthorName ? await api.getAuthorName(offer.data.authorId) : null;
  const authorName = author?.ok ? author.data : null;
  // Se reutilizan los estados del listado con un único elemento.
  return [{ offer: offer.data, rating, viewerUserId, myStars, authorName }];
}

/**
 * Detalle de una oferta con contacto por llamada o WhatsApp (bloques 2 y 3 del issue #2).
 * Abrir el contacto no registra contratación ni servicio completado.
 */
export function OfferDetailScreen({
  offerId,
  userLocation = null,
  api = defaultApi,
  contact = openContact,
}: Props) {
  const { state, reload } = useListLoader(() => loadDetail(api, offerId));

  return (
    <View style={styles.screen}>
      <ListStateView emptyMessage="Esta oferta ya no está disponible." onRetry={() => void reload()} state={state}>
        {([detail]) => (
          <DetailContent api={api} contact={contact} detail={detail} userLocation={userLocation} />
        )}
      </ListStateView>
    </View>
  );
}

function DetailContent({
  detail,
  userLocation,
  contact,
  api,
}: {
  detail: Detail;
  userLocation: Coordinates | null;
  contact: typeof openContact;
  api: NonNullable<Props['api']>;
}) {
  const { offer } = detail;
  const [rating, setRating] = useState(detail.rating);
  const [myStars, setMyStars] = useState(detail.myStars);
  const [rateMessage, setRateMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const isOwnOffer = Boolean(detail.viewerUserId && detail.viewerUserId === offer.authorId);

  // Califica y, solo si el servidor lo confirma, vuelve a pedir el resumen (issue, bloque 4).
  const { submit: rate, submitting: sendingRating } = useSubmitOnce(async (stars: number) => {
    setRateMessage(null);
    const result = await api.rate(offer.id, stars);
    if (!result.ok) {
      setRateMessage({ ok: false, text: result.error.message });
      return;
    }
    setMyStars(stars);
    const summaries = await api.ratingSummaries([offer.id]);
    setRating(summaries.ok ? (summaries.data[0] ?? null) : undefined);
    setRateMessage({
      ok: true,
      text: `Calificaste con ${stars} ${stars === 1 ? 'estrella' : 'estrellas'}.`,
    });
  });
  const distance = formatDistance(userLocation, offer.location);
  const retired = offer.status === 'retirada';

  async function handleContact(channel: ContactChannel) {
    setContactMessage(null);
    const result = await contact(channel, offer.contactPhone);
    if (result.status !== 'abierto') setContactMessage(CONTACT_MESSAGES[result.status]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: offer.kind === 'producto' ? colors.claySurface : colors.primarySurface }]}>
        <View style={[styles.heroArch, { backgroundColor: offer.kind === 'producto' ? colors.clay : colors.primary }]}>
          <AppIcon name={offer.kind === 'producto' ? 'bag' : 'services'} size={48} color={colors.lime} weight={1.4} />
        </View>
        <Text style={[styles.kind, { color: offer.kind === 'producto' ? colors.clay : colors.primary }]}>
          {KIND_LABEL[offer.kind].toUpperCase()}
        </Text>
      </View>
      <View style={styles.titleRow}>
        <Text accessibilityRole="header" style={styles.title}>
          {offer.title}
        </Text>
        {distance && <Text style={styles.distance}>{distance}</Text>}
      </View>

      <Text style={styles.author} testID="offer-author">
        {isOwnOffer
          ? 'Publicado por ti'
          : detail.authorName
            ? `Publicado por ${detail.authorName}`
            : 'Publicado por un vecino'}
      </Text>

      {rating !== undefined && (
        <View style={styles.meta}>
          <RatingSummary average={rating?.average} count={rating?.count} maxStars={5} />
        </View>
      )}

      {offer.description && <Text style={styles.description}>{offer.description}</Text>}

      {retired ? (
        <Text accessibilityRole="alert" style={styles.retired}>
          Esta oferta fue retirada y no está disponible.
        </Text>
      ) : (
        <>
          <Text style={styles.label}>Contacto</Text>
          <Text selectable style={styles.phone}>
            {offer.contactPhone}
          </Text>
          <View style={styles.actions}>
            <ContactButton icon="phone" label="Llamar" onPress={() => void handleContact('llamada')} />
            <ContactButton icon="chat" label="WhatsApp" outline onPress={() => void handleContact('whatsapp')} />
          </View>
          {contactMessage && (
            <Text accessibilityRole="alert" style={styles.contactError}>
              {contactMessage}
            </Text>
          )}

          <Text style={styles.label}>Califica esta oferta</Text>
          {isOwnOffer ? (
            <Text style={styles.muted}>Es tu oferta; otros vecinos pueden calificarla.</Text>
          ) : (
            <>
              <StarRatingInput disabled={sendingRating} onSelect={(stars) => void rate(stars)} value={myStars} />
              {rateMessage && (
                <Text
                  accessibilityRole="alert"
                  style={rateMessage.ok ? styles.rateOk : styles.contactError}
                >
                  {rateMessage.text}
                </Text>
              )}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function ContactButton({ label, icon, outline = false, onPress }: { label: string; icon: IconName; outline?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, outline && styles.buttonOutline, pressed && { opacity: 0.75 }]}
    >
      <AppIcon name={icon} size={20} color={outline ? colors.primary : colors.onPrimary} weight={2} />
      <Text style={[styles.buttonText, outline && { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 20, paddingBottom: 40, width: '100%', maxWidth: 760, alignSelf: 'center' },
  hero: { alignItems: 'center', borderRadius: 22, height: 190, justifyContent: 'flex-end', overflow: 'hidden' },
  heroArch: {
    alignItems: 'center',
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    height: 150,
    justifyContent: 'center',
    width: 160,
  },
  kind: {
    backgroundColor: colors.background,
    borderRadius: 6,
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    left: 12,
    letterSpacing: 1,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
    top: 12,
  },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, marginTop: 18 },
  title: { color: colors.text, flex: 1, fontSize: 27, fontWeight: '800', letterSpacing: -0.8, lineHeight: 30 },
  distance: {
    borderColor: colors.text,
    borderRadius: 6,
    borderWidth: 1.5,
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  author: { color: colors.textMuted, fontSize: 15, fontWeight: '600', marginTop: 8 },
  meta: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 10 },
  muted: { color: colors.textMuted, fontSize: 15, lineHeight: 21 },
  description: { color: '#3B5247', fontSize: 16, lineHeight: 24, marginTop: 14 },
  label: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 24 },
  phone: { color: colors.text, fontFamily: fonts.mono, fontSize: 19, letterSpacing: 1, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderRadius: 14,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonOutline: { backgroundColor: colors.background },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  contactError: {
    backgroundColor: colors.dangerSurface,
    borderRadius: 12,
    color: colors.danger,
    fontSize: 15,
    marginTop: 16,
    padding: 12,
  },
  rateOk: { color: colors.primary, fontSize: 15, fontWeight: '600', marginTop: 8 },
  retired: {
    backgroundColor: colors.dangerSurface,
    borderRadius: 12,
    color: colors.danger,
    fontSize: 15,
    marginTop: 24,
    padding: 12,
  },
});
