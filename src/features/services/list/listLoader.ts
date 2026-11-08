// Estados de carga de una lista y cargador con reintento.
// Lógica pura, sin React, para poder probarla aparte.

export type ListState<T> =
  | { status: 'cargando' }
  | { status: 'vacio' }
  | { status: 'listo'; items: T[] }
  | { status: 'error'; message: string };

export const LIST_ERROR_MESSAGE =
  'No se pudieron cargar las ofertas. Revisa tu conexión e inténtalo de nuevo.';

/** Error con un mensaje ya pensado para el vecino; se muestra tal cual. */
export class ListLoadError extends Error {}

export type ListLoader = {
  /** Inicia una carga. Si había otra en curso, su respuesta se descarta. */
  load: () => Promise<void>;
};

/**
 * Crea un cargador que traduce el resultado de `fetchItems` a un ListState.
 * Solo se aplica la respuesta de la última carga iniciada, para que una
 * respuesta lenta anterior no sobrescriba otra más reciente.
 */
export function createListLoader<T>(
  fetchItems: () => Promise<T[]>,
  onState: (state: ListState<T>) => void,
): ListLoader {
  let latest = 0;

  async function load(): Promise<void> {
    const request = ++latest;
    onState({ status: 'cargando' });
    let next: ListState<T>;
    try {
      const items = await fetchItems();
      next = items.length === 0 ? { status: 'vacio' } : { status: 'listo', items };
    } catch (error) {
      const message = error instanceof ListLoadError ? error.message : LIST_ERROR_MESSAGE;
      next = { status: 'error', message };
    }
    if (request === latest) onState(next);
  }

  return { load };
}
