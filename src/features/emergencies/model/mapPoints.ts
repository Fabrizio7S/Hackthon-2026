// Adaptador de los registros de emergencias y recursos al mapa compartido (Persona 5).
// Usa los mismos registros y estados que la lista y el detalle, y nunca inventa una ubicación:
// los registros sin coordenadas válidas se omiten. La ubicación de un reporte sobre una persona
// vulnerable ya llega redondeada desde el servidor cuando el vecino no tiene acceso al detalle.

import { isValidCoordinate } from './logic';
import type {
  Emergency,
  EmergencyCategory,
  EmergencyLevel,
  EmergencyStatus,
  Resource,
  ResourceType,
} from './types';

export type EmergencyMapPoint =
  | {
      kind: 'emergencia';
      id: string;
      nombre: string;
      descripcion: string;
      latitud: number;
      longitud: number;
      categoria: EmergencyCategory;
      urgencia: EmergencyLevel;
      estado: EmergencyStatus;
      aproximada: boolean;
      esDemo: boolean;
    }
  | {
      kind: 'recurso';
      id: string;
      nombre: string;
      descripcion: string;
      latitud: number;
      longitud: number;
      categoria: ResourceType;
      disponible: boolean;
      aproximada: boolean;
      esDemo: boolean;
    };

const CATEGORY_NAMES: Record<EmergencyCategory, string> = {
  agua: 'Agua',
  salud: 'Salud',
  vivienda: 'Vivienda',
  alimentos: 'Alimentos',
  luz: 'Luz',
  otro: 'Otro',
};

export function toEmergencyMapPoints(
  emergencies: readonly Emergency[],
  options: { includeClosed?: boolean } = {},
): EmergencyMapPoint[] {
  const points: EmergencyMapPoint[] = [];
  for (const e of emergencies) {
    if (e.status === 'solucionado' && !options.includeClosed) continue;
    if (!isValidCoordinate(e.lat, e.lng)) continue;
    points.push({
      kind: 'emergencia',
      id: e.id,
      nombre: `${CATEGORY_NAMES[e.category]} · ${e.level}`,
      descripcion: e.restricted ? 'Detalle reservado por privacidad' : (e.description ?? ''),
      latitud: e.lat as number,
      longitud: e.lng as number,
      categoria: e.category,
      urgencia: e.level,
      estado: e.status,
      aproximada: e.approximate,
      esDemo: e.isDemo,
    });
  }
  return points;
}

export function toResourceMapPoints(resources: readonly Resource[]): EmergencyMapPoint[] {
  const points: EmergencyMapPoint[] = [];
  for (const r of resources) {
    if (!isValidCoordinate(r.lat, r.lng)) continue;
    points.push({
      kind: 'recurso',
      id: r.id,
      nombre: r.name,
      descripcion: r.place,
      latitud: r.lat as number,
      longitud: r.lng as number,
      categoria: r.type,
      disponible: r.available && !r.isDemo,
      aproximada: true,
      esDemo: r.isDemo,
    });
  }
  return points;
}
