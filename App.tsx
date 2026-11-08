import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';

import { AuthPanel } from './src/features/auth/AuthPanel';
import { EasyReadingProvider } from './src/shared/EasyReadingContext';
import { supabase } from './src/lib/supabase';

export default function App() {
  useEffect(() => {
    if (!supabase || Platform.OS === 'web') return;
    const client = supabase;
    const refresh = (state: string | null | undefined) => {
      if (state === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    };
    refresh(AppState.currentState);
    const subscription = AppState.addEventListener('change', refresh);
    return () => {
      subscription.remove();
      client.auth.stopAutoRefresh();
    };
  }, []);

  return (
    <EasyReadingProvider>
      <View style={styles.container}>
        <AuthPanel client={supabase} />
        <StatusBar style="dark" />
      </View>
    </EasyReadingProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 0 : 48,
    paddingBottom: Platform.OS === 'web' ? 0 : 12,
    backgroundColor: '#fff',
  },
});
