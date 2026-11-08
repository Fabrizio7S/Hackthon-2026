import { Linking } from 'react-native';

import { buildTelUrl, buildWhatsAppUrl, normalizePhone } from './phone';

export type ContactChannel = 'llamada' | 'whatsapp';

/**
 * Resultado de intentar abrir un contacto.
 * «abierto» solo significa que el sistema aceptó abrir el enlace: no demuestra
 * que hubo conversación, contratación ni servicio completado, y no se registra.
 */
export type ContactResult =
  | { status: 'abierto' }
  | { status: 'sin_contacto' }
  | { status: 'contacto_invalido' }
  | { status: 'no_disponible' };

export const CONTACT_MESSAGES: Record<Exclude<ContactResult['status'], 'abierto'>, string> = {
  sin_contacto: 'Esta oferta no tiene un número de contacto.',
  contacto_invalido: 'El número de contacto no es válido. Avisa al vecino para que lo corrija.',
  no_disponible:
    'No se pudo abrir la aplicación en este teléfono. Puedes anotar el número y llamar desde otro equipo.',
};

/**
 * Abre el marcador o WhatsApp con el número del anunciante.
 * No usa canOpenURL: en Android 11+ e iOS requiere declarar esquemas en app.json,
 * que es un archivo compartido. Se intenta abrir y se informa si falla.
 */
export async function openContact(
  channel: ContactChannel,
  rawPhone: string | null | undefined,
): Promise<ContactResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone.ok) {
    return { status: phone.reason === 'vacio' ? 'sin_contacto' : 'contacto_invalido' };
  }

  const url = channel === 'llamada' ? buildTelUrl(phone.digits) : buildWhatsAppUrl(phone.digits);
  try {
    await Linking.openURL(url);
    return { status: 'abierto' };
  } catch {
    return { status: 'no_disponible' };
  }
}
