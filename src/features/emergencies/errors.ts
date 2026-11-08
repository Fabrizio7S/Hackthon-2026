// Traduce errores de Supabase/red a mensajes comprensibles para el vecino.
// Las funciones del backend lanzan mensajes en español pensados para mostrarse;
// los mensajes técnicos de PostgREST/Postgres se sustituyen por textos genéricos.

export type EmergencyErrorKind =
  | 'sin_configuracion'
  | 'sin_sesion'
  | 'sin_permiso'
  | 'sin_comunidad'
  | 'no_encontrado'
  | 'validacion'
  | 'conflicto'
  | 'conexion'
  | 'desconocido';

export type EmergencyError = { kind: EmergencyErrorKind; message: string };

export type Result<T> = { ok: true; data: T } | { ok: false; error: EmergencyError };

const GENERIC: Record<EmergencyErrorKind, string> = {
  sin_configuracion: 'La función de emergencias aún no está disponible en el servidor. Avisa al equipo.',
  sin_sesion: 'Inicia sesión para continuar.',
  sin_permiso: 'No tienes permiso para hacer esto.',
  sin_comunidad: 'Necesitas pertenecer a una comunidad para usar Emergencias.',
  no_encontrado: 'Esto ya no está disponible. Actualiza la lista.',
  validacion: 'Revisa los datos e inténtalo de nuevo.',
  conflicto: 'Esto ya cambió. Actualiza para ver el estado actual.',
  conexion: 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
  desconocido: 'Algo salió mal. Inténtalo de nuevo.',
};

type RawError = { code?: string | null; message?: string | null } | null | undefined;

const TECHNICAL = /permission denied|row-level security|violates|jwt|schema cache|could not find|function public\.|syntax error/i;
const CONNECTION = /network request failed|failed to fetch|fetch failed|load failed|timeout|timed out|network|internet|econn|enotfound/i;

export function emergencyError(kind: EmergencyErrorKind, message?: string): EmergencyError {
  return { kind, message: message ?? GENERIC[kind] };
}

export function mapEmergencyError(error: RawError): EmergencyError {
  const code = error?.code ?? '';
  const raw = (error?.message ?? '').trim();
  const lower = raw.toLowerCase();

  if (CONNECTION.test(raw)) return emergencyError('conexion');
  if (['PGRST202', 'PGRST205', '42883', '42P01', '42703'].includes(code) || lower.includes('schema cache')) {
    return emergencyError('sin_configuracion');
  }
  if (code === 'PGRST301' || code === 'PGRST303' || lower.includes('jwt')) return emergencyError('sin_sesion');

  const friendly = raw && !TECHNICAL.test(raw) ? raw : undefined;
  switch (code) {
    case '42501':
      if (lower.includes('iniciar sesión')) return emergencyError('sin_sesion');
      if (lower.includes('pertenecer a una comunidad')) return emergencyError('sin_comunidad', friendly);
      return emergencyError('sin_permiso', friendly);
    case '22023':
      return emergencyError('validacion', friendly);
    case '22P02':
    case '23514':
      return emergencyError('validacion');
    case 'P0002':
      return emergencyError('no_encontrado', friendly);
    case 'P0001':
      return emergencyError('conflicto', friendly);
    default:
      return emergencyError('desconocido');
  }
}

/** Errores que no se resuelven reintentando sin cambiar nada: el envío queda marcado con error. */
export function isRetryableLater(error: EmergencyError): boolean {
  return error.kind === 'conexion' || error.kind === 'sin_sesion';
}
