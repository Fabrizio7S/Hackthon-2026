
import React from 'react';
import { View } from 'react-native';
import { Marker } from 'react-native-maps';

import type { CategoriaMapa } from '../types';
import { styles } from '../styles/MarcadorServicio.styles';
import { colors } from '../../../theme/colors';

interface MarcadorServicioProps {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  categoria: CategoriaMapa;
  onSeleccionar: (id: string) => void;
}

const COLORES: Record<CategoriaMapa, string> = {
  servicio: colors.category.servicio,
  producto: colors.category.producto,
  emergencia: colors.category.emergencia,
  recurso: colors.category.recurso,
};

export default function MarcadorServicio({
  id,
  nombre,
  latitud,
  longitud,
  categoria,
  onSeleccionar,
}: MarcadorServicioProps) {
  return (
    <Marker
      identifier={id}
      coordinate={{
        latitude: latitud,
        longitude: longitud,
      }}
      onPress={() => {
        console.log('Marcador seleccionado:', id);
        onSeleccionar(id);
      }}
      accessibilityLabel={nombre}
    >
      <View
        style={[
          styles.circulo,
          { backgroundColor: COLORES[categoria] },
        ]}
      />
    </Marker>
  );
}


