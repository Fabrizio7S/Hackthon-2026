import L from 'leaflet';
import { type OfertaMapa } from '../../types';

export function crearIcono(categoria: OfertaMapa['categoria']) {
  const color =
    categoria === 'servicio'
      ? '#216349'
      : categoria === 'producto'
        ? '#9A4524'
        : categoria === 'emergencia'
          ? '#B8332A'
          : '#2D5B68';
  // Icono lineal propio (misma rejilla de 24 que AppIcon), sin emojis.
  const trazo =
    categoria === 'servicio'
      ? '<path d="M3.5 9h17v10.5h-17zM9 9V6h6v3M3.5 13.5h17"/>'
      : categoria === 'producto'
        ? '<path d="M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0"/>'
        : categoria === 'emergencia'
          ? '<path d="M12 4L3 20h18L12 4zM12 10v4M12 17h.01"/>'
          : '<path d="M12 3v18M3 12h18"/>';

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 34px;
        height: 34px;
        box-sizing: border-box;
        background: ${color};
        border: 3px solid #FFFDF7;
        border-radius: 17px 17px 17px 4px;
        box-shadow: 0 3px 8px rgba(18,63,51,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFDF7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${trazo}</svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

export const iconoServicio = crearIcono('servicio');

export const iconoProducto = crearIcono('producto');

export const iconoEmergencia = crearIcono('emergencia');

export const iconoRecurso = crearIcono('recurso');

export const iconoUsuario = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 16px;
      height: 16px;
      background: #2D5B68;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 5px rgba(45,91,104,0.22);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});
