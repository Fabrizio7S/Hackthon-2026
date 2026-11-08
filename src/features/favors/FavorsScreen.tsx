import { TourTarget } from '../../shared/TourTargets';
import type { SupabaseClient } from '@supabase/supabase-js';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import {
  ActivityIndicator, Animated, BackHandler, Image, Linking, PanResponder, Platform, Pressable, SafeAreaView, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';

import { useSessionIdentity } from '../../shared/IdentityContext';
import { AppIcon, type IconName } from '../../shared/AppIcon';
import { SkeletonCardList } from '../../shared/Skeleton';
import { archRadius, colors, fonts } from '../../shared/theme';
import {
  neighborReviews, neighbors, publications as demoPublications, publicationStatus, requestLabels, updateRequests,
  type FavorRequest, type Neighbor, type Publication, type Review,
} from './demo';
import {
  acceptFavorRequestRemote,
  cancelFavorRequestRemote,
  createFavorPublicationRemote,
  createFavorRequestRemote,
  createFavorReviewRemote,
  deleteFavorPublicationRemote,
  fetchFavorsData,
  finishFavorRequestRemote,
  toggleFavorSavedRemote,
  type FavorPublicationDraft,
} from './favorsService';

const tabs = ['Explorar', 'Guardadas', 'Mi actividad'] as const;
type Tab = (typeof tabs)[number];
const actor: Neighbor = 'ana';
const webSwipeStyle = { position: 'relative', touchAction: 'pan-y' } as const;
const ratingFormat = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const publicationKinds = ['Préstamo', 'Intercambio'] as const;
const starValues = [1, 2, 3, 4, 5] as const;

function getOwnerDisplayName(item: Publication): string {
  return item.ownerName || neighbors[item.owner];
}

function getRequesterDisplayName(request: FavorRequest): string {
  return request.requesterName || neighbors[request.requester];
}

function Button({ label, onPress, primary = false, selected, disabled = false, icon, iconAfter = false }: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  selected?: boolean;
  disabled?: boolean;
  icon?: IconName;
  iconAfter?: boolean;
}) {
  const active = primary || selected;
  const glyph = icon ? <AppIcon name={icon} size={16} color={active ? colors.onPrimary : colors.primary} weight={2.2} /> : null;
  return (
    <Pressable
      accessibilityRole="button"
      aria-pressed={selected}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, (primary || selected) && styles.buttonActive, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {!iconAfter && glyph}
      <Text style={[styles.buttonText, active && styles.buttonTextActive]}>{label}</Text>
      {iconAfter && glyph}
    </Pressable>
  );
}

function Badge({ label }: { label: string }) {
  return <Text style={styles.badge}>{label}</Text>;
}

/** Tono e icono por tipo: préstamo en teja, intercambio en bosque. */
function kindLook(kind: Publication['kind']) {
  return kind === 'Intercambio'
    ? { tint: colors.primarySurface, ink: colors.primary, icon: 'swap' as const }
    : { tint: colors.claySurface, ink: colors.clay, icon: 'box' as const };
}

function ResourceArt({ item, compact = false, inset = false }: { item: Publication; compact?: boolean; inset?: boolean }) {
  const look = kindLook(item.kind);
  return (
    <View accessible={false} style={[styles.art, { backgroundColor: look.tint }, compact && [styles.artCompact, { borderRightColor: look.ink }], inset && styles.deckArt]}>
      {compact && !item.imageUri && <View style={[styles.tagHole, { borderColor: look.ink }]} />}
      {item.imageUri ? (
        <Image
          accessibilityLabel={`Imagen de ${item.title}`}
          source={{ uri: item.imageUri }}
          resizeMode="contain"
          style={styles.resourceImage}
        />
      ) : (
        compact ? (
          <AppIcon name={look.icon} size={30} color={look.ink} weight={1.7} />
        ) : (
          <View style={[styles.artArch, { backgroundColor: look.ink }]}>
            <AppIcon name={look.icon} size={46} color={colors.lime} weight={1.5} />
          </View>
        )
      )}
    </View>
  );
}

function PublicationForm({ onCancel, onPublish, submitting = false }: {
  onCancel: () => void;
  onPublish: (draft: FavorPublicationDraft) => void;
  submitting?: boolean;
}) {
  const [kind, setKind] = useState<Publication['kind']>('Préstamo');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string>();
  const [imageBase64, setImageBase64] = useState<string>();
  const [imageError, setImageError] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const missingFields = !title.trim() || !description.trim();

  async function chooseImage() {
    setImageError(false);
    try {
      const result = await launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, base64: true });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 ?? undefined);
      }
    } catch {
      setImageError(true);
    }
  }

  function publish() {
    setAttempted(true);
    if (missingFields || submitting) return;
    onPublish({ kind, title: title.trim(), description: description.trim(), imageUri, imageBase64 });
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Button icon="back" label="Volver" disabled={submitting} onPress={onCancel} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>Crear publicación</Text>
      <View style={[styles.card, styles.form]}>
        <Text style={styles.publisherName}>Tipo de publicación</Text>
        <View style={styles.row}>
          {publicationKinds.map((option) => (
            <Button key={option} label={option} selected={kind === option} onPress={() => setKind(option)} />
          ))}
        </View>
        <Text style={styles.publisherName}>Título</Text>
        <TextInput
          accessibilityLabel="Título"
          placeholder="Ej. Caja de herramientas"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={80}
          style={styles.search}
        />
        <Text style={styles.publisherName}>Descripción</Text>
        <TextInput
          accessibilityLabel="Descripción"
          placeholder="Cuenta qué prestas o qué te gustaría intercambiar."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          maxLength={600}
          multiline
          style={[styles.search, styles.descriptionInput]}
        />
        <Text style={styles.publisherName}>Imagen (opcional)</Text>
        {imageUri && (
          <Image
            accessibilityLabel="Vista previa de la imagen"
            source={{ uri: imageUri }}
            resizeMode="contain"
            style={styles.imagePreview}
          />
        )}
        <View style={styles.row}>
          <Button label={imageUri ? 'Cambiar imagen' : 'Seleccionar imagen'} onPress={() => void chooseImage()} />
          {imageUri && (
            <Button
              label="Quitar imagen"
              onPress={() => {
                setImageUri(undefined);
                setImageBase64(undefined);
              }}
            />
          )}
        </View>
        {imageError && (
          <Text accessibilityRole="alert" style={styles.notice}>No se pudo seleccionar la imagen. Inténtalo de nuevo.</Text>
        )}
        {attempted && missingFields && (
          <Text accessibilityRole="alert" style={styles.notice}>Completa el título y la descripción para publicar.</Text>
        )}
        <Button primary disabled={submitting} label={submitting ? 'Publicando…' : 'Publicar'} onPress={publish} />
      </View>
    </View>
  );
}

export function FavorsScreen({ client = null, initialCreating = false }: { client?: SupabaseClient | null; initialCreating?: boolean }) {
  const identity = useSessionIdentity();
  const userId = identity.status === 'authenticated' ? identity.user.id : null;
  const userEmail = identity.status === 'authenticated' ? identity.user.email : undefined;
  const communityId: string | null = null;
  // Con cuenta y cliente, los datos son siempre los de la comunidad; los ejemplos solo existen sin conexión al servicio.
  const remoteMode = Boolean(client && userId);

  const [tab, setTab] = useState<Tab>('Explorar');
  const [detail, setDetail] = useState<Publication | null>(null);
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<'Tarjetas' | 'Lista'>('Tarjetas');
  const [cardIndex, setCardIndex] = useState(0);
  const [cardOffset] = useState(() => new Animated.Value(0));
  const [saved, setSaved] = useState<string[]>([]);
  const [requests, dispatch] = useReducer(updateRequests, []);
  const [contactError, setContactError] = useState(false);
  const [creating, setCreating] = useState(initialCreating);
  const [submitting, setSubmitting] = useState(false);
  const [localPublications, setLocalPublications] = useState<Publication[]>([]);
  const [remotePublications, setRemotePublications] = useState<Publication[] | null>(null);
  const [remoteReviews, setRemoteReviews] = useState<Review[] | null>(null);
  const [userName, setUserName] = useState<string>(remoteMode ? 'Vecino' : 'Ana');
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  // Hasta recibir la primera respuesta no se muestra contenido, para no enseñar publicaciones ajenas.
  const initialLoading = remoteMode && remotePublications === null && syncError === null;

  // Estado del formulario de reseña en detalle
  const [reviewStars, setReviewStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const loadRemoteData = useCallback(async () => {
    if (!client || !userId) return;
    setLoadingRemote(true);
    setSyncError(null);
    try {
      const data = await fetchFavorsData(client, userId, userEmail);
      setUserName(data.userName);
      setRemotePublications(data.publications);
      setSaved(data.savedIds);
      setRemoteReviews(data.reviews);
      dispatch({ type: 'hydrate', requests: data.requests });
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'No se pudo sincronizar con Supabase.');
    } finally {
      setLoadingRemote(false);
    }
  }, [client, userId, userEmail]);

  useEffect(() => {
    void loadRemoteData();
  }, [loadRemoteData]);

  useEffect(() => {
    if (!detail && !creating) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      setCreating(false);
      setDetail(null);
      return true;
    });
    return () => listener.remove();
  }, [detail, creating]);

  const allPublications = useMemo(() => {
    // Con cuenta nunca se mezclan ejemplos: si aún carga o falla la lectura, la lista queda vacía.
    if (remoteMode) return [...localPublications, ...(remotePublications ?? [])];
    return [...localPublications, ...demoPublications];
  }, [remoteMode, remotePublications, localPublications]);

  const myPublications = useMemo(
    () => allPublications.filter((item) => (userId && item.ownerId ? item.ownerId === userId : item.owner === actor)),
    [allPublications, userId],
  );

  function chooseTab(next: Tab) {
    setTab(next);
    setDetail(null);
  }

  function openDetail(item: Publication) {
    setContactError(false);
    setReviewComment('');
    setReviewStars(5);
    setReviewSuccess(false);
    setDetail(item);
  }

  async function publish(draft: FavorPublicationDraft) {
    setSyncError(null);
    if (client && userId) {
      setSubmitting(true);
      try {
        const created = await createFavorPublicationRemote(client, userId, userName, communityId, draft);
        setRemotePublications((previous) => [created, ...(previous ?? [])]);
        setCreating(false);
        chooseTab('Mi actividad');
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'No se pudo publicar en Supabase.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setLocalPublications((previous) => [{
      ...draft,
      id: `local-${previous.length + 1}`,
      owner: actor,
      ownerName: userName,
      location: 'Tu comunidad',
      terms: 'Coordinar disponibilidad con quien publicó.',
      symbol: draft.kind === 'Préstamo' ? '📦' : '🔄',
      color: draft.kind === 'Préstamo' ? '#e5eddf' : '#f2e9db',
    }, ...previous]);
    setCreating(false);
    chooseTab('Mi actividad');
  }

  function handleDeletePublication(item: Publication) {
    setLocalPublications((previous) => previous.filter((pub) => pub.id !== item.id));
    setRemotePublications((previous) => (previous ? previous.filter((pub) => pub.id !== item.id) : previous));
    if (detail?.id === item.id) setDetail(null);

    if (client && userId && !item.id.startsWith('local-')) {
      void deleteFavorPublicationRemote(client, item.id).catch((err) => {
        setSyncError(err instanceof Error ? err.message : 'No se pudo retirar la publicación.');
        void loadRemoteData();
      });
    }
  }

  function toggleSaved(id: string) {
    const currentlySaved = saved.includes(id);
    const shouldSave = !currentlySaved;
    setSaved((previous) => (currentlySaved
      ? previous.filter((savedId) => savedId !== id)
      : [...previous, id]));

    if (client && userId) {
      void toggleFavorSavedRemote(client, userId, id, shouldSave).catch((err) => {
        setSaved((previous) => (shouldSave
          ? previous.filter((savedId) => savedId !== id)
          : [...previous, id]));
        setSyncError(err instanceof Error ? err.message : 'No se pudo actualizar tus guardadas.');
      });
    }
  }

  function handleRequestFavor(item: Publication) {
    dispatch({
      type: 'request',
      publicationId: item.id,
      actor,
      requester: actor,
      requesterId: userId ?? undefined,
      requesterName: userName,
      publicationOwner: item.owner,
    });
    chooseTab('Mi actividad');

    if (client && userId) {
      void createFavorRequestRemote(client, item.id, userId, userName)
        .then(() => loadRemoteData())
        .catch((err) => {
          setSyncError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.');
        });
    }
  }

  function handleAcceptRequest(item: Publication, request: FavorRequest) {
    dispatch({
      type: 'accept',
      publicationId: item.id,
      actor,
      requester: request.requester,
      requesterId: request.requesterId,
      publicationOwner: item.owner,
    });

    if (client && userId && request.requesterId) {
      void acceptFavorRequestRemote(client, item.id, request.requesterId)
        .then(() => loadRemoteData())
        .catch((err) => {
          setSyncError(err instanceof Error ? err.message : 'No se pudo aceptar la solicitud.');
        });
    }
  }

  function handleCancelRequest(item: Publication, request: FavorRequest) {
    dispatch({
      type: 'cancel',
      publicationId: item.id,
      actor,
      requester: request.requester,
      requesterId: request.requesterId,
      publicationOwner: item.owner,
    });

    if (client && userId) {
      void cancelFavorRequestRemote(client, item.id, request.requesterId ?? userId)
        .then(() => loadRemoteData())
        .catch((err) => {
          setSyncError(err instanceof Error ? err.message : 'No se pudo cancelar la solicitud.');
        });
    }
  }

  function handleFinishRequest(item: Publication, request: FavorRequest) {
    dispatch({
      type: 'finish',
      publicationId: item.id,
      actor,
      requester: request.requester,
      requesterId: request.requesterId,
      publicationOwner: item.owner,
    });

    if (client && userId) {
      void finishFavorRequestRemote(client, item.id, request.requesterId ?? userId)
        .then(() => loadRemoteData())
        .catch((err) => {
          setSyncError(err instanceof Error ? err.message : 'No se pudo finalizar la solicitud.');
        });
    }
  }

  async function handleSubmitReview(item: Publication) {
    if (!reviewComment.trim() || savingReview) return;
    setSyncError(null);
    setReviewSuccess(false);

    if (client && userId) {
      setSavingReview(true);
      try {
        const savedReview = await createFavorReviewRemote(
          client,
          item,
          userId,
          userName,
          reviewStars,
          reviewComment,
        );
        setRemoteReviews((previous) => {
          const filtered = (previous ?? []).filter(
            (r) => !(r.publicationId === item.id && r.authorId === userId),
          );
          return [savedReview, ...filtered];
        });
        setReviewComment('');
        setReviewSuccess(true);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'No se pudo guardar la reseña.');
      } finally {
        setSavingReview(false);
      }
    }
  }

  function openWhatsApp(item: Publication) {
    const ownerDisplay = getOwnerDisplayName(item);
    const message = encodeURIComponent(`Hola, ${ownerDisplay}. Me interesa tu publicación «${item.title}». ¿Podemos coordinar?`);
    setContactError(false);
    void Linking.openURL(`https://wa.me/?text=${message}`).catch(() => setContactError(true));
  }

  const search = query.trim().toLocaleLowerCase('es');
  const visible = allPublications.filter((item) => {
    if (tab === 'Guardadas') return saved.includes(item.id);
    const isOwn = userId && item.ownerId ? item.ownerId === userId : item.owner === actor;
    return !isOwn && `${item.title} ${item.kind} ${item.description}`.toLocaleLowerCase('es').includes(search);
  });
  const isDeck = tab === 'Explorar' && layout === 'Tarjetas';
  const canCreate = tab === 'Explorar' && !detail && !creating;
  const currentCard = visible[cardIndex];
  const currentCardSaved = Boolean(currentCard && saved.includes(currentCard.id));
  const lastCardIndex = visible.length - 1;
  const cardSwipe = useMemo(() => {
    function resetOffset() {
      Animated.spring(cardOffset, { toValue: 0, useNativeDriver: false }).start();
    }

    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, { dx, dy, numberActiveTouches }) =>
        lastCardIndex > 0 && numberActiveTouches === 1 && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3,
      onPanResponderGrant: () => cardOffset.setValue(0),
      onPanResponderMove: (_, { dx }) => cardOffset.setValue(dx),
      onPanResponderRelease: (_, { dx }) => {
        if (Math.abs(dx) < 64) {
          resetOffset();
          return;
        }
        const step = dx < 0 ? 1 : -1;
        setCardIndex((index) => Math.max(0, Math.min(lastCardIndex, index + step)));
        cardOffset.setValue(0);
      },
      onPanResponderTerminate: resetOffset,
    });
  }, [cardOffset, lastCardIndex]);
  const cardRotation = useMemo(() => cardOffset.interpolate({
    inputRange: [-160, 0, 160],
    outputRange: ['-9deg', '0deg', '9deg'],
    extrapolate: 'clamp',
  }), [cardOffset]);
  const detailRequest = requests.find((request) =>
    request.publicationId === detail?.id &&
    (userId && request.requesterId ? request.requesterId === userId : request.requester === actor)
  );
  const detailStatus = detail && publicationStatus(requests, detail.id);
  const reviews = useMemo(() => {
    if (!detail) return [];
    if (remoteReviews !== null) {
      return remoteReviews.filter((r) =>
        (detail.ownerId && r.targetOwnerId ? r.targetOwnerId === detail.ownerId : false) ||
        r.targetOwnerKey === detail.owner ||
        r.publicationId === detail.id
      );
    }
    return remoteMode ? [] : (neighborReviews[detail.owner] ?? []);
  }, [detail, remoteReviews, remoteMode]);

  const averageRating = reviews.length > 0
    ? ratingFormat.format(reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length)
    : null;

  const activity = requests.flatMap((request) => {
    const item = allPublications.find((publication) => publication.id === request.publicationId);
    if (!item) return [];
    const isOwner = userId && item.ownerId ? item.ownerId === userId : item.owner === actor;
    const isRequester = userId && request.requesterId ? request.requesterId === userId : request.requester === actor;
    if (!isOwner && !isRequester) return [];
    return [{ request, item, received: isOwner }];
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
      <ScrollView
        key={creating ? 'crear' : detail?.id ?? tab}
        contentContainerStyle={[styles.scroll, canCreate && styles.scrollWithCreate]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={creating}
      >
        {creating ? (
          <PublicationForm onCancel={() => setCreating(false)} onPublish={(draft) => void publish(draft)} submitting={submitting} />
        ) : <View style={styles.container}>
          <View style={styles.section}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>HOY POR TI, MAÑANA POR MÍ</Text>
                <Text accessibilityRole="header" style={styles.title}>Favores</Text>
              </View>
              {client && userId && (
                <Button label={loadingRemote ? 'Actualizando…' : 'Actualizar'} disabled={loadingRemote} onPress={() => void loadRemoteData()} />
              )}
            </View>
            {!detail && tab === 'Explorar' && (
              <Text style={styles.body}>Descubre préstamos e intercambios de tu comunidad.</Text>
            )}
            {syncError && (
              <Text accessibilityRole="alert" style={styles.notice}>{syncError}</Text>
            )}
            {!remoteMode && (
              <Text style={styles.notice}>
                Datos de demostración: estas publicaciones son ejemplos y no pertenecen a tu comunidad.
              </Text>
            )}
            {initialLoading && (
              <SkeletonCardList count={2} accessibilityLabel="Cargando favores" />
            )}
          </View>
          {!detail && !initialLoading && (
            <TourTarget id="favors-tabs" accessibilityRole="tablist" style={styles.segment}>
              {tabs.map((name) => (
                <Pressable
                  key={name}
                  accessibilityRole="tab"
                  aria-selected={tab === name}
                  onPress={() => chooseTab(name)}
                  style={({ pressed }) => [styles.segmentItem, tab === name && styles.segmentItemActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.segmentText, tab === name && styles.segmentTextActive]}>{name}</Text>
                </Pressable>
              ))}
            </TourTarget>
          )}

          {initialLoading ? null : detail ? (
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
                  <Text accessibilityRole="header" style={styles.cardTitle}>{detail.title}</Text>
                  <View style={styles.publisher}>
                    <Text style={styles.publisherName}>Publicado por {getOwnerDisplayName(detail)}</Text>
                    <View style={styles.row}>
                      {averageRating && <Text aria-hidden style={styles.stars}>★</Text>}
                      <Text style={styles.muted}>
                        {averageRating ? `${averageRating} de 5 · ${reviews.length} reseñas` : 'Sin calificaciones'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.muted}>{detail.location}</Text>
                  <Text style={styles.body}>{detail.description}</Text>
                  <Text style={styles.notice}>{detail.terms}</Text>
                  {detailRequest && <Badge label={requestLabels[detailRequest.status]} />}
                  <View style={styles.row}>
                    {detail.owner !== actor && detailStatus === 'Disponible' && (!detailRequest || detailRequest.status === 'closed') && (
                      <Button primary label={`Solicitar ${detail.kind.toLowerCase()}`} onPress={() => handleRequestFavor(detail)} />
                    )}
                    {detail.owner !== actor && (detailStatus === 'Disponible' || detailRequest?.status === 'accepted') && (
                      <Button icon="chat" label="Abrir WhatsApp" onPress={() => openWhatsApp(detail)} />
                    )}
                    {detail.owner !== actor && (
                      <Button label={saved.includes(detail.id) ? 'Quitar de guardadas' : 'Guardar publicación'}
                        onPress={() => toggleSaved(detail.id)} />
                    )}
                    {detail.owner === actor && detailStatus === 'Disponible' && (
                      <Button label="Retirar publicación" onPress={() => handleDeletePublication(detail)} />
                    )}
                  </View>
                  {detail.owner !== actor && (detailStatus === 'Disponible' || detailRequest?.status === 'accepted') && (
                    <Text style={styles.muted}>Elige el contacto en WhatsApp. El mensaje queda listo para enviar.</Text>
                  )}
                  {contactError && <Text accessibilityRole="alert" style={styles.notice}>No se pudo abrir WhatsApp. Vuelve a intentarlo.</Text>}
                </View>
              </View>
              {detail.owner !== actor && client && userId && (
                <View style={[styles.card, styles.cardBody]}>
                  <Text accessibilityRole="header" style={styles.cardTitle}>Dejar visto bueno y reseña</Text>
                  <Text style={styles.muted}>Comparte cómo fue tu coordinación con {getOwnerDisplayName(detail)}.</Text>
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
                <Text accessibilityRole="header" style={styles.cardTitle}>Reseñas sobre {getOwnerDisplayName(detail)}</Text>
                {reviews.length > 0 ? (
                  <>
                    <Text style={styles.muted}>Calificaciones y reseñas vecinales</Text>
                    {reviews.map((review, index) => (
                      <View key={review.id ?? `${review.author}-${index}`} style={styles.review}>
                        <View style={styles.row}>
                          <Text style={styles.publisherName}>{review.author}</Text>
                          <Text accessibilityLabel={`${review.stars} de 5 estrellas`} style={styles.stars}>
                            {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}
                          </Text>
                        </View>
                        <Text style={styles.body}>{review.comment}</Text>
                      </View>
                    ))}
                  </>
                ) : <Text style={styles.muted}>Aún no hay reseñas.</Text>}
              </View>
            </View>
          ) : tab === 'Mi actividad' ? (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.cardTitle}>Mi actividad</Text>
              <Text style={styles.body}>Revisa tus publicaciones y solicitudes.</Text>
              {myPublications.length > 0 && (
                <View style={styles.section}>
                  <Text accessibilityRole="header" style={styles.publisherName}>Mis publicaciones</Text>
                  <Text style={styles.muted}>
                    {client && userId ? 'Publicaciones guardadas en tu cuenta de Supabase.' : 'Publicaciones creadas en esta sesión.'}
                  </Text>
                  {myPublications.map((item) => (
                    <View key={item.id} style={[styles.card, styles.cardBody]}>
                      <View style={styles.deckMeta}>
                        <Text style={styles.eyebrow}>{item.kind.toUpperCase()}</Text>
                        <Badge label={publicationStatus(requests, item.id)} />
                      </View>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.body}>{item.description}</Text>
                      {item.imageUri && <ResourceArt item={item} inset />}
                      <View style={styles.row}>
                        <Button label="Ver publicación" onPress={() => openDetail(item)} />
                        {publicationStatus(requests, item.id) === 'Disponible' && (
                          <Button label="Retirar publicación" onPress={() => handleDeletePublication(item)} />
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {activity.length === 0 && <Text style={styles.notice}>Aún no tienes solicitudes.</Text>}
              {activity.map(({ request, item, received }) => (
                <View key={`${item.id}-${request.requesterId ?? request.requester}`} style={[styles.card, styles.cardBody]}>
                  <Text style={styles.eyebrow}>{received ? 'RECIBIDA' : 'ENVIADA'}</Text>
                  <Text accessibilityRole="header" style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.muted}>
                    {received ? `De ${getRequesterDisplayName(request)}` : `Para ${getOwnerDisplayName(item)}`}
                  </Text>
                  <Badge label={requestLabels[request.status]} />
                  {request.status === 'pending' && !received && (
                    <Text style={styles.notice}>
                      {client && userId ? 'Solicitud enviada y sincronizada en Supabase.' : 'Solicitud registrada en esta sesión.'}
                    </Text>
                  )}
                  <View style={styles.row}>
                    <Button label="Ver publicación" onPress={() => openDetail(item)} />
                    {received && request.status === 'pending' && (
                      <Button primary label="Aceptar solicitud" onPress={() => handleAcceptRequest(item, request)} />
                    )}
                    {!received && request.status === 'pending' && (
                      <Button label="Cancelar solicitud" onPress={() => handleCancelRequest(item, request)} />
                    )}
                    {request.status === 'accepted' && (
                      <Button label="Cancelar coordinación" onPress={() => handleCancelRequest(item, request)} />
                    )}
                    {!received && request.status === 'accepted' && (
                      <Button primary label="Marcar como terminada" onPress={() => handleFinishRequest(item, request)} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.section}>
              {tab === 'Guardadas' && (
                <>
                  <Text accessibilityRole="header" style={styles.cardTitle}>Publicaciones guardadas</Text>
                  <Text style={styles.body}>Vuelve a las publicaciones que te interesan.</Text>
                </>
              )}
              {tab === 'Explorar' && (
                <>
                  <View style={styles.searchBox}>
                    <AppIcon name="search" size={20} color={colors.textMuted} />
                    <TextInput
                      accessibilityLabel="Buscar publicaciones"
                      placeholder="¿Qué necesitas? Ej. taladro"
                      placeholderTextColor={colors.textMuted}
                      value={query}
                      onChangeText={(value) => {
                        setQuery(value);
                        setCardIndex(0);
                      }}
                      style={styles.searchInput}
                    />
                  </View>
                  <View style={styles.row}>
                    <Button label="Tarjetas" selected={layout === 'Tarjetas'} onPress={() => setLayout('Tarjetas')} />
                    <Button label="Lista" selected={layout === 'Lista'} onPress={() => setLayout('Lista')} />
                  </View>
                </>
              )}
              {visible.length === 0 && (
                <Text style={styles.notice}>{tab === 'Guardadas' ? 'Aún no tienes publicaciones guardadas.' : 'No hay publicaciones que coincidan con la búsqueda.'}</Text>
              )}
              {isDeck && currentCard && (
                <View style={styles.section}>
                  <Text accessibilityLiveRegion="polite" style={styles.muted}>
                    {`Publicación ${cardIndex + 1} de ${visible.length}`}
                  </Text>
                  <View style={cardIndex < visible.length - 1 && styles.deckStack}>
                    {cardIndex < visible.length - 1 && <View aria-hidden style={styles.deckLayer} />}
                    <Animated.View
                      {...cardSwipe.panHandlers}
                      style={[
                        styles.card,
                        styles.deckCard,
                        Platform.OS === 'web' && webSwipeStyle,
                        { transform: [{ translateX: cardOffset }, { rotate: cardRotation }] },
                      ]}
                    >
                      <View style={styles.deckMeta}>
                        <Text style={styles.eyebrow}>{currentCard.kind.toUpperCase()}</Text>
                        <Badge label={publicationStatus(requests, currentCard.id)} />
                      </View>
                      <Text accessibilityRole="header" style={styles.cardTitle}>{currentCard.title}</Text>
                      <Text style={styles.muted}>{getOwnerDisplayName(currentCard)} · {currentCard.location}</Text>
                      <ResourceArt item={currentCard} inset />
                      <Text style={styles.body}>{currentCard.description}</Text>
                      <View style={[styles.row, styles.deckActions]}>
                        <Button label="Ver detalle" onPress={() => openDetail(currentCard)} />
                      </View>
                    </Animated.View>
                  </View>
                  <View style={[styles.row, styles.deckControls]}>
                    <Button icon="back" label="Anterior" disabled={cardIndex === 0} onPress={() => setCardIndex(cardIndex - 1)} />
                    <Button icon="chevron" iconAfter label="Pasar" primary disabled={cardIndex === visible.length - 1} onPress={() => setCardIndex(cardIndex + 1)} />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={currentCardSaved ? 'Quitar de guardadas' : 'Guardar publicación'}
                      aria-pressed={currentCardSaved}
                      onPress={() => toggleSaved(currentCard.id)}
                      style={({ pressed }) => [
                        styles.button,
                        styles.heartButton,
                        currentCardSaved && styles.buttonActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <AppIcon name="heart" size={22} color={currentCardSaved ? colors.onPrimary : colors.primary} weight={2} />
                    </Pressable>
                  </View>
                </View>
              )}
              {!isDeck && visible.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Ver ${item.title}`}
                    onPress={() => openDetail(item)}
                    style={({ pressed }) => [layout === 'Lista' && styles.listItem, pressed && styles.pressed]}
                  >
                    <ResourceArt item={item} compact={layout === 'Lista'} />
                    <View style={[styles.cardBody, layout === 'Lista' && styles.listContent]}>
                      <View style={styles.row}>
                        <Text style={styles.eyebrow}>{item.kind.toUpperCase()}</Text>
                        <Badge label={publicationStatus(requests, item.id)} />
                      </View>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.muted}>{getOwnerDisplayName(item)} · {item.location}</Text>
                      <Text style={styles.body}>{item.description}</Text>
                    </View>
                  </Pressable>
                  <View style={styles.cardFooter}>
                    <Button label={saved.includes(item.id) ? 'Quitar de guardadas' : 'Guardar publicación'}
                      onPress={() => toggleSaved(item.id)} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>}
      </ScrollView>
      {canCreate && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Crear publicación"
          onPress={() => setCreating(true)}
          style={({ pressed }) => [styles.button, styles.buttonActive, styles.createButton, pressed && styles.pressed]}
        >
          <AppIcon name="plus" size={26} color={colors.lime} weight={2.4} />
        </Pressable>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 48 },
  scrollWithCreate: { paddingBottom: 96 },
  container: { alignSelf: 'center', width: '100%', maxWidth: 760, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  section: { gap: 14 },
  kicker: { fontFamily: fonts.mono, color: colors.clay, fontSize: 11, fontWeight: '600', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -1, marginTop: 4 },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  publisher: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, gap: 4 },
  publisherName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  stars: { color: colors.starInk, fontSize: 16, letterSpacing: 1 },
  review: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 4 },
  body: { color: '#3B5247', fontSize: 15.5, lineHeight: 23 },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  eyebrow: { fontFamily: fonts.mono, color: colors.clay, fontSize: 11, fontWeight: '600', letterSpacing: 0.8 },
  badge: { alignSelf: 'flex-start', fontFamily: fonts.mono, color: colors.primary, borderWidth: 1.5, borderColor: colors.primary, fontSize: 10.5, fontWeight: '600', letterSpacing: 0.6, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, textTransform: 'uppercase', overflow: 'hidden' },
  segment: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: '#E9E4D5' },
  segmentItem: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segmentItemActive: { backgroundColor: colors.background },
  segmentText: { color: '#4F5E55', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  segmentTextActive: { color: colors.text, fontWeight: '700' },
  button: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.background },
  buttonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  buttonText: { color: colors.primary, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  buttonTextActive: { color: colors.onPrimary },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
  search: { minHeight: 48, color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: 14, paddingHorizontal: 14 },
  searchBox: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: 14, paddingHorizontal: 14 },
  searchInput: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 12 },
  form: { padding: 16, gap: 12 },
  descriptionInput: { minHeight: 128, paddingVertical: 12, textAlignVertical: 'top' },
  imagePreview: { width: '100%', height: 144, backgroundColor: colors.surface, borderRadius: 12 },
  createButton: { position: 'absolute', right: 16, bottom: 16, width: 60, height: 60, padding: 0, alignItems: 'center', borderRadius: 20, borderWidth: 4, borderColor: colors.surface },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: 'hidden' },
  cardBody: { padding: 16, gap: 8 },
  cardFooter: { paddingHorizontal: 16, paddingBottom: 14, alignItems: 'flex-start' },
  deckStack: { paddingBottom: 8 },
  deckLayer: { position: 'absolute', bottom: 0, left: 10, right: 10, height: 26, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.claySurface },
  deckCard: { padding: 16, gap: 10 },
  deckActions: { marginTop: 10 },
  deckMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  deckArt: { height: 150, borderRadius: 16 },
  deckControls: { justifyContent: 'center' },
  heartButton: { width: 48, padding: 0, alignItems: 'center', borderRadius: 16 },
  notice: { backgroundColor: colors.primarySurface, color: '#2F4A3E', fontSize: 14, lineHeight: 21, padding: 12, borderRadius: 12, overflow: 'hidden' },
  art: { height: 180, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  artArch: { width: 150, height: 140, borderTopLeftRadius: 80, borderTopRightRadius: 80, alignItems: 'center', justifyContent: 'center' },
  resourceImage: { width: '100%', height: '100%', borderRadius: 14 },
  detailBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: colors.background, borderRadius: 6 },
  artCompact: { width: 84, height: undefined, alignSelf: 'stretch', minHeight: 110, justifyContent: 'center', borderRightWidth: 1.5, borderStyle: 'dashed' },
  tagHole: { position: 'absolute', top: 12, width: 11, height: 11, borderRadius: 6, borderWidth: 1.5, backgroundColor: colors.surface },
  listItem: { flexDirection: 'row', alignItems: 'stretch' },
  listContent: { flex: 1 },
});
