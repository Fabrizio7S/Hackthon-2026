
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { OfertaMapa } from './types';

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

const styles = StyleSheet.create({
  tarjeta: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoria: {
    fontSize: 11,
    fontWeight: '700',
    color: '#18734F',
  },
  cerrar: {
    padding: 5,
  },
  cerrarTexto: {
    fontSize: 18,
    color: '#6B7280',
  },
  nombre: {
    fontSize: 19,
    fontWeight: '700',
    color: '#172B23',
    marginTop: 4,
  },
  distancia: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
  },
  calificacion: {
    fontSize: 13,
    color: '#374151',
    marginTop: 7,
  },
  descripcion: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 8,
    lineHeight: 19,
  },
  precio: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18734F',
    marginTop: 8,
  },
  boton: {
    backgroundColor: '#18734F',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  botonDeshabilitado: {
    backgroundColor: '#9CA3AF',
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
