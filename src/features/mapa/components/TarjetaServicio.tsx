
import React from 'react';
import {
  Pressable,
  Text,
  View,
} from 'react-native';

import type { OfertaMapa } from '../types';
import { styles } from '../styles/TarjetaServicio.styles';

interface TarjetaServicioProps {
  oferta: OfertaMapa;
  distanciaKm: number | null;
  onVerDetalles?: (id: string) => void;
  onCerrar: () => void;
}

export default function TarjetaServicio({
  oferta,
  distanciaKm,
  onVerDetalles,
  onCerrar,
}: TarjetaServicioProps) {
  const tieneCalificacion =
    oferta.calificacionPromedio != null;

  const calificacion = tieneCalificacion
    ? oferta.calificacionPromedio!.toFixed(1)
    : 'Sin valoraciones';

  const distancia =
    distanciaKm !== null
      ? `${distanciaKm.toFixed(1)} km`
      : 'Distancia no disponible';

  return (
    <View style={styles.tarjeta}>
      <View style={styles.encabezado}>
        <Text style={styles.categoria}>
          {oferta.categoria === 'servicio'
            ? 'SERVICIO'
            : 'PRODUCTO'}
        </Text>

        <Pressable
          onPress={onCerrar}
          accessibilityRole="button"
          accessibilityLabel="Cerrar tarjeta"
          style={styles.cerrar}
        >
          <Text style={styles.cerrarTexto}>✕</Text>
        </Pressable>
      </View>

      <Text style={styles.nombre}>
        {oferta.nombre}
      </Text>

      <Text style={styles.distancia}>
        📍 {distancia}
      </Text>

      <Text style={styles.calificacion}>
        {tieneCalificacion ? '⭐ ' : ''}
        {calificacion}
        {tieneCalificacion &&
        oferta.cantidadCalificaciones !== undefined
          ? ` (${oferta.cantidadCalificaciones})`
          : ''}
      </Text>

      <Text
        style={styles.descripcion}
        numberOfLines={2}
      >
        {oferta.descripcion}
      </Text>

      {oferta.precio != null && (
        <Text style={styles.precio}>
          {oferta.moneda ?? 'S/'} {oferta.precio.toFixed(2)}
        </Text>
      )}

      <Pressable
        style={[
          styles.boton,
          !onVerDetalles && styles.botonDeshabilitado,
        ]}
        onPress={() => onVerDetalles?.(oferta.id)}
        disabled={!onVerDetalles}
        accessibilityRole="button"
      >
        <Text style={styles.botonTexto}>
          {onVerDetalles
            ? 'Ver detalles'
            : 'Detalles disponibles próximamente'}
        </Text>
      </Pressable>
    </View>
  );
}
