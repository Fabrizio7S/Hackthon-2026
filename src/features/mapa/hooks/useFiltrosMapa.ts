import { useMemo, useState } from 'react';

import type { OfertaMapa, SesionMapa } from '../types';
import type { FiltroMapa } from '../components/ControlesMapa';

/**
 * Gestiona la búsqueda y los filtros
 * de las ofertas mostradas en el mapa.
 *
 * Funciona con ofertas reales o de demostración.
 */
export function useFiltrosMapa(ofertas: OfertaMapa[], sesion?: SesionMapa) {
  // Con `sesion`, la búsqueda y el filtro se recuperan al volver de un detalle.
  const [busqueda, setBusquedaLocal] = useState(sesion?.busqueda ?? '');
  const [filtro, setFiltroLocal] = useState<FiltroMapa>(sesion?.filtro ?? 'todos');

  const setBusqueda = (texto: string) => {
    if (sesion) sesion.busqueda = texto;
    setBusquedaLocal(texto);
  };
  const setFiltro = (nuevo: FiltroMapa) => {
    if (sesion) sesion.filtro = nuevo;
    setFiltroLocal(nuevo);
  };

  const ofertasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase();

    return ofertas.filter((oferta) => {
      const coincideCategoria = filtro === 'todos' || oferta.categoria === filtro;

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
