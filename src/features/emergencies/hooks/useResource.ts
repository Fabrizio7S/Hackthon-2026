import { useCallback, useEffect, useRef, useState } from 'react';
import type { EmergencyError, Result } from '../model/errors';

export type ResourceState<T> = {
  status: 'cargando' | 'listo' | 'error';
  data: T | null;
  error: EmergencyError | null;
};

export function useResource<T>(load: () => Promise<Result<T>>) {
  const [state, setState] = useState<ResourceState<T>>({
    status: 'cargando',
    data: null,
    error: null,
  });
  const loadRef = useRef(load);
  loadRef.current = load;
  const token = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async (options?: { silent?: boolean }) => {
    const mine = ++token.current;
    const silent = options?.silent === true;
    if (!silent) setState({ status: 'cargando', data: null, error: null });
    const result = await loadRef.current();
    if (mine !== token.current || !mounted.current) return;
    if (result.ok) {
      setState({ status: 'listo', data: result.data, error: null });
    } else if (silent) {
      setState((previous) => ({ ...previous, error: result.error }));
    } else {
      setState({ status: 'error', data: null, error: result.error });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { state, reload };
}
