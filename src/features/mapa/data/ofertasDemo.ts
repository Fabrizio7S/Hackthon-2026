import type { OfertaMapa } from '../types';

/**
 * Datos temporales de demostración.
 *
 * No provienen de Supabase.
 * Este archivo se eliminará cuando
 * integremos las ofertas reales.
 */
export function generarOfertasPrueba(latitud: number, longitud: number): OfertaMapa[] {
  return [
    {
      id: 'demo-1',
      nombre: 'Reparación de bicicletas',
      descripcion: 'Mantenimiento y reparación de bicicletas a domicilio.',
      categoria: 'servicio',
      latitud: latitud + 0.0015,
      longitud: longitud + 0.001,
      precio: 25,
      moneda: 'S/',
    },
    {
      id: 'demo-2',
      nombre: 'Préstamo de herramientas',
      descripcion: 'Herramientas disponibles para vecinos de la comunidad.',
      categoria: 'producto',
      latitud: latitud - 0.001,
      longitud: longitud + 0.0015,
    },
    {
      id: 'demo-3',
      nombre: 'Clases particulares',
      descripcion: 'Clases de matemáticas para estudiantes.',
      categoria: 'servicio',
      latitud: latitud + 0.0005,
      longitud: longitud - 0.0015,
      precio: 30,
      moneda: 'S/',
    },
  ];
}
