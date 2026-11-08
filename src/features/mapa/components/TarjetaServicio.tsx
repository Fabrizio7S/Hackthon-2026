
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
  const esEmergencia = oferta.categoria === 'emergencia';
  const esRecurso = oferta.categoria === 'recurso';
  const tieneCalificacion =
    oferta.calificacionPromedio != null;

  const calificacion = tieneCalificacion
    ? oferta.calificacionPromedio!.toFixed(1)
    : 'Sin valoraciones';

  const distancia =
    distanciaKm !== null
      ? `${distanciaKm.toFixed(1)} km`
      : 'Distancia no disponible';

  const colorFondo = esEmergencia
    ? colors.dangerSurface
    : esRecurso
      ? colors.riverSurface
      : esServicio
        ? colors.primarySurface
        : colors.claySurface;

  const colorTinta = esEmergencia
    ? colors.danger
    : esRecurso
      ? colors.river
      : esServicio
        ? colors.primary
        : colors.clay;

  const icono = esEmergencia
    ? 'siren'
    : esRecurso
      ? 'support'
      : esServicio
        ? 'services'
        : 'bag';

  const etiquetaCategoria = esEmergencia
    ? 'EMERGENCIA'
    : esRecurso
      ? 'RECURSO DE APOYO'
      : esServicio
        ? 'SERVICIO'
        : 'PRODUCTO';

  return (
    <View style={styles.tarjeta}>
      <View
        style={[
          styles.arco,
          { backgroundColor: colorFondo },
        ]}
      >
        <AppIcon
          name={icono}
          size={26}
          color={colorTinta}
        />
      </View>
      <View style={styles.cuerpo}>
      <View style={styles.encabezado}>
        <Text style={[styles.categoria, { color: colorTinta }]}>
          {etiquetaCategoria} · {distancia.toUpperCase()}
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

      {oferta.autorNombre ? (
        <Text style={styles.calificacion}>
          Publicado por {oferta.autorNombre}
        </Text>
      ) : null}

      {esEmergencia || esRecurso ? (
        oferta.etiquetaEstado ? (
          <Text style={[styles.calificacion, { color: colorTinta, fontWeight: '700' }]}>
            {oferta.etiquetaEstado}
          </Text>
        ) : null
      ) : (
        <Text style={styles.calificacion}>
          {tieneCalificacion ? '★ ' : ''}
          {calificacion}
          {tieneCalificacion &&
          oferta.cantidadCalificaciones !== undefined
            ? ` (${oferta.cantidadCalificaciones})`
            : ''}
        </Text>
      )}

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
