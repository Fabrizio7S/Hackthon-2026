import React, { useEffect, useMemo, useRef, useState } from 'react';

import { ActivityIndicator, Button, Pressable, Text, View } from 'react-native';

import MapView, { type Region } from 'react-native-maps';

import ControlesMapa from '../components/ControlesMapa';
import MarcadorServicio from '../components/MarcadorServicio';
import TarjetaServicio from '../components/TarjetaServicio';

import { REGION_INICIAL } from '../constants/mapa.constants';
import { generarOfertasPrueba } from '../data/ofertasDemo';
import { useFiltrosMapa } from '../hooks/useFiltrosMapa';
import { useUbicacion } from '../../../shared/location/useUbicacion';
import { calcularDistanciaKm } from '../utils/calcularDistancia';
import { styles } from '../styles/MapaServicios.styles';
import { AppIcon } from '../../../shared/ui/AppIcon';

import type { OfertaMapa, SesionMapa } from '../types';

interface MapaServiciosProps {
  ofertas?: OfertaMapa[];
  onVerDetalles?: (id: string) => void;
  /** Conserva filtros, selección y cámara al volver de un detalle. */
  sesion?: SesionMapa;
}

export default function MapaServicios({ ofertas, onVerDetalles, sesion }: MapaServiciosProps) {
  // Referencia al mapa para controlar su posición.
  const mapaRef = useRef<MapView>(null);

  // Estado del marcador seleccionado.
  const [ofertaSeleccionadaId, setSeleccion] = useState<string | null>(sesion?.seleccionId ?? null);

  const setOfertaSeleccionadaId = (id: string | null) => {
    if (sesion) sesion.seleccionId = id;
    setSeleccion(id);
  };

  // Obtener la ubicación mediante el hook.
  const { estado, ubicacion, mensaje, reintentarUbicacion, mostrarMensaje } = useUbicacion();

  // Centrar el mapa automáticamente al obtener el GPS (o en las ofertas de la comunidad si están lejos).
  useEffect(() => {
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
        ? { latitude: ubicacion.latitude, longitude: ubicacion.longitude }
        : { latitude: primera.latitud, longitude: primera.longitud };
      mapaRef.current?.animateToRegion(
        {
          ...destino,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        600,
      );
      return;
    }

    if (!ubicacion) return;

    mapaRef.current?.animateToRegion(
      {
        latitude: ubicacion.latitude,
        longitude: ubicacion.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      600,
    );
  }, [ubicacion, ofertas, sesion]);

  // Centrar el mapa manualmente.
  const centrarEnMiUbicacion = () => {
    if (!ubicacion) {
      mostrarMensaje('Tu ubicación no está disponible. Puedes reintentar obtenerla.');
      return;
    }

    mapaRef.current?.animateToRegion(
      {
        latitude: ubicacion.latitude,
        longitude: ubicacion.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      600,
    );
  };

  // Obtener ofertas externas o datos temporales.
  const ofertasVisibles = useMemo(() => {
    if (ofertas !== undefined) {
      return ofertas;
    }

    return generarOfertasPrueba(
      ubicacion?.latitude ?? REGION_INICIAL.latitude,
      ubicacion?.longitude ?? REGION_INICIAL.longitude,
    );
  }, [ofertas, ubicacion]);

  // Gestionar búsqueda y filtros.
  const { busqueda, setBusqueda, filtro, setFiltro, ofertasFiltradas } = useFiltrosMapa(
    ofertasVisibles,
    sesion,
  );

  // Identificar la oferta seleccionada.
  const ofertaSeleccionada =
    ofertasFiltradas.find((oferta) => oferta.id === ofertaSeleccionadaId) ?? null;

  // Calcular distancia entre el usuario y la oferta.
  const distanciaSeleccionada =
    ofertaSeleccionada && ubicacion
      ? calcularDistanciaKm(
          ubicacion.latitude,
          ubicacion.longitude,
          ofertaSeleccionada.latitud,
          ofertaSeleccionada.longitud,
        )
      : null;

  return (
    <View style={styles.container}>
      {/* Mapa interactivo */}
      <MapView
        ref={mapaRef}
        style={styles.map}
        initialRegion={
          sesion?.vista
            ? {
                latitude: sesion.vista.latitude,
                longitude: sesion.vista.longitude,
                latitudeDelta: sesion.vista.latitudeDelta ?? REGION_INICIAL.latitudeDelta,
                longitudeDelta: sesion.vista.longitudeDelta ?? REGION_INICIAL.longitudeDelta,
              }
            : REGION_INICIAL
        }
        showsUserLocation={ubicacion !== null}
        accessibilityLabel="Mapa de servicios, productos, emergencias y recursos cercanos"
        onRegionChangeComplete={(region: Region, detalles?: { isGesture?: boolean }) => {
          if (!sesion) return;
          sesion.vista = {
            latitude: region.latitude,
            longitude: region.longitude,
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
          };
          if (detalles?.isGesture) sesion.explorado = true;
        }}
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

      {/* Botón para centrar la ubicación */}
      <Pressable
        style={styles.botonUbicacion}
        onPress={centrarEnMiUbicacion}
        accessibilityRole="button"
        accessibilityLabel="Centrar mapa en mi ubicación"
      >
        <AppIcon name="locate" size={24} color="#2D5B68" />
      </Pressable>

      {/* Barra de búsqueda y filtros */}
      <ControlesMapa
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        filtro={filtro}
        onCambiarFiltro={setFiltro}
      />

      {/* Mensajes relacionados con el GPS */}
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

      {/* Tarjeta de la oferta seleccionada */}
      {ofertaSeleccionada && (
        <TarjetaServicio
          oferta={ofertaSeleccionada}
          distanciaKm={distanciaSeleccionada}
          onVerDetalles={onVerDetalles}
          onCerrar={() => setOfertaSeleccionadaId(null)}
        />
      )}

      {/* Aviso temporal de demostración */}
      {ofertas === undefined && (
        <View style={styles.etiquetaDemo} pointerEvents="none">
          <Text style={styles.textoDemo}>Datos de demostración</Text>
        </View>
      )}
    </View>
  );
}
