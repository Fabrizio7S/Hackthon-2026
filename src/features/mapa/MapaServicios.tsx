
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';

// Región de referencia para pruebas, no ubicación del usuario.
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

export default function MapaServicios() {
  const mapaRef = useRef<MapView>(null);

  const [estado, setEstado] =
    useState<EstadoUbicacion>('inicial');

  const [ubicacion, setUbicacion] =
    useState<Location.LocationObjectCoords | null>(null);

  const [mensaje, setMensaje] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;
    let tiempoEspera: ReturnType<typeof setTimeout> | undefined;

    async function obtenerUbicacion() {
      setEstado('buscando');
      setMensaje('');
      setUbicacion(null);

      // Evita que una solicitud lenta bloquee la interfaz.
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
        if (tiempoEspera) clearTimeout(tiempoEspera);
      }
    }

    obtenerUbicacion();

    return () => {
      activo = false;
      if (tiempoEspera) clearTimeout(tiempoEspera);
    };
  }, [intento]);

  return (
    <View style={styles.container}>
      {estado === 'buscando' && (
        <View style={styles.aviso}>
          <ActivityIndicator size="small" />
          <Text style={styles.textoAviso}>
            Buscando tu ubicación...
          </Text>
        </View>
      )}

      {mensaje !== '' && (
        <View style={styles.aviso}>
          <Text style={styles.textoAviso}>
            {mensaje}
          </Text>

          <Button
            title="Reintentar ubicación"
            onPress={() => setIntento((valor) => valor + 1)}
          />
        </View>
      )}

      <MapView
        ref={mapaRef}
        style={styles.map}
        initialRegion={REGION_INICIAL}
        showsUserLocation={ubicacion !== null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  aviso: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  textoAviso: {
    marginVertical: 8,
    textAlign: 'center',
    color: '#333',
  },
});
