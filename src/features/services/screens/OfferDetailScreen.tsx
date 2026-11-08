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
import { colors } from '../theme';

type Props = {
  offerId: string;
  /** Ubicación del vecino; sin ella no se muestra distancia. */
  userLocation?: Coordinates | null;
  /** Para pruebas; por defecto usa el Supabase compartido. */
  api?: Pick<OffersApi, 'getById' | 'ratingSummaries'>;
  /** Para pruebas; por defecto abre el marcador o WhatsApp. */
  contact?: typeof openContact;
};

type Detail = { offer: Offer; rating: Summary | null | undefined };

const KIND_LABEL = { servicio: 'Servicio', producto: 'Producto' } as const;

async function loadDetail(api: NonNullable<Props['api']>, offerId: string): Promise<Detail[]> {
  const offer = await api.getById(offerId);
  if (!offer.ok) throw new ListLoadError(offer.error.message);
  const summaries = await api.ratingSummaries([offerId]);
  const rating = summaries.ok ? (summaries.data[0] ?? null) : undefined;
  // Se reutilizan los estados del listado con un único elemento.
  return [{ offer: offer.data, rating }];
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
        {([detail]) => <DetailContent contact={contact} detail={detail} userLocation={userLocation} />}
      </ListStateView>
    </View>
  );
}

function DetailContent({
  detail,
  userLocation,
  contact,
}: {
  detail: Detail;
  userLocation: Coordinates | null;
  contact: typeof openContact;
}) {
  const { offer, rating } = detail;
  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const distance = formatDistance(userLocation, offer.location);
  const retired = offer.status === 'retirada';

  async function handleContact(channel: ContactChannel) {
    setContactMessage(null);
    const result = await contact(channel, offer.contactPhone);
    if (result.status !== 'abierto') setContactMessage(CONTACT_MESSAGES[result.status]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.kind}>{KIND_LABEL[offer.kind]}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {offer.title}
      </Text>

      <View style={styles.meta}>
        {rating !== undefined && (
          <RatingSummary average={rating?.average} count={rating?.count} maxStars={5} />
        )}
        {distance && <Text style={styles.muted}>{distance}</Text>}
      </View>

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
            <ContactButton label="Llamar" onPress={() => void handleContact('llamada')} />
            <ContactButton label="WhatsApp" onPress={() => void handleContact('whatsapp')} />
          </View>
          {contactMessage && (
            <Text accessibilityRole="alert" style={styles.contactError}>
              {contactMessage}
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

function ContactButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  kind: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySurface,
    borderRadius: 6,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 8 },
  meta: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 8 },
  muted: { color: colors.textMuted, fontSize: 16 },
  description: { color: colors.text, fontSize: 17, lineHeight: 24, marginTop: 16 },
  label: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 24 },
  phone: { color: colors.text, fontSize: 20, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    flex: 1,
    paddingVertical: 16,
  },
  buttonText: { color: colors.onPrimary, fontSize: 18, fontWeight: '700' },
  contactError: {
    backgroundColor: colors.dangerSurface,
    borderRadius: 8,
    color: colors.danger,
    fontSize: 16,
    marginTop: 16,
    padding: 12,
  },
  retired: {
    backgroundColor: colors.dangerSurface,
    borderRadius: 8,
    color: colors.danger,
    fontSize: 16,
    marginTop: 24,
    padding: 12,
  },
});
