import { type FavorRequest, type Publication } from '../model/types';
import {
  acceptFavorRequestRemote,
  cancelFavorRequestRemote,
  createFavorRequestRemote,
  finishFavorRequestRemote,
} from '../data';
import { actor } from '../model/navigation';
import type { FavorActionContext } from './types';

export function createRequestsActions(context: FavorActionContext) {
  const { client, userId, userName, setSyncError, dispatch, loadRemoteData, chooseTab } = context;
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
  return { handleRequestFavor, handleAcceptRequest, handleCancelRequest, handleFinishRequest };
}
