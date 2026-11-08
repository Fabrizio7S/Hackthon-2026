import type { SupabaseClient } from '@supabase/supabase-js';
import { type Publication } from '../model/types';
import { type Tab } from '../model/navigation';
import type { Dispatch, SetStateAction } from 'react';
import type { RequestAction } from '../model/types';
import type { useFavorsData } from '../hooks/useFavorsData';

type Flag = Dispatch<SetStateAction<boolean>>;

export type FavorActionContext = Pick<
  ReturnType<typeof useFavorsData>,
  | 'saved'
  | 'userName'
  | 'setSyncError'
  | 'setLocalPublications'
  | 'setRemotePublications'
  | 'setRemoteReviews'
  | 'setSaved'
  | 'loadRemoteData'
> & {
  client: SupabaseClient | null;
  userId: string | null;
  communityId: string | null;
  detail: Publication | null;
  reviewComment: string;
  reviewStars: 1 | 2 | 3 | 4 | 5;
  savingReview: boolean;
  setDetail: Dispatch<SetStateAction<Publication | null>>;
  setCreating: Flag;
  setSubmitting: Flag;
  setReviewSuccess: Flag;
  setSavingReview: Flag;
  setContactError: Flag;
  setReviewComment: Dispatch<SetStateAction<string>>;
  dispatch: Dispatch<RequestAction>;
  chooseTab: (next: Tab) => void;
};
