import { type SesionMapa } from '../types';

export function crearSesionMapa(): SesionMapa {
  return { busqueda: '', filtro: 'todos', seleccionId: null, vista: null, explorado: false };
}
