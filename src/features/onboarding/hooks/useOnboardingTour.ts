import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { createOnboardingState } from '../data/onboardingState';

export function useOnboardingTour(userId: string | null) {
  const state = useMemo(
    () => (userId ? createOnboardingState(AsyncStorage, userId) : null),
    [userId],
  );
  const [view, setView] = useState<{
    owner: typeof state;
    step: number | null;
    error: 'read' | 'save' | null;
  }>({ owner: null, step: null, error: null });

  useEffect(() => {
    let active = true;
    setView({ owner: state, step: null, error: null });
    if (state) {
      void state
        .shouldStart()
        .then((show) => {
          if (active && show) setView({ owner: state, step: 0, error: null });
        })
        .catch(() => {
          // Si el almacenamiento no se puede leer, no se impone un recorrido repetido.
          if (active)
            setView((current) =>
              current.owner === state ? { ...current, error: 'read' } : current,
            );
        });
    }
    return () => {
      active = false;
    };
  }, [state]);

  const current = view.owner === state ? view : null;

  function start() {
    if (!state) return;
    state.start();
    setView({ owner: state, step: 0, error: null });
  }

  function finish() {
    if (!state) return;
    setView({ owner: state, step: null, error: null });
    void state.finish().catch(() => {
      setView((value) => (value.owner === state ? { ...value, error: 'save' } : value));
    });
  }

  return {
    step: current?.step ?? null,
    error: current?.error ?? null,
    start,
    finish,
    interrupt: () => {
      // Navegar antes de que termine la lectura local también cancela el inicio automático.
      state?.start();
      if (current?.step !== null && current?.step !== undefined) finish();
    },
    move: (step: number) => {
      if (state) setView({ owner: state, step, error: null });
    },
  };
}
