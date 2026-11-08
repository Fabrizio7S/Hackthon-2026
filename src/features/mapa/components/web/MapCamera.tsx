import React from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { calcularDistanciaKm } from '../../utils/calcularDistancia';
import { type OfertaMapa, type SesionMapa } from '../../types';

export function ControlCentrado({
  ubicacion,
  ofertas,
  solicitud,
  sesion,
}: {
  ubicacion: { latitude: number; longitude: number } | null;
  ofertas?: OfertaMapa[];
  solicitud: number;
  sesion?: SesionMapa;
}) {
  const map = useMap();

  React.useEffect(() => {
    if (solicitud > 0 && ubicacion) {
      map.flyTo([ubicacion.latitude, ubicacion.longitude], 15, { duration: 0.6 });
      return;
    }

    // Si la persona ya exploró el mapa, no se vuelve a centrar por sí solo.
    if (sesion?.explorado) return;

    if (ofertas && ofertas.length > 0) {
      const primera = ofertas[0];
      const cercaDelUsuario =
        ubicacion &&
        calcularDistanciaKm(
          ubicacion.latitude,
          ubicacion.longitude,
          primera.latitud,
          primera.longitud,
        ) <= 5;
      const destino = cercaDelUsuario
        ? ([ubicacion.latitude, ubicacion.longitude] as [number, number])
        : ([primera.latitud, primera.longitud] as [number, number]);
      map.flyTo(destino, 15, { duration: 0.6 });
      return;
    }

    if (!ubicacion) return;

    map.flyTo([ubicacion.latitude, ubicacion.longitude], 15, { duration: 0.6 });
  }, [map, ubicacion, ofertas, solicitud, sesion]);

  return null;
}

export function RegistroVista({ sesion }: { sesion?: SesionMapa }) {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      if (!sesion) return;
      const centro = map.getCenter();
      sesion.vista = {
        latitude: centro.lat,
        longitude: centro.lng,
        zoom: map.getZoom(),
      };
    },
  });

  React.useEffect(() => {
    if (!sesion) return;
    const contenedor = map.getContainer();
    const marcar = () => {
      sesion.explorado = true;
    };
    const eventos = ['mousedown', 'touchstart', 'wheel', 'keydown'] as const;
    eventos.forEach((nombre) => contenedor.addEventListener(nombre, marcar, { passive: true }));
    return () => {
      eventos.forEach((nombre) => contenedor.removeEventListener(nombre, marcar));
    };
  }, [map, sesion]);

  return null;
}
