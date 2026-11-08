import { colors } from '../../../shared/theme';
import { neighbors } from '../data/demoData';
import { type FavorRequest, type Publication } from './types';

export const webSwipeStyle = { position: 'relative', touchAction: 'pan-y' } as const;

export const ratingFormat = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const starValues = [1, 2, 3, 4, 5] as const;

export function getOwnerDisplayName(item: Publication): string {
  return item.ownerName || neighbors[item.owner];
}

export function getRequesterDisplayName(request: FavorRequest): string {
  return request.requesterName || neighbors[request.requester];
}

export function kindLook(kind: Publication['kind']) {
  return kind === 'Intercambio'
    ? { tint: colors.primarySurface, ink: colors.primary, icon: 'swap' as const }
    : { tint: colors.claySurface, ink: colors.clay, icon: 'box' as const };
}
