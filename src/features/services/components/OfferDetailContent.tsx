import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CONTACT_MESSAGES, openContact, type ContactChannel } from '../contact/openContact';
import { formatDistance, type Coordinates } from '../distance/distance';
import { RatingSummary } from '../rating/RatingSummary';
import { StarRatingInput } from '../rating/StarRatingInput';
import { useSubmitOnce } from '../submit/useSubmitOnce';
import { colors } from '../theme';
import { AppIcon, type IconName } from '../../../shared/ui/AppIcon';
import { styles } from '../styles/detail.styles';
import { type Props, type Detail, KIND_LABEL } from '../model/offerDetail';

export function DetailContent({
  detail,
  userLocation,
  contact,
  api,
  onEdit,
  onRetired,
}: {
  detail: Detail;
  userLocation: Coordinates | null;
  contact: typeof openContact;
  api: NonNullable<Props['api']>;
  onEdit?: () => void;
  onRetired?: () => void;
}) {
  const { offer } = detail;
  const [rating, setRating] = useState(detail.rating);
  const [myStars, setMyStars] = useState(detail.myStars);
  const [rateMessage, setRateMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const [confirmRetire, setConfirmRetire] = useState(false);
  const [retireError, setRetireError] = useState<string | null>(null);
  const [retiredHere, setRetiredHere] = useState(false);
  const isOwnOffer = Boolean(detail.viewerUserId && detail.viewerUserId === offer.authorId);
  const { submit: retire, submitting: retiring } = useSubmitOnce(async () => {
    if (!isOwnOffer || !api.setStatus) return;
    setRetireError(null);
    const result = await api.setStatus(offer.id, 'retirada');
    if (!result.ok) {
      setRetireError(result.error.message);
      return;
    }
    setRetiredHere(true);
    setConfirmRetire(false);
    onRetired?.();
  });

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
  const retired = retiredHere || offer.status === 'retirada';

  async function handleContact(channel: ContactChannel) {
    setContactMessage(null);
    const result = await contact(channel, offer.contactPhone);
    if (result.status !== 'abierto') setContactMessage(CONTACT_MESSAGES[result.status]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: offer.kind === 'producto' ? colors.claySurface : colors.primarySurface,
          },
        ]}
      >
        <View
          style={[
            styles.heroArch,
            { backgroundColor: offer.kind === 'producto' ? colors.clay : colors.primary },
          ]}
        >
          <AppIcon
            name={offer.kind === 'producto' ? 'bag' : 'services'}
            size={48}
            color={colors.lime}
            weight={1.4}
          />
        </View>
        <Text
          style={[styles.kind, { color: offer.kind === 'producto' ? colors.clay : colors.primary }]}
        >
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

      {isOwnOffer && (
        <>
          <View style={styles.actions}>
            {onEdit && (
              <ContactButton
                icon="edit"
                label="Editar"
                outline
                onPress={onEdit}
                disabled={retiring}
              />
            )}
            {!retired && api.setStatus && !confirmRetire && (
              <ContactButton
                icon="close"
                label="Retirar oferta"
                outline
                onPress={() => setConfirmRetire(true)}
              />
            )}
          </View>
          {confirmRetire && (
            <>
              <Text style={styles.muted}>
                ¿Quieres retirar esta oferta del explorador y del mapa?
              </Text>
              {retireError && (
                <Text accessibilityRole="alert" style={styles.contactError}>
                  {retireError}
                </Text>
              )}
              <View style={styles.actions}>
                <ContactButton
                  icon="close"
                  label={retiring ? 'Retirando…' : 'Confirmar retiro'}
                  disabled={retiring}
                  onPress={() => void retire()}
                />
                <ContactButton
                  icon="back"
                  label="Cancelar"
                  outline
                  disabled={retiring}
                  onPress={() => {
                    setConfirmRetire(false);
                    setRetireError(null);
                  }}
                />
              </View>
            </>
          )}
        </>
      )}

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
            <ContactButton
              icon="phone"
              label="Llamar"
              onPress={() => void handleContact('llamada')}
            />
            <ContactButton
              icon="chat"
              label="WhatsApp"
              outline
              onPress={() => void handleContact('whatsapp')}
            />
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
              <StarRatingInput
                disabled={sendingRating}
                onSelect={(stars) => void rate(stars)}
                value={myStars}
              />
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

export function ContactButton({
  label,
  icon,
  outline = false,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: IconName;
  outline?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        outline && styles.buttonOutline,
        (pressed || disabled) && { opacity: 0.75 },
      ]}
    >
      <AppIcon
        name={icon}
        size={20}
        color={outline ? colors.primary : colors.onPrimary}
        weight={2}
      />
      <Text style={[styles.buttonText, outline && { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}
