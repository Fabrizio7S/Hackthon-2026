import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { publications as demoPublications } from '../data/demoData';
import { type Publication, type Review } from '../model/types';
import { fetchFavorsData } from '../data';
import type { Dispatch } from 'react';
import type { RequestAction } from '../model/types';

export function useFavorsData(
  client: SupabaseClient | null,
  userId: string | null,
  userEmail: string | undefined,
  dispatch: Dispatch<RequestAction>,
) {
  const remoteMode = Boolean(client && userId);

  const [saved, setSaved] = useState<string[]>([]);

  const [localPublications, setLocalPublications] = useState<Publication[]>([]);

  const [remotePublications, setRemotePublications] = useState<Publication[] | null>(null);

  const [remoteReviews, setRemoteReviews] = useState<Review[] | null>(null);

  const [userName, setUserName] = useState<string>(remoteMode ? 'Vecino' : 'Ana');

  const [loadingRemote, setLoadingRemote] = useState(false);

  const [syncError, setSyncError] = useState<string | null>(null);

  const initialLoading = remoteMode && remotePublications === null && syncError === null;

  const loadRemoteData = useCallback(async () => {
    if (!client || !userId) return;
    setLoadingRemote(true);
    setSyncError(null);
    try {
      const data = await fetchFavorsData(client, userId, userEmail);
      setUserName(data.userName);
      setRemotePublications(data.publications);
      setSaved(data.savedIds);
      setRemoteReviews(data.reviews);
      dispatch({ type: 'hydrate', requests: data.requests });
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'No se pudo sincronizar con Supabase.');
    } finally {
      setLoadingRemote(false);
    }
  }, [client, userId, userEmail]);

  useEffect(() => {
    void loadRemoteData();
  }, [loadRemoteData]);

  const allPublications = useMemo(() => {
    // Con cuenta nunca se mezclan ejemplos: si aún carga o falla la lectura, la lista queda vacía.
    if (remoteMode) return [...localPublications, ...(remotePublications ?? [])];
    return [...localPublications, ...demoPublications];
  }, [remoteMode, remotePublications, localPublications]);
  return {
    remoteMode,
    saved,
    setSaved,
    localPublications,
    setLocalPublications,
    remotePublications,
    setRemotePublications,
    remoteReviews,
    setRemoteReviews,
    userName,
    loadingRemote,
    syncError,
    setSyncError,
    initialLoading,
    loadRemoteData,
    allPublications,
  };
}
