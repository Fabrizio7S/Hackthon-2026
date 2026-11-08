import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import type { CategoriaMapa } from '../types';
import { styles } from '../styles/ControlesMapa.styles';
import { colors } from '../styles/colors';
import { AppIcon } from '../../../shared/ui/AppIcon';
import { TourTarget } from '../../../shared/ui/tour/TourTargets';

export type FiltroMapa = 'todos' | CategoriaMapa;

interface ControlesMapaProps {
  busqueda: string;
  onCambiarBusqueda: (texto: string) => void;
  filtro: FiltroMapa;
  onCambiarFiltro: (filtro: FiltroMapa) => void;
}

const FILTROS: {
  id: FiltroMapa;
  nombre: string;
}[] = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'servicio', nombre: 'Servicios' },
  { id: 'producto', nombre: 'Productos' },
  { id: 'emergencia', nombre: 'Emergencias' },
  { id: 'recurso', nombre: 'Recursos' },
];

export default function ControlesMapa({
  busqueda,
  onCambiarBusqueda,
  filtro,
  onCambiarFiltro,
}: ControlesMapaProps) {
  return (
    <TourTarget id="map-controls" style={styles.contenedor}>
      <View style={styles.buscador} accessibilityRole="search">
        <View style={styles.iconoBusqueda}>
          <AppIcon name="search" size={20} color={colors.text.muted} />
        </View>

        <TextInput
          style={styles.entrada}
          accessibilityLabel="Buscar en el mapa"
          accessibilityHint="Escribe para filtrar servicios, productos, emergencias y recursos"
          placeholder="Buscar servicios o productos..."
          placeholderTextColor={colors.disabled}
          value={busqueda}
          onChangeText={onCambiarBusqueda}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel="Filtrar el mapa por tipo"
        contentContainerStyle={styles.filtros}
      >
        {FILTROS.map((opcion) => {
          const seleccionado = filtro === opcion.id;

          return (
            <Pressable
              key={opcion.id}
              onPress={() => onCambiarFiltro(opcion.id)}
              style={[styles.filtro, seleccionado && styles.filtroActivo]}
              accessibilityRole="button"
              accessibilityLabel={`Mostrar ${opcion.nombre.toLowerCase()}`}
              aria-pressed={seleccionado}
            >
              {opcion.id !== 'todos' && (
                <View
                  style={[
                    styles.punto,
                    {
                      backgroundColor: seleccionado
                        ? colors.background
                        : colors.category[opcion.id],
                      borderRadius: opcion.id === 'producto' ? 2 : 4,
                    },
                  ]}
                />
              )}
              <Text style={[styles.textoFiltro, seleccionado && styles.textoFiltroActivo]}>
                {opcion.nombre}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </TourTarget>
  );
}
