
import React from 'react';
import {
  Pressable,
  Text,
  View,
} from 'react-native';

import type { OfertaMapa } from '../types';
import { AppIcon } from '../../../shared/AppIcon';
import { colors } from '../../../shared/theme';
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
  const esServicio = oferta.categoria === 'servicio';
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
      <View
        style={[
          styles.arco,
          { backgroundColor: esServicio ? colors.primarySurface : colors.claySurface },
        ]}
      >
        <AppIcon
          name={esServicio ? 'services' : 'bag'}
          size={26}
          color={esServicio ? colors.primary : colors.clay}
        />
      </View>
      <View style={styles.cuerpo}>
      <View style={styles.encabezado}>
        <Text style={[styles.categoria, !esServicio && { color: colors.clay }]}>
          {esServicio ? 'SERVICIO' : 'PRODUCTO'} · {distancia.toUpperCase()}
        </Text>

        <Pressable
          onPress={onCerrar}
          accessibilityRole="button"
          accessibilityLabel="Cerrar tarjeta"
          style={styles.cerrar}
        >
          <AppIcon name="close" size={16} color={colors.textMuted} weight={2} />
        </Pressable>
      </View>

      <Text style={styles.nombre}>
        {oferta.nombre}
      </Text>

      <Text style={styles.calificacion}>
        {tieneCalificacion ? '★ ' : ''}
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
        {onVerDetalles && <AppIcon name="chevron" size={15} color={colors.onPrimary} weight={2.2} />}
      </Pressable>
      </View>
    </View>
  );
}
