import type { FavorRequest, Neighbor, Publication, Review } from '../model/types';
import { type FavorPublicationRow, type FavorRequestRow, type FavorReviewRow } from '../model/rows';

export function toNeighborKey(
  ownerId: string | null,
  ownerKey: string,
  currentUserId: string,
): Neighbor {
  if (ownerId && ownerId === currentUserId) return 'ana';
  if (ownerKey === 'carlos') return 'carlos';
  return 'luz';
}

export function mapRowToPublication(row: FavorPublicationRow, currentUserId: string): Publication {
  return {
    id: row.id,
    owner: toNeighborKey(row.owner_id, row.owner_key, currentUserId),
    ownerId: row.owner_id ?? undefined,
    ownerName: row.owner_name,
    kind: row.kind === 'Intercambio' ? 'Intercambio' : 'Préstamo',
    title: row.title,
    description: row.description,
    location: row.location,
    terms: row.terms,
    symbol: row.symbol,
    color: row.color,
    imageUri: row.image_uri ?? undefined,
  };
}

export function mapRowToRequest(row: FavorRequestRow, currentUserId: string): FavorRequest {
  return {
    publicationId: row.publication_id,
    requester: row.requester_id === currentUserId ? 'ana' : 'carlos',
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    status: row.status,
  };
}

export function mapRowToReview(row: FavorReviewRow): Review {
  const validStars = Math.max(1, Math.min(5, Math.round(row.stars))) as 1 | 2 | 3 | 4 | 5;
  return {
    id: row.id,
    publicationId: row.publication_id ?? undefined,
    targetOwnerId: row.target_owner_id ?? undefined,
    targetOwnerKey:
      row.target_owner_key === 'carlos' ? 'carlos' : row.target_owner_key === 'ana' ? 'ana' : 'luz',
    authorId: row.author_id ?? undefined,
    author: row.author_name,
    stars: validStars,
    comment: row.comment,
  };
}
