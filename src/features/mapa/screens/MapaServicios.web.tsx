
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Pressable,
  Text,
  View,
} from 'react-native';

import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import ControlesMapa from '../components/ControlesMapa';
import TarjetaServicio from '../components/TarjetaServicio';

import { REGION_INICIAL } from '../constants/mapa.constants';
import { generarOfertasPrueba } from '../data/ofertasDemo';
import { useFiltrosMapa } from '../hooks/useFiltrosMapa';
import { useUbicacion } from '../hooks/useUbicacion';
import { calcularDistanciaKm } from '../utils/calcularDistancia';
import { styles } from '../styles/MapaServicios.styles';
import { AppIcon } from '../../../shared/AppIcon';

import { NOMBRE_CATEGORIA, type OfertaMapa, type SesionMapa } from '../types';

interface MapaServiciosProps {
  ofertas?: OfertaMapa[];
  onVerDetalles?: (id: string) => void;
  /** Conserva filtros, selección y cámara al volver de un detalle. */
  sesion?: SesionMapa;
}

// Iconos de Leaflet personalizados.
// Así evitamos los problemas con sus imágenes predeterminadas.
function crearIcono(categoria: OfertaMapa['categoria']) {
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

const iconoServicio = crearIcono('servicio');
const iconoProducto = crearIcono('producto');
const iconoEmergencia = crearIcono('emergencia');
const iconoRecurso = crearIcono('recurso');

const iconoUsuario = L.divIcon({
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

// Componente que permite centrar Leaflet mediante un botón.
function ControlCentrado({
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
      map.flyTo(
        [ubicacion.latitude, ubicacion.longitude],
        15,
        { duration: 0.6 }
      );
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
          primera.longitud
        ) <= 5;
      const destino = cercaDelUsuario
        ? [ubicacion.latitude, ubicacion.longitude] as [number, number]
        : [primera.latitud, primera.longitud] as [number, number];
      map.flyTo(destino, 15, { duration: 0.6 });
      return;
    }

    if (!ubicacion) return;

    map.flyTo(
      [ubicacion.latitude, ubicacion.longitude],
      15,
      { duration: 0.6 }
    );
  }, [map, ubicacion, ofertas, solicitud, sesion]);

  return null;
}

// Guarda la cámara y marca cuándo la persona explora el mapa.
function RegistroVista({ sesion }: { sesion?: SesionMapa }) {
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
    eventos.forEach((nombre) =>
      contenedor.addEventListener(nombre, marcar, { passive: true })
    );
    return () => {
      eventos.forEach((nombre) =>
        contenedor.removeEventListener(nombre, marcar)
      );
    };
  }, [map, sesion]);

  return null;
}

export default function MapaServicios({
  ofertas,
  onVerDetalles,
  sesion,
}: MapaServiciosProps) {
  const [ofertaSeleccionadaId, setSeleccion] =
    useState<string | null>(sesion?.seleccionId ?? null);

  const setOfertaSeleccionadaId = (id: string | null) => {
    if (sesion) sesion.seleccionId = id;
    setSeleccion(id);
  };

  const [solicitudCentrado, setSolicitudCentrado] = useState(0);

  const {
    estado,
    ubicacion,
    mensaje,
    reintentarUbicacion,
    mostrarMensaje,
  } = useUbicacion();

  const ofertasVisibles = useMemo(() => {
    if (ofertas !== undefined) return ofertas;

    return generarOfertasPrueba(
      ubicacion?.latitude ?? REGION_INICIAL.latitude,
      ubicacion?.longitude ?? REGION_INICIAL.longitude
    );
  }, [ofertas, ubicacion]);

  const {
    busqueda,
    setBusqueda,
    filtro,
    setFiltro,
    ofertasFiltradas,
  } = useFiltrosMapa(ofertasVisibles, sesion);

  const ofertaSeleccionada =
    ofertasFiltradas.find(
      (oferta) => oferta.id === ofertaSeleccionadaId
    ) ?? null;

  const distanciaSeleccionada =
    ofertaSeleccionada && ubicacion
      ? calcularDistanciaKm(
          ubicacion.latitude,
          ubicacion.longitude,
          ofertaSeleccionada.latitud,
          ofertaSeleccionada.longitud
        )
      : null;

  const centrarEnMiUbicacion = () => {
    if (!ubicacion) {
      mostrarMensaje(
        'Tu ubicación no está disponible. Puedes reintentar obtenerla.'
      );
      return;
    }

    setSolicitudCentrado((actual) => actual + 1);
  };

  return (
    <View style={styles.container}>
      <View
        style={{ flex: 1, minHeight: 400 }}
        aria-label="Mapa interactivo"
        accessibilityLabel="Mapa de servicios, productos, emergencias y recursos cercanos"
      >
        <MapContainer
          center={[
            sesion?.vista?.latitude ?? REGION_INICIAL.latitude,
            sesion?.vista?.longitude ?? REGION_INICIAL.longitude,
          ]}
          zoom={sesion?.vista?.zoom ?? 14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ControlCentrado
            ubicacion={ubicacion}
            ofertas={ofertas}
            solicitud={solicitudCentrado}
            sesion={sesion}
          />

          <RegistroVista sesion={sesion} />

          {ubicacion && (
            <Marker
              position={[
                ubicacion.latitude,
                ubicacion.longitude,
              ]}
              icon={iconoUsuario}
              title="Tu ubicación actual"
              alt="Tu ubicación actual"
            >
              <Tooltip>Tu ubicación actual</Tooltip>
            </Marker>
          )}

          {ofertasFiltradas.map((oferta) => (
            <Marker
              key={oferta.id}
              position={[
                oferta.latitud,
                oferta.longitud,
              ]}
              icon={
                oferta.categoria === 'servicio'
                  ? iconoServicio
                  : oferta.categoria === 'producto'
                    ? iconoProducto
                    : oferta.categoria === 'emergencia'
                      ? iconoEmergencia
                      : iconoRecurso
              }
              title={`${NOMBRE_CATEGORIA[oferta.categoria]}: ${oferta.nombre}`}
              alt={`${NOMBRE_CATEGORIA[oferta.categoria]}: ${oferta.nombre}`}
              eventHandlers={{
                click: () => setOfertaSeleccionadaId(oferta.id),
                add: (evento) =>
                  (evento.target as L.Marker)
                    .getElement()
                    ?.setAttribute(
                      'aria-label',
                      `${NOMBRE_CATEGORIA[oferta.categoria]}: ${oferta.nombre}`
                    ),
              }}
            >
              <Tooltip>{oferta.nombre}</Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </View>

      <Pressable
        style={styles.botonUbicacion}
        onPress={centrarEnMiUbicacion}
        accessibilityRole="button"
        accessibilityLabel="Centrar mapa en mi ubicación"
      >
        <AppIcon name="locate" size={24} color="#2D5B68" />
      </Pressable>

      <ControlesMapa
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        filtro={filtro}
        onCambiarFiltro={setFiltro}
      />

      {(estado === 'buscando' || mensaje !== '') && (
        <View style={styles.aviso}>
          {estado === 'buscando' && (
            <View style={styles.filaAviso}>
              <ActivityIndicator size="small" />
              <Text style={styles.textoAviso}>
                Buscando tu ubicación...
              </Text>
            </View>
          )}

          {mensaje !== '' && (
            <>
              <Text style={styles.textoAviso}>{mensaje}</Text>
              <Button
                title="Reintentar ubicación"
                onPress={reintentarUbicacion}
              />
            </>
          )}
        </View>
      )}

      {ofertaSeleccionada && (
        <TarjetaServicio
          oferta={ofertaSeleccionada}
          distanciaKm={distanciaSeleccionada}
          onVerDetalles={onVerDetalles}
          onCerrar={() => setOfertaSeleccionadaId(null)}
        />
      )}

      {ofertas === undefined && (
        <View
          style={styles.etiquetaDemo}
          pointerEvents="none"
        >
          <Text style={styles.textoDemo}>
            Datos de demostración
          </Text>
        </View>
      )}
    </View>
  );
}

