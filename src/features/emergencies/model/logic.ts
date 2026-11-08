// Reglas puras de presentación: orden, filtros, validación de formulario y fechas.
// Las reglas de negocio reales (quién puede cambiar un estado) las aplica el backend;
// nextStatuses solo decide qué botones mostrar.

import type {
  CommunityZone,
  Emergency,
  EmergencyCategory,
  EmergencyLevel,
  EmergencyStatus,
  LocationOrigin,
  NewReport,
} from './types';
import { DESCRIPTION_MAX, DESCRIPTION_MIN, NOTE_MAX } from './types';

export type StatusFilter = 'todas' | EmergencyStatus;

const STATUS_RANK: Record<EmergencyStatus, number> = { abierta: 0, en_atencion: 1, solucionado: 2 };
const LEVEL_RANK: Record<EmergencyLevel, number> = { critica: 0, alta: 1, media: 2 };

/** Abiertas primero, luego en atención y al final solucionadas; dentro, la más urgente y reciente primero. */
export function sortEmergencies(items: readonly Emergency[]): Emergency[] {
  return [...items].sort((a, b) => {
    if (STATUS_RANK[a.status] !== STATUS_RANK[b.status])
      return STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (LEVEL_RANK[a.level] !== LEVEL_RANK[b.level])
      return LEVEL_RANK[a.level] - LEVEL_RANK[b.level];
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function filterByStatus(items: readonly Emergency[], filter: StatusFilter): Emergency[] {
  return filter === 'todas' ? [...items] : items.filter((item) => item.status === filter);
}

export function countByStatus(items: readonly Emergency[]): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = {
    todas: items.length,
    abierta: 0,
    en_atencion: 0,
    solucionado: 0,
  };
  for (const item of items) counts[item.status] += 1;
  return counts;
}

export type StatusAction = { to: EmergencyStatus; label: string; confirm: string | null };

/** Acciones de estado que el backend aceptaría para quien atiende o cierra. */
export function nextStatuses(status: EmergencyStatus, canManage: boolean): StatusAction[] {
  if (!canManage) return [];
  switch (status) {
    case 'abierta':
      return [
        { to: 'en_atencion', label: 'Marcar en atención', confirm: null },
        {
          to: 'solucionado',
          label: 'Marcar como solucionada',
          confirm: 'Esto cierra el reporte para todos los vecinos.',
        },
      ];
    case 'en_atencion':
      return [
        {
          to: 'solucionado',
          label: 'Marcar como solucionada',
          confirm: 'Esto cierra el reporte para todos los vecinos.',
        },
        { to: 'abierta', label: 'Volver a abierta', confirm: null },
      ];
    default:
      return [];
  }
}

export function isValidCoordinate(
  lat: number | null | undefined,
  lng: number | null | undefined,
): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export type ReportForm = {
  category: EmergencyCategory | null;
  level: EmergencyLevel | null;
  description: string;
  vulnerable: boolean;
};

export type ReportErrors = Partial<
  Record<'category' | 'level' | 'description' | 'location', string>
>;

export type ReportLocation = { lat: number; lng: number; origin: LocationOrigin };

/** Ubicación del dispositivo si existe; si no, la zona de la comunidad (aproximada). Nunca inventa una. */
export function resolveReportLocation(
  device: { latitude: number; longitude: number } | null | undefined,
  zone: CommunityZone | null | undefined,
): ReportLocation | null {
  if (device && isValidCoordinate(device.latitude, device.longitude)) {
    return { lat: device.latitude, lng: device.longitude, origin: 'dispositivo' };
  }
  if (zone && isValidCoordinate(zone.lat, zone.lng)) {
    return { lat: zone.lat as number, lng: zone.lng as number, origin: 'zona_comunidad' };
  }
  return null;
}

export type ReportValidation =
  { ok: true; report: Omit<NewReport, 'clientRequestId'> } | { ok: false; errors: ReportErrors };

export function validateReport(
  form: ReportForm,
  location: ReportLocation | null,
): ReportValidation {
  const errors: ReportErrors = {};
  if (!form.category) errors.category = 'Elige qué tipo de problema es.';
  if (!form.level) errors.level = 'Elige qué tan urgente es.';
  const description = form.description.trim();
  if (description.length < DESCRIPTION_MIN) {
    errors.description = `Cuéntanos qué pasa con al menos ${DESCRIPTION_MIN} letras.`;
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = `Puedes escribir hasta ${DESCRIPTION_MAX} caracteres.`;
  }
  if (!location) {
    errors.location =
      'No pudimos saber dónde ocurre. Conéctate una vez para cargar la zona de tu comunidad o activa tu ubicación.';
  }
  if (Object.keys(errors).length > 0 || !form.category || !form.level || !location)
    return { ok: false, errors };
  return {
    ok: true,
    report: {
      category: form.category,
      level: form.level,
      description,
      vulnerable: form.vulnerable,
      lat: location.lat,
      lng: location.lng,
      locationOrigin: location.origin,
    },
  };
}

export function validateNote(note: string): string | null {
  return note.trim().length > NOTE_MAX ? `La nota puede tener hasta ${NOTE_MAX} caracteres.` : null;
}

/** «hace 5 min», «hace 3 h», «ayer» o la fecha. Devuelve cadena vacía si la fecha no es válida. */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return '';
  const minutes = Math.floor((now - time) / 60000);
  if (minutes < 1) return 'justo ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  const date = new Date(time);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}
