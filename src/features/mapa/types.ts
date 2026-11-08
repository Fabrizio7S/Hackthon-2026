
export type CategoriaMapa = 'servicio' | 'producto';

export interface OfertaMapa {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaMapa;

  // Coordenadas de la oferta registrada.
  latitud: number;
  longitud: number;

  // Datos opcionales proporcionados por el módulo de servicios.
  calificacionPromedio?: number | null;
  cantidadCalificaciones?: number;
  precio?: number | null;
  moneda?: string;
  imagenUrl?: string | null;
}
