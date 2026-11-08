
import { useMemo, useState } from 'react';

import type { OfertaMapa } from '../types';
import type { FiltroMapa } from '../components/ControlesMapa';

/**
 * Gestiona la búsqueda y los filtros
 * de las ofertas mostradas en el mapa.
 *
 * Funciona con ofertas reales o de demostración.
 */
export function useFiltrosMapa(ofertas: OfertaMapa[]) {
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroMapa>('todos');

  const ofertasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase();

    return ofertas.filter((oferta) => {
      const coincideCategoria =
        filtro === 'todos' ||
        oferta.categoria === filtro;

      const coincideBusqueda =
        texto === '' ||
        oferta.nombre.toLocaleLowerCase().includes(texto) ||
        oferta.descripcion.toLocaleLowerCase().includes(texto);

      return coincideCategoria && coincideBusqueda;
    });
  }, [ofertas, busqueda, filtro]);

  return {
    busqueda,
    setBusqueda,
    filtro,
    setFiltro,
    ofertasFiltradas,
  };
}
