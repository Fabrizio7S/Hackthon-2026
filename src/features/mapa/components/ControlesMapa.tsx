
import React from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { CategoriaMapa } from '../types';
import { styles } from '../styles/ControlesMapa.styles';
import { colors } from '../../../theme/colors';

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
];

export default function ControlesMapa({
  busqueda,
  onCambiarBusqueda,
  filtro,
  onCambiarFiltro,
}: ControlesMapaProps) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.buscador}>
        <Text style={styles.iconoBusqueda}>⌕</Text>

        <TextInput
          style={styles.entrada}
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
        contentContainerStyle={styles.filtros}
      >
        {FILTROS.map((opcion) => {
          const seleccionado = filtro === opcion.id;

          return (
            <Pressable
              key={opcion.id}
              onPress={() => onCambiarFiltro(opcion.id)}
              style={[
                styles.filtro,
                seleccionado && styles.filtroActivo,
              ]}
              accessibilityRole="button"
              accessibilityState={{
                selected: seleccionado,
              }}
            >
              <Text
                style={[
                  styles.textoFiltro,
                  seleccionado && styles.textoFiltroActivo,
                ]}
              >
                {opcion.nombre}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
