import { createFavorActions } from '../actions';
import { useFavorsData } from './useFavorsData';
import { useFavorDeck } from './useFavorDeck';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { BackHandler } from 'react-native';
import { useSessionIdentity } from '../../../shared/identity/IdentityContext';
import { neighborReviews } from '../data/demoData';
import { publicationStatus, updateRequests } from '../model/requests';
import { type Publication } from '../model/types';
import { ratingFormat } from '../model/presentation';
import { type Tab, actor } from '../model/navigation';

export function useFavorsController({
  client = null,
  initialCreating = false,
}: {
  client?: SupabaseClient | null;
  initialCreating?: boolean;
}) {
  const identity = useSessionIdentity();
  const userId = identity.status === 'authenticated' ? identity.user.id : null;
  const userEmail = identity.status === 'authenticated' ? identity.user.email : undefined;
  const communityId: string | null = null;
  // Con cuenta y cliente, los datos son siempre los de la comunidad; los ejemplos solo existen sin conexión al servicio.

  const [tab, setTab] = useState<Tab>('Explorar');
  const [detail, setDetail] = useState<Publication | null>(null);
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<'Tarjetas' | 'Lista'>('Tarjetas');

  const [requests, dispatch] = useReducer(updateRequests, []);
  const {
    remoteMode,
    saved,
    setSaved,
    localPublications,
    setLocalPublications,
    remotePublications,
    setRemotePublications,
    remoteReviews,
    setRemoteReviews,
    userName,
    loadingRemote,
    syncError,
    setSyncError,
    initialLoading,
    loadRemoteData,
    allPublications,
  } = useFavorsData(client, userId, userEmail, dispatch);

  const [contactError, setContactError] = useState(false);
  const [creating, setCreating] = useState(initialCreating);
  const [submitting, setSubmitting] = useState(false);

  // Hasta recibir la primera respuesta no se muestra contenido, para no enseñar publicaciones ajenas.

  // Estado del formulario de reseña en detalle
  const [reviewStars, setReviewStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!detail && !creating) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      setCreating(false);
      setDetail(null);
      return true;
    });
    return () => listener.remove();
  }, [detail, creating]);

  const myPublications = useMemo(
    () =>
      allPublications.filter((item) =>
        userId && item.ownerId ? item.ownerId === userId : item.owner === actor,
      ),
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

  const {
    publish,
    handleDeletePublication,
    toggleSaved,
    handleRequestFavor,
    handleAcceptRequest,
    handleCancelRequest,
    handleFinishRequest,
    handleSubmitReview,
    openWhatsApp,
  } = createFavorActions({
    client,
    userId,
    communityId,
    detail,
    saved,
    userName,
    reviewComment,
    reviewStars,
    savingReview,
    setSyncError,
    setLocalPublications,
    setRemotePublications,
    setRemoteReviews,
    setSaved,
    setDetail,
    setCreating,
    setSubmitting,
    dispatch,
    setReviewComment,
    setReviewSuccess,
    setSavingReview,
    setContactError,
    loadRemoteData,
    chooseTab,
  });

  const search = query.trim().toLocaleLowerCase('es');
  const visible = allPublications.filter((item) => {
    if (tab === 'Guardadas') return saved.includes(item.id);
    const isOwn = userId && item.ownerId ? item.ownerId === userId : item.owner === actor;
    return (
      !isOwn &&
      `${item.title} ${item.kind} ${item.description}`.toLocaleLowerCase('es').includes(search)
    );
  });
  const isDeck = tab === 'Explorar' && layout === 'Tarjetas';
  const canCreate = tab === 'Explorar' && !detail && !creating;
  const { cardIndex, setCardIndex, cardOffset, cardSwipe, cardRotation } = useFavorDeck(
    visible.length - 1,
  );
  const currentCard = visible[cardIndex];
  const currentCardSaved = Boolean(currentCard && saved.includes(currentCard.id));

  const detailRequest = requests.find(
    (request) =>
      request.publicationId === detail?.id &&
      (userId && request.requesterId
        ? request.requesterId === userId
        : request.requester === actor),
  );
  const detailStatus = detail && publicationStatus(requests, detail.id);
  const reviews = useMemo(() => {
    if (!detail) return [];
    if (remoteReviews !== null) {
      return remoteReviews.filter(
        (r) =>
          (detail.ownerId && r.targetOwnerId ? r.targetOwnerId === detail.ownerId : false) ||
          r.targetOwnerKey === detail.owner ||
          r.publicationId === detail.id,
      );
    }
    return remoteMode ? [] : (neighborReviews[detail.owner] ?? []);
  }, [detail, remoteReviews, remoteMode]);

  const averageRating =
    reviews.length > 0
      ? ratingFormat.format(reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length)
      : null;

  const activity = requests.flatMap((request) => {
    const item = allPublications.find((publication) => publication.id === request.publicationId);
    if (!item) return [];
    const isOwner = userId && item.ownerId ? item.ownerId === userId : item.owner === actor;
    const isRequester =
      userId && request.requesterId ? request.requesterId === userId : request.requester === actor;
    if (!isOwner && !isRequester) return [];
    return [{ request, item, received: isOwner }];
  });

  return {
    userId,
    remoteMode,
    tab,
    detail,
    setDetail,
    query,
    setQuery,
    layout,
    setLayout,
    cardIndex,
    setCardIndex,
    cardOffset,
    saved,
    requests,
    contactError,
    creating,
    setCreating,
    submitting,
    loadingRemote,
    syncError,
    initialLoading,
    reviewStars,
    setReviewStars,
    reviewComment,
    setReviewComment,
    savingReview,
    reviewSuccess,
    loadRemoteData,
    myPublications,
    chooseTab,
    openDetail,
    publish,
    handleDeletePublication,
    toggleSaved,
    handleRequestFavor,
    handleAcceptRequest,
    handleCancelRequest,
    handleFinishRequest,
    handleSubmitReview,
    openWhatsApp,
    search,
    visible,
    isDeck,
    canCreate,
    currentCard,
    currentCardSaved,
    cardSwipe,
    cardRotation,
    detailRequest,
    detailStatus,
    reviews,
    averageRating,
    activity,
    client,
  };
}

export type FavorsModel = ReturnType<typeof useFavorsController>;
