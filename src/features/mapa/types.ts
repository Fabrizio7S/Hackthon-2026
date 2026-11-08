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

export interface VistaMapa {
  latitude: number;
  longitude: number;
  zoom?: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export interface SesionMapa {
  busqueda: string;
  filtro: 'todos' | CategoriaMapa;
  seleccionId: string | null;
  vista: VistaMapa | null;
  /** True cuando la persona movió o acercó el mapa; entonces no se recentra solo. */
  explorado: boolean;
}
