
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type EstadoUbicacion =
  | 'inicial'
  | 'buscando'
  | 'disponible'
  | 'denegado'
  | 'error';

export function useUbicacion() {
  const [estado, setEstado] =
    useState<EstadoUbicacion>('inicial');

  const [ubicacion, setUbicacion] =
    useState<Location.LocationObjectCoords | null>(null);

  const [mensaje, setMensaje] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;
    let tiempoEspera:
      | ReturnType<typeof setTimeout>
      | undefined;

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

  const reintentarUbicacion = () => {
    setIntento((valor) => valor + 1);
  };

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
  };

  return {
    estado,
    ubicacion,
    mensaje,
    reintentarUbicacion,
    mostrarMensaje,
  };
}
