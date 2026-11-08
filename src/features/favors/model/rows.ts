import type { Publication, RequestStatus } from './types';

export type FavorPublicationDraft = Pick<
  Publication,
  'kind' | 'title' | 'description' | 'imageUri'
> & {
  imageBase64?: string;
};

export type FavorPublicationRow = {
  id: string;
  community_id: string | null;
  owner_id: string | null;
  owner_key: string;
  owner_name: string;
  kind: 'Préstamo' | 'Intercambio';
  title: string;
  description: string;
  location: string;
  terms: string;
  symbol: string;
  color: string;
  image_uri: string | null;
};

export type FavorRequestRow = {
  id: string;
  publication_id: string;
  requester_id: string;
  requester_name: string;
  status: RequestStatus;
};

export type FavorSavedRow = {
  publication_id: string;
};

export type FavorReviewRow = {
  id: string;
  publication_id: string | null;
  target_owner_id: string | null;
  target_owner_key: string;
  author_id: string | null;
  author_name: string;
  stars: number;
  comment: string;
};
