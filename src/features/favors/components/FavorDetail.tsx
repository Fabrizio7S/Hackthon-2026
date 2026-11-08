import { Text, TextInput, View } from 'react-native';
import { colors } from '../../../shared/theme';
import { requestLabels } from '../model/requests';
import { starValues, getOwnerDisplayName } from '../model/presentation';
import { Button } from './FavorButton';
import { Badge } from './FavorBadge';
import { ResourceArt } from './ResourceArt';
import { styles } from '../styles/favors.styles';
import { actor } from '../model/navigation';
import type { FavorsModel } from '../hooks/useFavorsController';

export function FavorDetail({ model }: { model: FavorsModel }) {
  const {
    userId,
    detail,
    setDetail,
    saved,
    contactError,
    reviewStars,
    setReviewStars,
    reviewComment,
    setReviewComment,
    savingReview,
    reviewSuccess,
    handleDeletePublication,
    toggleSaved,
    handleRequestFavor,
    handleSubmitReview,
    openWhatsApp,
    search,
    detailRequest,
    detailStatus,
    reviews,
    averageRating,
    client,
  } = model;
  if (!detail) return null;
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <Button icon="back" label="Volver" onPress={() => setDetail(null)} />
      </View>
      <View style={styles.card}>
        <View>
          <ResourceArt item={detail} />
          {detailStatus && (
            <View style={styles.detailBadge}>
              <Badge label={detailStatus} />
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.eyebrow}>{detail.kind.toUpperCase()}</Text>
          <Text accessibilityRole="header" style={styles.cardTitle}>
            {detail.title}
          </Text>
          <View style={styles.publisher}>
            <Text style={styles.publisherName}>Publicado por {getOwnerDisplayName(detail)}</Text>
            <View style={styles.row}>
              {averageRating && (
                <Text aria-hidden style={styles.stars}>
                  ★
                </Text>
              )}
              <Text style={styles.muted}>
                {averageRating
                  ? `${averageRating} de 5 · ${reviews.length} reseñas`
                  : 'Sin calificaciones'}
              </Text>
            </View>
          </View>
          <Text style={styles.muted}>{detail.location}</Text>
          <Text style={styles.body}>{detail.description}</Text>
          <Text style={styles.notice}>{detail.terms}</Text>
          {detailRequest && <Badge label={requestLabels[detailRequest.status]} />}
          <View style={styles.row}>
            {detail.owner !== actor &&
              detailStatus === 'Disponible' &&
              (!detailRequest || detailRequest.status === 'closed') && (
                <Button
                  primary
                  label={`Solicitar ${detail.kind.toLowerCase()}`}
                  onPress={() => handleRequestFavor(detail)}
                />
              )}
            {detail.owner !== actor &&
              (detailStatus === 'Disponible' || detailRequest?.status === 'accepted') && (
                <Button icon="chat" label="Abrir WhatsApp" onPress={() => openWhatsApp(detail)} />
              )}
            {detail.owner !== actor && (
              <Button
                label={saved.includes(detail.id) ? 'Quitar de guardadas' : 'Guardar publicación'}
                onPress={() => toggleSaved(detail.id)}
              />
            )}
            {detail.owner === actor && detailStatus === 'Disponible' && (
              <Button label="Retirar publicación" onPress={() => handleDeletePublication(detail)} />
            )}
          </View>
          {detail.owner !== actor &&
            (detailStatus === 'Disponible' || detailRequest?.status === 'accepted') && (
              <Text style={styles.muted}>
                Elige el contacto en WhatsApp. El mensaje queda listo para enviar.
              </Text>
            )}
          {contactError && (
            <Text accessibilityRole="alert" style={styles.notice}>
              No se pudo abrir WhatsApp. Vuelve a intentarlo.
            </Text>
          )}
        </View>
      </View>
      {detail.owner !== actor && client && userId && (
        <View style={[styles.card, styles.cardBody]}>
          <Text accessibilityRole="header" style={styles.cardTitle}>
            Dejar visto bueno y reseña
          </Text>
          <Text style={styles.muted}>
            Comparte cómo fue tu coordinación con {getOwnerDisplayName(detail)}.
          </Text>
          <View style={styles.row}>
            {starValues.map((star) => (
              <Button
                key={star}
                label={`${star} ★`}
                selected={reviewStars === star}
                onPress={() => setReviewStars(star)}
              />
            ))}
          </View>
          <TextInput
            accessibilityLabel="Comentario de reseña"
            placeholder="Ej. Coordinamos puntual y todo salió excelente."
            placeholderTextColor={colors.textMuted}
            value={reviewComment}
            onChangeText={setReviewComment}
            maxLength={300}
            style={styles.search}
          />
          {reviewSuccess && (
            <Text style={styles.notice}>¡Gracias! Tu visto bueno se guardó en la comunidad.</Text>
          )}
          <View style={styles.row}>
            <Button
              primary
              disabled={savingReview || !reviewComment.trim()}
              label={savingReview ? 'Guardando…' : 'Guardar reseña'}
              onPress={() => void handleSubmitReview(detail)}
            />
          </View>
        </View>
      )}
      <View style={[styles.card, styles.cardBody]}>
        <Text accessibilityRole="header" style={styles.cardTitle}>
          Reseñas sobre {getOwnerDisplayName(detail)}
        </Text>
        {reviews.length > 0 ? (
          <>
            <Text style={styles.muted}>Calificaciones y reseñas vecinales</Text>
            {reviews.map((review, index) => (
              <View key={review.id ?? `${review.author}-${index}`} style={styles.review}>
                <View style={styles.row}>
                  <Text style={styles.publisherName}>{review.author}</Text>
                  <Text accessibilityLabel={`${review.stars} de 5 estrellas`} style={styles.stars}>
                    {'★'.repeat(review.stars)}
                    {'☆'.repeat(5 - review.stars)}
                  </Text>
                </View>
                <Text style={styles.body}>{review.comment}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.muted}>Aún no hay reseñas.</Text>
        )}
      </View>
    </View>
  );
}
