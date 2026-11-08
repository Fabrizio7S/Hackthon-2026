import { useMemo, useState } from 'react';
import { ActivityIndicator, Button, Pressable, Text, View } from 'react-native';
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ControlesMapa from '../components/ControlesMapa';
import TarjetaServicio from '../components/TarjetaServicio';
import { REGION_INICIAL } from '../constants/mapa.constants';
import { generarOfertasPrueba } from '../data/ofertasDemo';
import { useFiltrosMapa } from '../hooks/useFiltrosMapa';
import { useUbicacion } from '../../../shared/location/useUbicacion';
import { calcularDistanciaKm } from '../utils/calcularDistancia';
import { styles } from '../styles/MapaServicios.styles';
import { AppIcon } from '../../../shared/ui/AppIcon';
import { NOMBRE_CATEGORIA } from '../constants/categoryLabels';
import { type OfertaMapa, type SesionMapa } from '../types';
import {
  iconoServicio,
  iconoProducto,
  iconoEmergencia,
  iconoRecurso,
  iconoUsuario,
} from '../components/web/leafletIcons';
import { ControlCentrado, RegistroVista } from '../components/web/MapCamera';

interface MapaServiciosProps {
  ofertas?: OfertaMapa[];
  onVerDetalles?: (id: string) => void;
  /** Conserva filtros, selección y cámara al volver de un detalle. */
  sesion?: SesionMapa;
}

export default function MapaServicios({ ofertas, onVerDetalles, sesion }: MapaServiciosProps) {
  const [ofertaSeleccionadaId, setSeleccion] = useState<string | null>(sesion?.seleccionId ?? null);

  const setOfertaSeleccionadaId = (id: string | null) => {
    if (sesion) sesion.seleccionId = id;
    setSeleccion(id);
  };

  const [solicitudCentrado, setSolicitudCentrado] = useState(0);

  const { estado, ubicacion, mensaje, reintentarUbicacion, mostrarMensaje } = useUbicacion();

  const ofertasVisibles = useMemo(() => {
    if (ofertas !== undefined) return ofertas;

    return generarOfertasPrueba(
      ubicacion?.latitude ?? REGION_INICIAL.latitude,
      ubicacion?.longitude ?? REGION_INICIAL.longitude,
    );
  }, [ofertas, ubicacion]);

  const { busqueda, setBusqueda, filtro, setFiltro, ofertasFiltradas } = useFiltrosMapa(
    ofertasVisibles,
    sesion,
  );

  const ofertaSeleccionada =
    ofertasFiltradas.find((oferta) => oferta.id === ofertaSeleccionadaId) ?? null;

  const distanciaSeleccionada =
    ofertaSeleccionada && ubicacion
      ? calcularDistanciaKm(
          ubicacion.latitude,
          ubicacion.longitude,
          ofertaSeleccionada.latitud,
          ofertaSeleccionada.longitud,
        )
      : null;

  const centrarEnMiUbicacion = () => {
    if (!ubicacion) {
      mostrarMensaje('Tu ubicación no está disponible. Puedes reintentar obtenerla.');
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
              position={[ubicacion.latitude, ubicacion.longitude]}
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
              position={[oferta.latitud, oferta.longitud]}
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
                      `${NOMBRE_CATEGORIA[oferta.categoria]}: ${oferta.nombre}`,
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
              <Text style={styles.textoAviso}>Buscando tu ubicación...</Text>
            </View>
          )}

          {mensaje !== '' && (
            <>
              <Text style={styles.textoAviso}>{mensaje}</Text>
              <Button title="Reintentar ubicación" onPress={reintentarUbicacion} />
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
        <View style={styles.etiquetaDemo} pointerEvents="none">
          <Text style={styles.textoDemo}>Datos de demostración</Text>
        </View>
      )}
    </View>
  );
}
