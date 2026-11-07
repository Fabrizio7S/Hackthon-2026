import { useEffect, useRef, useState } from 'react';

import { createListLoader, type ListLoader, type ListState } from './listLoader';

/**
 * Carga una lista al montar la pantalla y expone `reload` para reintentar.
 * Usa siempre la función de carga más reciente, aunque cambie entre renders.
 */
export function useListLoader<T>(fetchItems: () => Promise<T[]>) {
  const [state, setState] = useState<ListState<T>>({ status: 'cargando' });
  const fetchRef = useRef(fetchItems);
  fetchRef.current = fetchItems;

  const loaderRef = useRef<ListLoader | null>(null);
  if (loaderRef.current === null) {
    loaderRef.current = createListLoader<T>(() => fetchRef.current(), setState);
  }

  useEffect(() => {
    void loaderRef.current?.load();
  }, []);

  return { state, reload: loaderRef.current.load };
}
