import { type EmergencyStatus, type OfferStatus } from './types';
import { type Tone } from '../components/ui';

export const OFFER_TONE: Record<OfferStatus, Tone> = {
  ofrecido: 'warning',
  aceptado: 'success',
  rechazado: 'neutral',
  retirado: 'neutral',
};

export const STATUS_TONE: Record<EmergencyStatus, Tone> = {
  abierta: 'danger',
  en_atencion: 'warning',
  solucionado: 'success',
};
