import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { EmergenciesApi } from '../data/emergenciesApi';
import { createOutbox, type OutboxEntry, type OutboxStorage } from '../data/outbox';
import {
  flushPending,
  retryEntry,
  submitNewReport,
  type SubmitOutcome,
} from '../data/submitReport';
import type { NewReport } from '../model/types';

export type OutboxArgs = {
  api: EmergenciesApi;
  storage: OutboxStorage;
  userId: string;
  /** Se llama cuando el servidor confirma al menos un reporte (para actualizar la lista). */
  onDelivered: () => void;
};

export function useReportOutbox({ api, storage, userId, onDelivered }: OutboxArgs) {
  const outbox = useMemo(() => createOutbox(storage, userId), [storage, userId]);
  const deps = useMemo(() => ({ api, outbox }), [api, outbox]);
  const [entries, setEntries] = useState<OutboxEntry[]>([]);
  const mounted = useRef(true);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const deliveredRef = useRef(onDelivered);
  deliveredRef.current = onDelivered;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const list = await outbox.list();
      if (mounted.current) setEntries(list);
    } catch {
      // Si no se puede leer el almacenamiento, la pantalla sigue funcionando sin cola.
    }
  }, [outbox]);

  // Serializa envíos, reintentos y vaciados para que nunca se envíe dos veces a la vez la misma entrada.
  const enqueue = useCallback(<T>(operation: () => Promise<T>): Promise<T> => {
    const next = queue.current.then(operation, operation);
    queue.current = next.catch(() => undefined);
    return next;
  }, []);

  const submit = useCallback(
    (report: NewReport): Promise<SubmitOutcome> =>
      enqueue(async () => {
        const outcome = await submitNewReport(deps, report);
        // Si el servidor lo rechazó, el formulario sigue en pantalla: no dejamos una copia en la cola.
        if (outcome.state === 'error')
          await outbox.remove(report.clientRequestId).catch(() => undefined);
        if (outcome.state === 'enviado') deliveredRef.current();
        await refresh();
        return outcome;
      }),
    [deps, enqueue, outbox, refresh],
  );

  const retry = useCallback(
    (id: string): Promise<SubmitOutcome | null> =>
      enqueue(async () => {
        const entry = (await outbox.list()).find((e) => e.clientRequestId === id);
        if (!entry) return null;
        const outcome = await retryEntry(deps, entry);
        if (outcome.state === 'enviado') deliveredRef.current();
        await refresh();
        return outcome;
      }),
    [deps, enqueue, outbox, refresh],
  );

  const discard = useCallback(
    (id: string) =>
      enqueue(async () => {
        await outbox.remove(id).catch(() => undefined);
        await refresh();
      }),
    [enqueue, outbox, refresh],
  );

  const flush = useCallback(
    () =>
      enqueue(async () => {
        const results = await flushPending(deps);
        if (results.some((r) => r.outcome.state === 'enviado')) deliveredRef.current();
        await refresh();
      }),
    [deps, enqueue, refresh],
  );

  useEffect(() => {
    void (async () => {
      await outbox.recover().catch(() => undefined);
      await refresh();
      await flush();
    })();
  }, [outbox, refresh, flush]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void flush();
    });
    return () => subscription.remove();
  }, [flush]);

  return { entries, submit, retry, discard, flush, refresh };
}

export type ReportOutbox = ReturnType<typeof useReportOutbox>;
