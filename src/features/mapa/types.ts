
export type CategoriaMapa = 'servicio' | 'producto' | 'emergencia' | 'recurso';

export interface OfertaMapa {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaMapa;

  // Coordenadas de la oferta registrada.
  latitud: number;
  longitud: number;

  // Datos opcionales proporcionados por el módulo de servicios o emergencias.
  calificacionPromedio?: number | null;
  cantidadCalificaciones?: number;
  precio?: number | null;
  moneda?: string;
  imagenUrl?: string | null;
  autorNombre?: string | null;
  etiquetaEstado?: string | null;
}

/** Cámara del mapa; `zoom` se usa en la web y los deltas en el móvil. */
export interface VistaMapa {
  latitude: number;
  longitude: number;
  zoom?: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

/**
 * Exploración del mapa que debe sobrevivir al abrir un detalle y volver:
 * búsqueda, filtro, oferta seleccionada y cámara. Es un objeto mutable que
 * conserva quien monta el mapa (no se reinicia al desmontar la pantalla).
 */
export interface SesionMapa {
  busqueda: string;
  filtro: 'todos' | CategoriaMapa;
  seleccionId: string | null;
  vista: VistaMapa | null;
  /** True cuando la persona movió o acercó el mapa; entonces no se recentra solo. */
  explorado: boolean;
}

export function crearSesionMapa(): SesionMapa {
  return { busqueda: '', filtro: 'todos', seleccionId: null, vista: null, explorado: false };
}

/** Nombre hablado de cada categoría para lectores de pantalla. */
export const NOMBRE_CATEGORIA: Record<CategoriaMapa, string> = {
  servicio: 'Servicio',
  producto: 'Producto',
  emergencia: 'Emergencia',
  recurso: 'Recurso de apoyo',
};
