// Contratos del módulo G04 (emergencias y recursos de apoyo).
// Los valores reflejan los enums del backend. Las reglas (quién atiende, cierra y ve
// qué) se validan en Supabase; aquí solo se nombran para la interfaz.

import type { IconName } from '../../shared/AppIcon';

export type EmergencyCategory = 'agua' | 'salud' | 'vivienda' | 'alimentos' | 'luz' | 'otro';
export type EmergencyLevel = 'critica' | 'alta' | 'media';
export type EmergencyStatus = 'abierta' | 'en_atencion' | 'solucionado';
export type LocationOrigin = 'dispositivo' | 'zona_comunidad' | 'desconocido';
export type OfferStatus = 'ofrecido' | 'aceptado' | 'rechazado' | 'retirado';
export type ResourceType = 'agua' | 'botiquin' | 'zona_segura' | 'extintor' | 'otro';
export type GroupType = 'brigada' | 'olla_comun' | 'oficios';

export const CATEGORY_OPTIONS: ReadonlyArray<{ value: EmergencyCategory; label: string; symbol: string; icon: IconName }> = [
  { value: 'agua', label: 'Agua', symbol: '💧', icon: 'drop' },
  { value: 'salud', label: 'Salud', symbol: '🩺', icon: 'pulse' },
  { value: 'vivienda', label: 'Vivienda', symbol: '🏠', icon: 'home' },
  { value: 'alimentos', label: 'Alimentos', symbol: '🍲', icon: 'bowl' },
  { value: 'luz', label: 'Luz', symbol: '💡', icon: 'bolt' },
  { value: 'otro', label: 'Otro', symbol: '⚠️', icon: 'alert' },
];

export const LEVEL_OPTIONS: ReadonlyArray<{ value: EmergencyLevel; label: string; hint: string }> = [
  { value: 'critica', label: 'Crítica', hint: 'Hay riesgo para la vida o la salud ahora mismo.' },
  { value: 'alta', label: 'Alta', hint: 'Necesita atención hoy.' },
  { value: 'media', label: 'Media', hint: 'Puede esperar unas horas.' },
];

export const STATUS_LABELS: Record<EmergencyStatus, string> = {
  abierta: 'Abierta',
  en_atencion: 'En atención',
  solucionado: 'Solucionada',
};

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  ofrecido: 'Enviado, esperando respuesta',
  aceptado: 'Aceptado',
  rechazado: 'No aceptado',
  retirado: 'Retirado',
};

export const RESOURCE_OPTIONS: ReadonlyArray<{ value: ResourceType; label: string; symbol: string; icon: IconName }> = [
  { value: 'agua', label: 'Agua', symbol: '🚰', icon: 'drop' },
  { value: 'botiquin', label: 'Botiquín', symbol: '🧰', icon: 'aid' },
  { value: 'zona_segura', label: 'Zona segura', symbol: '🛟', icon: 'support' },
  { value: 'extintor', label: 'Extintor', symbol: '🧯', icon: 'extinguisher' },
  { value: 'otro', label: 'Otro', symbol: '📦', icon: 'box' },
];

export const GROUP_OPTIONS: ReadonlyArray<{ value: GroupType; label: string; symbol: string; icon: IconName }> = [
  { value: 'brigada', label: 'Brigada vecinal', symbol: '🦺', icon: 'people' },
  { value: 'olla_comun', label: 'Olla común', symbol: '🍲', icon: 'bowl' },
  { value: 'oficios', label: 'Directorio de oficios', symbol: '🛠️', icon: 'services' },
];

export type MyOffer = { id: string; status: OfferStatus };

export type Emergency = {
  id: string;
  category: EmergencyCategory;
  level: EmergencyLevel;
  status: EmergencyStatus;
  /** null cuando el detalle está reservado por privacidad. */
  description: string | null;
  vulnerable: boolean;
  /** true si el vecino no puede ver el detalle de un reporte sobre una persona vulnerable. */
  restricted: boolean;
  lat: number | null;
  lng: number | null;
  locationOrigin: LocationOrigin;
  /** true si la ubicación se redondea (privacidad) o proviene de la zona de la comunidad. */
  approximate: boolean;
  mine: boolean;
  authorName: string | null;
  /** El autor del reporte o el representante pueden atender y cerrar. */
  canManage: boolean;
  offersCount: number;
  acceptedCount: number;
  myOffer: MyOffer | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  attendedAt: string | null;
  closedAt: string | null;
};

export type SupportOffer = {
  id: string;
  helperId: string;
  helperName: string;
  note: string;
  status: OfferStatus;
  mine: boolean;
  createdAt: string;
};

export type EmergencyDetail = Emergency & { offers: SupportOffer[] };

export type CommunityZone = { lat: number | null; lng: number | null; name: string | null };

export type EmergencyFeed = {
  communityId: string;
  communityName: string;
  zone: CommunityZone;
  isRepresentative: boolean;
  items: Emergency[];
};

export type Resource = {
  id: string;
  type: ResourceType;
  name: string;
  place: string;
  detail: string;
  lat: number | null;
  lng: number | null;
  available: boolean;
  isDemo: boolean;
  registeredBy: string | null;
  updatedAt: string;
};

export type SupportGroup = {
  id: string;
  type: GroupType;
  name: string;
  description: string;
  active: boolean;
  isDemo: boolean;
  registeredBy: string | null;
  members: number;
  joined: boolean;
  createdAt: string;
};

export type SupportDirectory = {
  communityId: string;
  isRepresentative: boolean;
  zone: CommunityZone;
  resources: Resource[];
  groups: SupportGroup[];
};

/** Datos de un reporte nuevo. `clientRequestId` evita duplicados al reintentar. */
export type NewReport = {
  category: EmergencyCategory;
  level: EmergencyLevel;
  description: string;
  vulnerable: boolean;
  lat: number;
  lng: number;
  locationOrigin: LocationOrigin;
  clientRequestId: string;
};

export type NewResource = {
  type: ResourceType;
  name: string;
  place: string;
  detail: string;
  lat: number | null;
  lng: number | null;
};

export type NewGroup = { type: GroupType; name: string; description: string };

export const DESCRIPTION_MIN = 5;
export const DESCRIPTION_MAX = 500;
export const NOTE_MAX = 200;
