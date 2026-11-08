import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@app_vecinal:easy_reading';

export type EasyReadingContextValue = {
  easyReading: boolean;
  fontScale: number;
  toggleEasyReading: () => Promise<void>;
  setEasyReading: (enabled: boolean) => Promise<void>;
};

const EasyReadingContext = createContext<EasyReadingContextValue>({
  easyReading: false,
  fontScale: 1.0,
  toggleEasyReading: async () => {},
  setEasyReading: async () => {},
});

export function EasyReadingProvider({ children }: { children: React.ReactNode }) {
  const [easyReading, setEasyReadingState] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (active && stored !== null) {
          setEasyReadingState(stored === 'true');
        }
      })
      .catch(() => {
        // En caso de fallo de lectura de storage, se mantiene el valor por defecto
      });
    return () => {
      active = false;
    };
  }, []);

  const setEasyReading = useCallback(async (enabled: boolean) => {
    setEasyReadingState(enabled);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
      // Ignorar errores de persistencia secundaria
    }
  }, []);

  const toggleEasyReading = useCallback(async () => {
    const next = !easyReading;
    await setEasyReading(next);
  }, [easyReading, setEasyReading]);

  const value: EasyReadingContextValue = {
    easyReading,
    fontScale: easyReading ? 1.25 : 1.0,
    toggleEasyReading,
    setEasyReading,
  };

  return (
    <EasyReadingContext.Provider value={value}>
      {children}
    </EasyReadingContext.Provider>
  );
}

export function useEasyReading(): EasyReadingContextValue {
  return useContext(EasyReadingContext);
}
