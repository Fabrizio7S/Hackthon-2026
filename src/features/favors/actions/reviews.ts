import { type Publication } from '../model/types';
import { createFavorReviewRemote } from '../data';
import type { FavorActionContext } from './types';

export function createReviewsActions(context: FavorActionContext) {
  const {
    client,
    userId,
    userName,
    reviewComment,
    reviewStars,
    savingReview,
    setSyncError,
    setRemoteReviews,
    setReviewComment,
    setReviewSuccess,
    setSavingReview,
  } = context;
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
  return { handleSubmitReview };
}
