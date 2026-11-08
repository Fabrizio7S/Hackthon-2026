import { useRef, useState } from 'react';

import { createSingleFlight, type SingleFlight } from './singleFlight';

/**
 * Hook para botones de envío (p. ej. «Publicar»).
 * - `submit` ignora toques repetidos mientras hay un envío en curso.
 * - `submitting` sirve para desactivar el botón y mostrar «Publicando…».
 * La operación más reciente se usa siempre, aunque cambie entre renders.
 */
export function useSubmitOnce<A extends unknown[], T>(operation: (...args: A) => Promise<T>) {
  const [submitting, setSubmitting] = useState(false);
  const operationRef = useRef(operation);
  operationRef.current = operation;

  const flightRef = useRef<SingleFlight<A, T> | null>(null);
  if (flightRef.current === null) {
    flightRef.current = createSingleFlight<A, T>(
      (...args) => operationRef.current(...args),
      setSubmitting,
    );
  }

  return { submit: flightRef.current.run, submitting };
}
