// Acceso a datos del módulo G04. Toda escritura pasa por funciones de Supabase que validan
// actor, comunidad y transición en el servidor; esta capa solo traduce resultados y errores.

import type { SupabaseClient } from '@supabase/supabase-js';

import { emergencyError, mapEmergencyError, type Result } from '../model/errors';
import { parseCreated, parseEmergencyDetail, parseFeed, parseSupportDirectory } from './mappers';
import type {
  EmergencyDetail,
  EmergencyFeed,
  EmergencyStatus,
  NewGroup,
  NewReport,
  NewResource,
  SupportDirectory,
} from '../model/types';

/** Identificador único por envío: reintentar el mismo envío no duplica el reporte. */
export function newClientRequestId(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function createEmergenciesApi(client: SupabaseClient | null) {
  async function call<T>(
    fn: string,
    args: Record<string, unknown> | undefined,
    parse: (raw: unknown) => T,
  ): Promise<Result<T>> {
    if (!client) return { ok: false, error: emergencyError('sin_configuracion') };
    try {
      const { data, error } = await client.rpc(fn, args);
      if (error) return { ok: false, error: mapEmergencyError(error) };
      return { ok: true, data: parse(data) };
    } catch (failure) {
      return {
        ok: false,
        error: mapEmergencyError({
          message: failure instanceof Error ? failure.message : String(failure),
        }),
      };
    }
  }

  const ignore = () => undefined;

  return {
    loadFeed: (): Promise<Result<EmergencyFeed>> =>
      call('listar_emergencias', undefined, parseFeed),

    loadDetail: (id: string): Promise<Result<EmergencyDetail>> =>
      call('obtener_emergencia', { p_id: id }, parseEmergencyDetail),

    /** El servidor responde duplicado=true si ese envío ya se había registrado. */
    createReport: (report: NewReport): Promise<Result<{ id: string; duplicate: boolean }>> =>
      call(
        'crear_emergencia',
        {
          p_categoria: report.category,
          p_nivel: report.level,
          p_descripcion: report.description,
          p_lat: report.lat,
          p_lng: report.lng,
          p_ubicacion_origen: report.locationOrigin,
          p_es_persona_vulnerable: report.vulnerable,
          p_client_request_id: report.clientRequestId,
        },
        parseCreated,
      ),

    changeStatus: (id: string, status: EmergencyStatus): Promise<Result<EmergencyDetail>> =>
      call('cambiar_estado_emergencia', { p_id: id, p_estado: status }, parseEmergencyDetail),

    offerHelp: (
      id: string,
      note: string,
      requestId: string,
    ): Promise<Result<{ id: string; duplicate: boolean }>> =>
      call(
        'ofrecer_ayuda_emergencia',
        { p_emergencia: id, p_nota: note, p_client_request_id: requestId },
        parseCreated,
      ),

    resolveOffer: (offerId: string, accept: boolean): Promise<Result<EmergencyDetail>> =>
      call(
        'resolver_apoyo_emergencia',
        { p_apoyo: offerId, p_aceptar: accept },
        parseEmergencyDetail,
      ),

    withdrawOffer: (offerId: string): Promise<Result<EmergencyDetail>> =>
      call('retirar_apoyo_emergencia', { p_apoyo: offerId }, parseEmergencyDetail),

    loadSupport: (): Promise<Result<SupportDirectory>> =>
      call('listar_apoyo_comunidad', undefined, parseSupportDirectory),

    joinGroup: (groupId: string): Promise<Result<void>> =>
      call('unirse_grupo_apoyo', { p_grupo: groupId }, ignore),

    leaveGroup: (groupId: string): Promise<Result<void>> =>
      call('salir_grupo_apoyo', { p_grupo: groupId }, ignore),

    registerResource: (input: NewResource): Promise<Result<void>> =>
      call(
        'registrar_recurso_apoyo',
        {
          p_tipo: input.type,
          p_nombre: input.name,
          p_lugar: input.place,
          p_detalle: input.detail,
          p_lat: input.lat,
          p_lng: input.lng,
        },
        ignore,
      ),

    setResourceAvailable: (id: string, available: boolean): Promise<Result<void>> =>
      call('cambiar_disponibilidad_recurso', { p_id: id, p_disponible: available }, ignore),

    registerGroup: (input: NewGroup): Promise<Result<void>> =>
      call(
        'registrar_grupo_apoyo',
        { p_tipo: input.type, p_nombre: input.name, p_descripcion: input.description },
        ignore,
      ),

    setGroupActive: (id: string, active: boolean): Promise<Result<void>> =>
      call('cambiar_estado_grupo_apoyo', { p_id: id, p_activo: active }, ignore),
  };
}

export type EmergenciesApi = ReturnType<typeof createEmergenciesApi>;
