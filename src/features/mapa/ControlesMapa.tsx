
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { CategoriaMapa } from './types';

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
          placeholderTextColor="#9CA3AF"
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

const styles = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    zIndex: 10,
  },
  buscador: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  iconoBusqueda: {
    fontSize: 27,
    color: '#18734F',
    marginRight: 8,
  },
  entrada: {
    flex: 1,
    fontSize: 14,
    color: '#172B23',
  },
  filtros: {
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  filtro: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    elevation: 3,
  },
  filtroActivo: {
    backgroundColor: '#18734F',
  },
  textoFiltro: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  textoFiltroActivo: {
    color: '#FFFFFF',
  },
});
