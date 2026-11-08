import { publications } from '../data/demoData';
import { type RequestStatus, type FavorRequest, type RequestAction } from './types';

export const requestLabels: Record<RequestStatus, string> = {
  pending: 'Pendiente de aceptación',
  accepted: 'En coordinación',
  finished: 'Terminada',
  closed: 'Solicitud cerrada',
};

export function publicationStatus(requests: FavorRequest[], publicationId: string) {
  const relevant = requests.filter((request) => request.publicationId === publicationId);
  if (relevant.some((request) => request.status === 'finished')) return 'Terminada';
  if (relevant.some((request) => request.status === 'accepted')) return 'En coordinación';
  return 'Disponible';
}

export function updateRequests(requests: FavorRequest[], action: RequestAction): FavorRequest[] {
  if (action.type === 'hydrate') {
    return action.requests;
  }

  const { type, actor, publicationId, requester, requesterId, requesterName, publicationOwner } =
    action;
  const fallbackPub = publications.find((item) => item.id === publicationId);
  const owner = publicationOwner ?? fallbackPub?.owner;
  if (!owner) return requests;

  const current = requests.find(
    (item) =>
      item.publicationId === publicationId &&
      (requesterId && item.requesterId
        ? item.requesterId === requesterId
        : item.requester === requester),
  );
  const available = publicationStatus(requests, publicationId) === 'Disponible';

  if (type === 'request') {
    if (!available || actor !== requester || actor === owner) return requests;
    if (current) {
      if (current.status === 'closed') {
        return requests.map((item) => (item === current ? { ...item, status: 'pending' } : item));
      }
      return requests;
    }
    return [
      ...requests,
      { publicationId, requester, requesterId, requesterName, status: 'pending' },
    ];
  }

  if (type === 'accept' && actor === owner && current?.status === 'pending' && available) {
    return requests.map((item) => {
      if (item.publicationId !== publicationId || item.status !== 'pending') return item;
      return { ...item, status: item === current ? 'accepted' : 'closed' };
    });
  }

  if (type === 'finish' && actor === requester && current?.status === 'accepted') {
    return requests.map((item) => (item === current ? { ...item, status: 'finished' } : item));
  }

  // Cancelación conforme a D25:
  // - Antes de aceptar ('pending'): solo el solicitante puede cancelar.
  // - Durante la coordinación ('accepted'): puede cancelar el solicitante o el dueño.
  if (type === 'cancel' && current) {
    if (current.status === 'pending' && actor === requester) {
      return requests.map((item) => (item === current ? { ...item, status: 'closed' } : item));
    }
    if (current.status === 'accepted' && (actor === requester || actor === owner)) {
      return requests.map((item) => (item === current ? { ...item, status: 'closed' } : item));
    }
  }

  return requests;
}
