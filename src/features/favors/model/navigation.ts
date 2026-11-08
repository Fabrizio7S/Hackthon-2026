import { type Neighbor } from './types';

export const tabs = ['Explorar', 'Guardadas', 'Mi actividad'] as const;

export type Tab = (typeof tabs)[number];

export const actor: Neighbor = 'ana';
