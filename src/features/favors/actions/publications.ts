import { type Publication } from '../model/types';
import {
  createFavorPublicationRemote,
  deleteFavorPublicationRemote,
  toggleFavorSavedRemote,
  type FavorPublicationDraft,
} from '../data';
import { actor } from '../model/navigation';
import type { FavorActionContext } from './types';

export function createPublicationsActions(context: FavorActionContext) {
  const {
    client,
    userId,
    communityId,
    detail,
    saved,
    userName,
    setSyncError,
    setLocalPublications,
    setRemotePublications,
    setSaved,
    setDetail,
    setCreating,
    setSubmitting,
    loadRemoteData,
    chooseTab,
  } = context;
  async function publish(draft: FavorPublicationDraft) {
    setSyncError(null);
    if (client && userId) {
      setSubmitting(true);
      try {
        const created = await createFavorPublicationRemote(
          client,
          userId,
          userName,
          communityId,
          draft,
        );
        setRemotePublications((previous) => [created, ...(previous ?? [])]);
        setCreating(false);
        chooseTab('Mi actividad');
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'No se pudo publicar en Supabase.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setLocalPublications((previous) => [
      {
        ...draft,
        id: `local-${previous.length + 1}`,
        owner: actor,
        ownerName: userName,
        location: 'Tu comunidad',
        terms: 'Coordinar disponibilidad con quien publicó.',
        symbol: draft.kind === 'Préstamo' ? '📦' : '🔄',
        color: draft.kind === 'Préstamo' ? '#e5eddf' : '#f2e9db',
      },
      ...previous,
    ]);
    setCreating(false);
    chooseTab('Mi actividad');
  }

  function handleDeletePublication(item: Publication) {
    setLocalPublications((previous) => previous.filter((pub) => pub.id !== item.id));
    setRemotePublications((previous) =>
      previous ? previous.filter((pub) => pub.id !== item.id) : previous,
    );
    if (detail?.id === item.id) setDetail(null);

    if (client && userId && !item.id.startsWith('local-')) {
      void deleteFavorPublicationRemote(client, item.id).catch((err) => {
        setSyncError(err instanceof Error ? err.message : 'No se pudo retirar la publicación.');
        void loadRemoteData();
      });
    }
  }

  function toggleSaved(id: string) {
    const currentlySaved = saved.includes(id);
    const shouldSave = !currentlySaved;
    setSaved((previous) =>
      currentlySaved ? previous.filter((savedId) => savedId !== id) : [...previous, id],
    );

    if (client && userId) {
      void toggleFavorSavedRemote(client, userId, id, shouldSave).catch((err) => {
        setSaved((previous) =>
          shouldSave ? previous.filter((savedId) => savedId !== id) : [...previous, id],
        );
        setSyncError(err instanceof Error ? err.message : 'No se pudo actualizar tus guardadas.');
      });
    }
  }
  return { publish, handleDeletePublication, toggleSaved };
}
