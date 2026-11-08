import { createPublicationsActions } from './publications';
import { createRequestsActions } from './requests';
import { createReviewsActions } from './reviews';
import { createContactActions } from './contact';
import type { FavorActionContext } from './types';

export function createFavorActions(context: FavorActionContext) {
  return {
    ...createPublicationsActions(context),
    ...createRequestsActions(context),
    ...createReviewsActions(context),
    ...createContactActions(context),
  };
}
