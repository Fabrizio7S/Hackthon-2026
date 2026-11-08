// Convierte las respuestas JSON de las funciones de Supabase en los contratos de types.ts.
// Es defensivo: un valor desconocido se degrada a un valor seguro en vez de romper la lista.

import type {
  CommunityZone,
  Emergency,
  EmergencyCategory,
  EmergencyDetail,
  EmergencyFeed,
  EmergencyLevel,
  EmergencyStatus,
  GroupType,
  LocationOrigin,
  MyOffer,
  OfferStatus,
  Resource,
  ResourceType,
  SupportDirectory,
  SupportGroup,
  SupportOffer,
} from './types';

type Raw = Record<string, unknown>;

const CATEGORIES: EmergencyCategory[] = ['agua', 'salud', 'vivienda', 'alimentos', 'luz', 'otro'];
const LEVELS: EmergencyLevel[] = ['critica', 'alta', 'media'];
const STATUSES: EmergencyStatus[] = ['abierta', 'en_atencion', 'solucionado'];
const ORIGINS: LocationOrigin[] = ['dispositivo', 'zona_comunidad', 'desconocido'];
const OFFER_STATUSES: OfferStatus[] = ['ofrecido', 'aceptado', 'rechazado', 'retirado'];
const RESOURCE_TYPES: ResourceType[] = ['agua', 'botiquin', 'zona_segura', 'extintor', 'otro'];
const GROUP_TYPES: GroupType[] = ['brigada', 'olla_comun', 'oficios'];

function obj(value: unknown): Raw {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Raw;
  throw new Error('Respuesta inesperada del servidor');
}

function list(value: unknown): Raw[] {
  return Array.isArray(value) ? value.map(obj) : [];
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function strOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function bool(value: unknown): boolean {
  return value === true;
}

function numOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function int(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? Math.trunc(n) : 0;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function required(value: unknown, name: string): string {
  if (typeof value === 'string' && value.length > 0) return value;
  throw new Error(`Respuesta inesperada del servidor (${name})`);
}

function parseMyOffer(value: unknown): MyOffer | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Raw;
  if (typeof raw.id !== 'string') return null;
  return { id: raw.id, status: oneOf(raw.estado, OFFER_STATUSES, 'ofrecido') };
}

export function parseEmergency(value: unknown): Emergency {
  const r = obj(value);
  return {
    id: required(r.id, 'id'),
    category: oneOf(r.categoria, CATEGORIES, 'otro'),
    level: oneOf(r.nivel, LEVELS, 'media'),
    status: oneOf(r.estado, STATUSES, 'abierta'),
    description: strOrNull(r.descripcion),
    vulnerable: bool(r.es_persona_vulnerable),
    restricted: bool(r.detalle_restringido),
    lat: numOrNull(r.lat),
    lng: numOrNull(r.lng),
    locationOrigin: oneOf(r.ubicacion_origen, ORIGINS, 'desconocido'),
    approximate: bool(r.ubicacion_aproximada) || r.ubicacion_origen === 'zona_comunidad',
    mine: bool(r.es_mio),
    authorName: strOrNull(r.autor_nombre),
    canManage: bool(r.puede_gestionar),
    offersCount: int(r.apoyos_ofrecidos),
    acceptedCount: int(r.apoyos_aceptados),
    myOffer: parseMyOffer(r.mi_apoyo),
    isDemo: bool(r.es_demo),
    createdAt: str(r.creado_en),
    updatedAt: str(r.actualizado_en, str(r.creado_en)),
    attendedAt: strOrNull(r.atendido_en),
    closedAt: strOrNull(r.cerrado_en),
  };
}

function parseOffer(value: Raw): SupportOffer {
  return {
    id: required(value.id, 'apoyo.id'),
    helperId: str(value.ayudante_id),
    helperName: str(value.ayudante_nombre, 'Vecino'),
    note: str(value.nota),
    status: oneOf(value.estado, OFFER_STATUSES, 'ofrecido'),
    mine: bool(value.es_mio),
    createdAt: str(value.creado_en),
  };
}

export function parseEmergencyDetail(value: unknown): EmergencyDetail {
  const r = obj(value);
  return { ...parseEmergency(r), offers: list(r.apoyos).map(parseOffer) };
}

function parseZone(value: unknown): CommunityZone {
  if (!value || typeof value !== 'object') return { lat: null, lng: null, name: null };
  const z = value as Raw;
  return { lat: numOrNull(z.lat), lng: numOrNull(z.lng), name: strOrNull(z.nombre) };
}

export function parseFeed(value: unknown): EmergencyFeed {
  const r = obj(value);
  return {
    communityId: required(r.community_id, 'community_id'),
    communityName: str(r.community_name, 'Mi comunidad'),
    zone: parseZone(r.zona),
    isRepresentative: bool(r.soy_representante),
    items: list(r.items).map(parseEmergency),
  };
}

function parseResource(r: Raw): Resource {
  return {
    id: required(r.id, 'recurso.id'),
    type: oneOf(r.tipo, RESOURCE_TYPES, 'otro'),
    name: str(r.nombre),
    place: str(r.lugar),
    detail: str(r.detalle),
    lat: numOrNull(r.lat),
    lng: numOrNull(r.lng),
    available: bool(r.disponible),
    isDemo: bool(r.es_demo),
    registeredBy: strOrNull(r.registrado_por),
    updatedAt: str(r.actualizado_en),
  };
}

function parseGroup(r: Raw): SupportGroup {
  return {
    id: required(r.id, 'grupo.id'),
    type: oneOf(r.tipo, GROUP_TYPES, 'brigada'),
    name: str(r.nombre),
    description: str(r.descripcion),
    active: r.activo !== false,
    isDemo: bool(r.es_demo),
    registeredBy: strOrNull(r.registrado_por),
    members: int(r.integrantes),
    joined: bool(r.soy_integrante),
    createdAt: str(r.creado_en),
  };
}

export function parseSupportDirectory(value: unknown): SupportDirectory {
  const r = obj(value);
  return {
    communityId: required(r.community_id, 'community_id'),
    isRepresentative: bool(r.soy_representante),
    zone: parseZone(r.zona),
    resources: list(r.recursos).map(parseResource),
    groups: list(r.grupos).map(parseGroup),
  };
}

export function parseCreated(value: unknown): { id: string; duplicate: boolean } {
  const r = obj(value);
  return { id: required(r.id, 'id'), duplicate: bool(r.duplicado) };
}
