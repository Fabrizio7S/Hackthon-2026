

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Button,
  Pressable,
  Text,
  View,
} from 'react-native';

import MapView from 'react-native-maps';

import ControlesMapa from '../components/ControlesMapa';
import MarcadorServicio from '../components/MarcadorServicio';
import TarjetaServicio from '../components/TarjetaServicio';

import { REGION_INICIAL } from '../constants/mapa.constants';
import { generarOfertasPrueba } from '../data/ofertasDemo';
import { useFiltrosMapa } from '../hooks/useFiltrosMapa';
import { useUbicacion } from '../hooks/useUbicacion';
import { calcularDistanciaKm } from '../utils/calcularDistancia';
import { styles } from '../styles/MapaServicios.styles';

import type { OfertaMapa } from '../types';

interface MapaServiciosProps {
  ofertas?: OfertaMapa[];
  onVerDetalles?: (id: string) => void;
}

export default function MapaServicios({
  ofertas,
  onVerDetalles,
}: MapaServiciosProps) {
  // Referencia al mapa para controlar su posición.
  const mapaRef = useRef<MapView>(null);

  // Estado del marcador seleccionado.
  const [ofertaSeleccionadaId, setOfertaSeleccionadaId] =
    useState<string | null>(null);

  // Obtener la ubicación mediante el hook.
  const {
    estado,
    ubicacion,
    mensaje,
    reintentarUbicacion,
    mostrarMensaje,
  } = useUbicacion();

  // Centrar el mapa automáticamente al obtener el GPS.
  useEffect(() => {
    if (!ubicacion) return;

    mapaRef.current?.animateToRegion(
      {
        latitude: ubicacion.latitude,
        longitude: ubicacion.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      600
    );
  }, [ubicacion]);

  // Centrar el mapa manualmente.
  const centrarEnMiUbicacion = () => {
    if (!ubicacion) {
      mostrarMensaje(
        'Tu ubicación no está disponible. Puedes reintentar obtenerla.'
      );
      return;
    }

    mapaRef.current?.animateToRegion(
      {
        latitude: ubicacion.latitude,
        longitude: ubicacion.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      600
    );
  };

  // Obtener ofertas externas o datos temporales.
  const ofertasVisibles = useMemo(() => {
    if (ofertas !== undefined) {
      return ofertas;
    }

    return generarOfertasPrueba(
      ubicacion?.latitude ?? REGION_INICIAL.latitude,
      ubicacion?.longitude ?? REGION_INICIAL.longitude
    );
  }, [ofertas, ubicacion]);

  // Gestionar búsqueda y filtros.
  const {
    busqueda,
    setBusqueda,
    filtro,
    setFiltro,
    ofertasFiltradas,
  } = useFiltrosMapa(ofertasVisibles);

  // Identificar la oferta seleccionada.
  const ofertaSeleccionada =
    ofertasFiltradas.find(
      (oferta) => oferta.id === ofertaSeleccionadaId
    ) ?? null;

  // Calcular distancia entre el usuario y la oferta.
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

      {/* Botón para centrar la ubicación */}
      <Pressable
        style={styles.botonUbicacion}
        onPress={centrarEnMiUbicacion}
        accessibilityRole="button"
        accessibilityLabel="Centrar mapa en mi ubicación"
      >
        <Text style={styles.iconoUbicacion}>⌖</Text>
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
                onPress={reintentarUbicacion}
              />
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
          onCerrar={() =>
            setOfertaSeleccionadaId(null)
          }
        />
      )}

      {/* Aviso temporal de demostración */}
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
