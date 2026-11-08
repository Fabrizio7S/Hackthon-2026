// Claves existentes conservadas para compatibilidad con solicitudes y ejemplos.
export type Neighbor = 'ana' | 'carlos' | 'luz';

export type Review = {
  id?: string;
  publicationId?: string;
  targetOwnerId?: string;
  targetOwnerKey?: Neighbor;
  authorId?: string;
  author: string;
  stars: 1 | 2 | 3 | 4 | 5;
  comment: string;
};

export type Publication = {
  id: string;
  owner: Neighbor;
  ownerId?: string;
  ownerName?: string;
  kind: 'Préstamo' | 'Intercambio';
  title: string;
  description: string;
  location: string;
  terms: string;
  symbol: string;
  color: string;
  imageUri?: string;
};

export type RequestStatus = 'pending' | 'accepted' | 'finished' | 'closed';

export type FavorRequest = {
  publicationId: string;
  requester: Neighbor;
  requesterId?: string;
  requesterName?: string;
  status: RequestStatus;
};

export type RequestAction =
  | {
      type: 'request' | 'accept' | 'finish' | 'cancel';
      actor: Neighbor;
      publicationId: string;
      requester: Neighbor;
      requesterId?: string;
      requesterName?: string;
      publicationOwner?: Neighbor;
    }
  | {
      type: 'hydrate';
      requests: FavorRequest[];
    };
