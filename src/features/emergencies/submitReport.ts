// Orquestación del envío de un reporte: guardar localmente → enviar → confirmar.
// Regla central: solo se informa «enviado» cuando el servidor lo registró.

import type { EmergencyError } from './errors';
import { isRetryableLater } from './errors';
import type { Outbox, OutboxEntry } from './outbox';
import type { Result } from './errors';
import type { NewReport } from './types';

export type SubmitOutcome =
  /** El servidor registró el reporte (duplicate: ya lo tenía por un envío anterior). */
  | { state: 'enviado'; id: string; duplicate: boolean }
  /** Sin conexión o sin sesión: no se envió. saved indica si quedó guardado en el teléfono. */
  | { state: 'pendiente'; message: string; saved: boolean }
  /** El servidor lo rechazó: hay que corregirlo o descartarlo. */
  | { state: 'error'; error: EmergencyError };

type Deps = {
  api: { createReport(report: NewReport): Promise<Result<{ id: string; duplicate: boolean }>> };
  outbox: Outbox;
  now?: () => Date;
};

async function safely<T>(action: () => Promise<T>): Promise<boolean> {
  try {
    await action();
    return true;
  } catch {
    return false;
  }
}

/** Envía una entrada ya guardada (primer intento o reintento) y deja la cola coherente. */
async function deliver(deps: Deps, entry: OutboxEntry, saved: boolean): Promise<SubmitOutcome> {
  if (saved) await safely(() => deps.outbox.patch(entry.clientRequestId, { status: 'enviando', attempts: entry.attempts + 1, lastError: null }));

  const result = await deps.api.createReport(entry.report);

  if (result.ok) {
    if (saved) await safely(() => deps.outbox.remove(entry.clientRequestId));
    return { state: 'enviado', id: result.data.id, duplicate: result.data.duplicate };
  }

  if (isRetryableLater(result.error)) {
    if (saved) await safely(() => deps.outbox.patch(entry.clientRequestId, { status: 'pendiente', lastError: result.error.message }));
    return { state: 'pendiente', message: result.error.message, saved };
  }

  if (saved) await safely(() => deps.outbox.patch(entry.clientRequestId, { status: 'error', lastError: result.error.message }));
  return { state: 'error', error: result.error };
}

/** Primer envío: guarda en el teléfono antes de intentar la red para no perder el reporte. */
export async function submitNewReport(deps: Deps, report: NewReport): Promise<SubmitOutcome> {
  const entry: OutboxEntry = {
    clientRequestId: report.clientRequestId,
    report,
    status: 'guardado_local',
    attempts: 0,
    savedAt: (deps.now ? deps.now() : new Date()).toISOString(),
    lastError: null,
  };
  const saved = await safely(() => deps.outbox.upsert(entry));
  return deliver(deps, entry, saved);
}

/** Reintenta una entrada de la cola con su mismo identificador (el backend evita duplicados). */
export function retryEntry(deps: Deps, entry: OutboxEntry): Promise<SubmitOutcome> {
  return deliver(deps, entry, true);
}

/** Intenta enviar las entradas que esperan conexión. Las que fallaron por validación no se reintentan solas. */
export async function flushPending(deps: Deps): Promise<{ entry: OutboxEntry; outcome: SubmitOutcome }[]> {
  const entries = (await deps.outbox.list()).filter(e => e.status === 'pendiente' || e.status === 'guardado_local');
  const results: { entry: OutboxEntry; outcome: SubmitOutcome }[] = [];
  for (const entry of entries) {
    results.push({ entry, outcome: await retryEntry(deps, entry) });
    // Sin conexión no tiene sentido seguir probando el resto.
    const last = results[results.length - 1].outcome;
    if (last.state === 'pendiente') break;
  }
  return results;
}
