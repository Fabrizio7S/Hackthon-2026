
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import type { CategoriaMapa } from './types';

interface MarcadorServicioProps {
    id: string;
    nombre: string;
    latitud: number;
    longitud: number;
    categoria: CategoriaMapa;
    onSeleccionar: (id: string) => void;
}

const COLORES: Record<CategoriaMapa, string> = {
    servicio: '#16A34A',
    producto: '#F59E0B',
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

const styles = StyleSheet.create({
    circulo: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
});

