
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import MapView from 'react-native-maps';
import * as Location from 'expo-location';

import ControlesMapa, {
  type FiltroMapa,
} from './ControlesMapa';

import MarcadorServicio from './MarcadorServicio';
import TarjetaServicio from './TarjetaServicio';
import type { OfertaMapa } from './types';

// Región de referencia para pruebas.
const REGION_INICIAL = {
  latitude: -12.0464,
  longitude: -77.0428,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

type EstadoUbicacion =
  | 'inicial'
  | 'buscando'
  | 'disponible'
  | 'denegado'
  | 'error';

// Datos ficticios únicamente para probar la interfaz.
// No provienen de Supabase.
function generarOfertasPrueba(
  latitud: number,
  longitud: number
): OfertaMapa[] {
  return [
    {
      id: 'demo-1',
      nombre: 'Reparación de bicicletas',
      descripcion:
        'Mantenimiento y reparación de bicicletas a domicilio.',
      categoria: 'servicio',
      latitud: latitud + 0.0015,
      longitud: longitud + 0.001,
      precio: 25,
      moneda: 'S/',
    },
    {
      id: 'demo-2',
      nombre: 'Préstamo de herramientas',
      descripcion:
        'Herramientas disponibles para vecinos de la comunidad.',
      categoria: 'producto',
      latitud: latitud - 0.001,
      longitud: longitud + 0.0015,
    },
    {
      id: 'demo-3',
      nombre: 'Clases particulares',
      descripcion:
        'Clases de matemáticas para estudiantes.',
      categoria: 'servicio',
      latitud: latitud + 0.0005,
      longitud: longitud - 0.0015,
      precio: 30,
      moneda: 'S/',
    },
  ];
}

// Distancia aproximada en línea recta, no por calles.
function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const radioTierra = 6371;
  const radianes = Math.PI / 180;

  const diferenciaLatitud = (lat2 - lat1) * radianes;
  const diferenciaLongitud = (lon2 - lon1) * radianes;

  const a =
    Math.sin(diferenciaLatitud / 2) ** 2 +
    Math.cos(lat1 * radianes) *
      Math.cos(lat2 * radianes) *
      Math.sin(diferenciaLongitud / 2) ** 2;

  return (
    2 *
    radioTierra *
    Math.asin(Math.min(1, Math.sqrt(a)))
  );
}

interface MapaServiciosProps {
  ofertas?: OfertaMapa[];
  onVerDetalles?: (id: string) => void;
}

export default function MapaServicios({
  ofertas,
  onVerDetalles,
}: MapaServiciosProps) {
  const mapaRef = useRef<MapView>(null);

  // Estados de ubicación.
  const [estado, setEstado] =
    useState<EstadoUbicacion>('inicial');

  const [ubicacion, setUbicacion] =
    useState<Location.LocationObjectCoords | null>(null);

  const [mensaje, setMensaje] = useState('');
  const [intento, setIntento] = useState(0);

  // Estado del marcador seleccionado.
  const [ofertaSeleccionadaId, setOfertaSeleccionadaId] =
    useState<string | null>(null);

  // Estados de búsqueda y filtros.
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroMapa>('todos');

  // Obtener ubicación del usuario.
  useEffect(() => {
    let activo = true;
    let tiempoEspera: ReturnType<typeof setTimeout> | undefined;

    async function obtenerUbicacion() {
      setEstado('buscando');
      setMensaje('');
      setUbicacion(null);

      tiempoEspera = setTimeout(() => {
        if (!activo) return;

        setEstado('error');
        setMensaje(
          'La ubicación está tardando. Puedes explorar el mapa sin esperar.'
        );
      }, 10000);

      try {
        const permisoActual =
          await Location.getForegroundPermissionsAsync();

        const permiso = permisoActual.granted
          ? permisoActual
          : await Location.requestForegroundPermissionsAsync();

        if (!activo) return;

        if (!permiso.granted) {
          setEstado('denegado');
          setMensaje(
            'No compartiste tu ubicación. Puedes explorar el mapa igualmente.'
          );
          return;
        }

        const posicion =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

        if (!activo) return;

        setUbicacion(posicion.coords);
        setEstado('disponible');
        setMensaje('');

        mapaRef.current?.animateToRegion(
          {
            latitude: posicion.coords.latitude,
            longitude: posicion.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          600
        );
      } catch {
        if (!activo) return;

        setEstado('error');
        setMensaje(
          'No pudimos obtener tu ubicación. Puedes explorar el mapa.'
        );
      } finally {
        if (tiempoEspera) {
          clearTimeout(tiempoEspera);
        }
      }
    }

    obtenerUbicacion();

    return () => {
      activo = false;

      if (tiempoEspera) {
        clearTimeout(tiempoEspera);
      }
    };
  }, [intento]);

  // Recibir ofertas externas o generar datos de demostración.
  const ofertasVisibles = useMemo(() => {
    if (ofertas !== undefined) {
      return ofertas;
    }

    return generarOfertasPrueba(
      ubicacion?.latitude ?? REGION_INICIAL.latitude,
      ubicacion?.longitude ?? REGION_INICIAL.longitude
    );
  }, [ofertas, ubicacion]);

  // Aplicar búsqueda y filtros.
  const ofertasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase();

    return ofertasVisibles.filter((oferta) => {
      const coincideCategoria =
        filtro === 'todos' ||
        oferta.categoria === filtro;

      const coincideBusqueda =
        texto === '' ||
        oferta.nombre.toLocaleLowerCase().includes(texto) ||
        oferta.descripcion.toLocaleLowerCase().includes(texto);

      return coincideCategoria && coincideBusqueda;
    });
  }, [ofertasVisibles, busqueda, filtro]);

  // Obtener la oferta seleccionada.
  const ofertaSeleccionada =
    ofertasFiltradas.find(
      (oferta) => oferta.id === ofertaSeleccionadaId
    ) ?? null;

  // Calcular distancia cuando existe ubicación válida.
  const distanciaSeleccionada =
    ofertaSeleccionada && ubicacion
      ? calcularDistanciaKm(
          ubicacion.latitude,
          ubicacion.longitude,
          ofertaSeleccionada.latitud,
          ofertaSeleccionada.longitud
        )
      : null;

  return (
    <View style={styles.container}>
      {/* Mapa interactivo */}
      <MapView
        ref={mapaRef}
        style={styles.map}
        initialRegion={REGION_INICIAL}
        showsUserLocation={ubicacion !== null}
      >
        {ofertasFiltradas.map((oferta) => (
          <MarcadorServicio
            key={oferta.id}
            id={oferta.id}
            nombre={oferta.nombre}
            latitud={oferta.latitud}
            longitud={oferta.longitud}
            categoria={oferta.categoria}
            onSeleccionar={setOfertaSeleccionadaId}
          />
        ))}
      </MapView>

      {/* Barra de búsqueda y filtros flotantes */}
      <ControlesMapa
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        filtro={filtro}
        onCambiarFiltro={setFiltro}
      />

      {/* Mensajes de ubicación */}
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
              <Text style={styles.textoAviso}>
                {mensaje}
              </Text>

              <Button
                title="Reintentar ubicación"
                onPress={() =>
                  setIntento((valor) => valor + 1)
                }
              />
            </>
          )}
        </View>
      )}

      {/* Tarjeta inferior del servicio seleccionado */}
      {ofertaSeleccionada && (
        <TarjetaServicio
          oferta={ofertaSeleccionada}
          distanciaKm={distanciaSeleccionada}
          onVerDetalles={onVerDetalles}
          onCerrar={() =>
            setOfertaSeleccionadaId(null)
          }
        />
      )}

      {/* Indicador de datos ficticios */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  map: {
    flex: 1,
  },

  aviso: {
    position: 'absolute',
    top: 125,
    left: 14,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    elevation: 4,
  },

  filaAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoAviso: {
    marginVertical: 6,
    marginHorizontal: 8,
    textAlign: 'center',
    fontSize: 12,
    color: '#333333',
  },

  etiquetaDemo: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },

  textoDemo: {
    fontSize: 11,
    color: '#6B7280',
  },
});
