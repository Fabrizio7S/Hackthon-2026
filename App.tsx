import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Aplicación vecinal
      </Text>
      <Text style={styles.description}>Tu comunidad, más cerca.</Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
