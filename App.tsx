
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View } from 'react-native';

import MapaServicios from './src/features/mapa/MapaServicios';

export default function App() {
  // Controla si mostramos el inicio o el mapa
  const [mostrarMapa, setMostrarMapa] = useState(false);

  // Pantalla temporal para probar nuestro mapa
  if (mostrarMapa) {
    return (
      <View style={styles.pantallaMapa}>
        <StatusBar style="dark" />

        <View style={styles.barraSuperior}>
          <Button
            title="Volver al inicio"
            onPress={() => setMostrarMapa(false)}
          />
        </View>

        <MapaServicios />
      </View>
    );
  }

  // Pantalla original de VeciRed
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Aplicación vecinal
      </Text>

      <Text style={styles.description}>
        Tu comunidad, más cerca.
      </Text>

      {/* Botón temporal para acceder al mapa */}
      <View style={styles.botonMapa}>
        <Button
          title="Ver mapa de servicios"
          onPress={() => setMostrarMapa(true)}
        />
      </View>

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  // Estilos originales
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    color: '#111',
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    marginTop: 12,
    color: '#444',
    fontSize: 18,
    textAlign: 'center',
  },

  // Estilos adicionales para nuestro mapa
  botonMapa: {
    marginTop: 24,
    width: '100%',
  },
  pantallaMapa: {
    flex: 1,
    backgroundColor: '#fff',
  },
  barraSuperior: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});

