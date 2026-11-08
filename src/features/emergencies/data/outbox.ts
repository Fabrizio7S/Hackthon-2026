// Cola local de reportes (guardado en el teléfono) del módulo G04.
// Es la pieza mínima para no perder un reporte sin conexión y distinguir sus estados:
//   guardado_local → enviando → (enviado: se elimina de la cola)
//                             → pendiente (sin conexión: se reintentará con el mismo identificador)
//                             → error (el servidor lo rechazó: requiere intervención)
// «Enviado» nunca se escribe aquí: solo existe cuando el servidor confirma y la entrada desaparece.
// Persona 5 puede sustituir el almacenamiento por la capa offline compartida (Q07) sin tocar la lógica.

import type { NewReport } from '../model/types';

export type OutboxStatus = 'guardado_local' | 'enviando' | 'pendiente' | 'error';

export type OutboxEntry = {
  clientRequestId: string;
  report: NewReport;
  status: OutboxStatus;
  attempts: number;
  savedAt: string;
  lastError: string | null;
};

export type OutboxStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export const OUTBOX_STATUS_LABELS: Record<OutboxStatus, string> = {
  guardado_local: 'Guardado en tu teléfono, aún sin enviar',
  enviando: 'Enviando…',
  pendiente: 'Pendiente de envío (sin conexión)',
  error: 'No se pudo enviar',
};

const STATUSES: OutboxStatus[] = ['guardado_local', 'enviando', 'pendiente', 'error'];

function isEntry(value: unknown): value is OutboxEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const report = v.report as Record<string, unknown> | undefined;
  return (
    typeof v.clientRequestId === 'string' &&
    typeof v.status === 'string' &&
    (STATUSES as string[]).includes(v.status) &&
    !!report &&
    typeof report.description === 'string' &&
    typeof report.lat === 'number' &&
    typeof report.lng === 'number' &&
    report.clientRequestId === v.clientRequestId
  );
}

export function outboxKey(userId: string): string {
  return `emergencias.salida.v1:${userId}`;
}

export function createOutbox(storage: OutboxStorage, userId: string) {
  const key = outboxKey(userId);
  // Serializa lecturas-escrituras para que dos operaciones seguidas no se pisen.
  let chain: Promise<unknown> = Promise.resolve();

  async function read(): Promise<OutboxEntry[]> {
    const raw = await storage.getItem(key);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
    } catch {
      return [];
    }
  }

  function mutate(change: (entries: OutboxEntry[]) => OutboxEntry[]): Promise<OutboxEntry[]> {
    const next = chain.then(async () => {
      const updated = change(await read());
      if (updated.length === 0) await storage.removeItem(key);
      else await storage.setItem(key, JSON.stringify(updated));
      return updated;
    });
    chain = next.catch(() => undefined);
    return next;
  }

  return {
    list: (): Promise<OutboxEntry[]> => chain.then(read, read),

    upsert: (entry: OutboxEntry) =>
      mutate((entries) => [
        ...entries.filter((e) => e.clientRequestId !== entry.clientRequestId),
        entry,
      ]),

    patch: (id: string, change: Partial<Omit<OutboxEntry, 'clientRequestId' | 'report'>>) =>
      mutate((entries) => entries.map((e) => (e.clientRequestId === id ? { ...e, ...change } : e))),

    remove: (id: string) => mutate((entries) => entries.filter((e) => e.clientRequestId !== id)),

    /** Tras cerrar la app a mitad de un envío no se sabe si llegó: se reintenta con el mismo identificador. */
    recover: () =>
      mutate((entries) =>
        entries.map((e) => (e.status === 'enviando' ? { ...e, status: 'pendiente' as const } : e)),
      ),
  };
}

export type Outbox = ReturnType<typeof createOutbox>;
