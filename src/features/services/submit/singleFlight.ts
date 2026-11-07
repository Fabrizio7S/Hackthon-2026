// Evita ejecutar dos veces la misma operación mientras la primera sigue en curso.
// Lógica pura, sin React, para poder probarla aparte.

export type SingleFlightResult<T> =
  | { status: 'ejecutado'; value: T }
  | { status: 'error'; error: unknown }
  | { status: 'ignorado' };

export type SingleFlight<A extends unknown[], T> = {
  run: (...args: A) => Promise<SingleFlightResult<T>>;
  isRunning: () => boolean;
};

/**
 * Envuelve una operación asíncrona. Si se llama otra vez antes de que termine,
 * la nueva llamada se ignora y devuelve «ignorado» sin ejecutar nada.
 * Al terminar, con éxito o con error, se puede volver a ejecutar (reintento).
 *
 * Solo protege contra toques repetidos en el mismo dispositivo. No evita
 * duplicados por reintentos tras perder la conexión: eso depende de Q07.
 */
export function createSingleFlight<A extends unknown[], T>(
  operation: (...args: A) => Promise<T>,
  onRunningChange?: (running: boolean) => void,
): SingleFlight<A, T> {
  let running = false;

  async function run(...args: A): Promise<SingleFlightResult<T>> {
    if (running) return { status: 'ignorado' };
    running = true;
    onRunningChange?.(true);
    try {
      return { status: 'ejecutado', value: await operation(...args) };
    } catch (error) {
      return { status: 'error', error };
    } finally {
      running = false;
      onRunningChange?.(false);
    }
  }

  return { run, isRunning: () => running };
}
