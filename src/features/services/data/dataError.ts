// Traduce los errores de Supabase a casos que la pantalla puede manejar.

export type DataErrorKind =
  | 'sin_configuracion'
  | 'sin_sesion'
  | 'sin_permiso'
  | 'no_encontrado'
  | 'validacion'
  | 'conexion'
  | 'desconocido';

export type DataError = { kind: DataErrorKind; message: string };

export type DataResult<T> = { ok: true; data: T } | { ok: false; error: DataError };

const MESSAGES: Record<DataErrorKind, string> = {
  sin_configuracion: 'La app no está conectada al servidor. Avisa al equipo.',
  sin_sesion: 'Inicia sesión para continuar.',
  sin_permiso: 'No tienes permiso para hacer esto.',
  no_encontrado: 'Esta oferta ya no está disponible.',
  validacion: 'Revisa los datos e inténtalo de nuevo.',
  conexion: 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
  desconocido: 'Algo salió mal. Inténtalo de nuevo.',
};

export function dataError(kind: DataErrorKind): DataError {
  return { kind, message: MESSAGES[kind] };
}

/** Forma mínima de los errores de Supabase (PostgREST) y de red. */
type RawError = { code?: string; message?: string } | null | undefined;

export function mapDataError(error: RawError): DataError {
  const code = error?.code ?? '';
  const message = (error?.message ?? '').toLowerCase();

  if (code === '42501' || message.includes('row-level security')) return dataError('sin_permiso');
  if (code === 'PGRST116') return dataError('no_encontrado');
  // Tabla o vista inexistente: la migración no está aplicada en el proyecto.
  if (code === 'PGRST205' || code === '42P01') return dataError('sin_configuracion');
  if (code === '23514' || code === '22P02' || code === '23502') return dataError('validacion');
  if (code === 'PGRST301' || code === 'PGRST303' || message.includes('jwt')) return dataError('sin_sesion');
  if (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('timeout')
  ) {
    return dataError('conexion');
  }
  return dataError('desconocido');
}

export const UNIQUE_VIOLATION = '23505';
