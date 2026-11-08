import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';

import { AppIcon } from '../../shared/AppIcon';
import { colors } from '../../shared/theme';

const HOLD_DURATION_MS = 2000;

type Props = {
  onTriggerSos: () => Promise<{ ok: boolean; duplicate?: boolean; message: string }>;
  disabled?: boolean;
};

export function SosButton({ onTriggerSos, disabled = false }: Props) {
  const [holding, setHolding] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const triggeredRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  function handlePressIn() {
    if (disabled || sending) return;
    triggeredRef.current = false;
    setHint(null);
    setSentMessage(null);
    setHolding(true);
    startTimeRef.current = Date.now();

    // Iniciar animación de relleno de 2 segundos
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      useNativeDriver: false,
    }).start();

    // Disparar SOS si se mantiene presionado los 2 segundos completos
    holdTimerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      triggeredRef.current = true;
      holdTimerRef.current = null;
      setHolding(false);
      setSending(true);

      // Vibración de alerta en dispositivo móvil
      if (Platform.OS !== 'web') {
        try {
          Vibration.vibrate([0, 200, 100, 200]);
        } catch {
          // Ignorar si el dispositivo no soporta vibración
        }
      }

      try {
        const result = await onTriggerSos();
        if (mountedRef.current) {
          setSentMessage(result.ok ? result.message : null);
          setHint(result.ok ? null : result.message);
        }
      } catch (err) {
        if (mountedRef.current) {
          setHint(err instanceof Error ? err.message : 'No se pudo enviar la alerta SOS.');
        }
      } finally {
        if (mountedRef.current) {
          setSending(false);
          progressAnim.setValue(0);
        }
      }
    }, HOLD_DURATION_MS);
  }

  function handlePressOut() {
    if (sending) return;
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed < HOLD_DURATION_MS && holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHolding(false);
    progressAnim.setValue(0);

    // Si se soltó antes de 2 segundos, orientar al usuario
    if (!triggeredRef.current && elapsed < HOLD_DURATION_MS && !sentMessage) {
      setHint('Mantén presionado 2 segundos para activar la alerta.');
    }
  }

  const fillWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Alerta SOS Inmediata"
        accessibilityHint="Mantén presionado por 2 segundos para avisar a toda la comunidad de una emergencia crítica"
        disabled={disabled || sending}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.button,
          (disabled || sending) && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
      >
        {/* Barra de progreso animada de fondo */}
        <Animated.View style={[styles.progressBar, { width: fillWidth }]} />

        <View style={styles.contentRow}>
          <View style={styles.iconCircle}>
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <AppIcon name="siren" size={24} color="#FFF" />
            )}
          </View>
          <View style={styles.textColumn}>
            <Text style={styles.title}>
              {sending
                ? 'ENVIANDO AUXILIO...'
                : holding
                ? '¡MANTÉN PRESIONADO!'
                : 'ALERTA SOS INMEDIATA'}
            </Text>
            <Text style={styles.subtitle}>
              {holding
                ? 'Activando auxilio comunitario...'
                : 'Mantén presionado 2 seg ante peligro inminente'}
            </Text>
          </View>
        </View>
      </Pressable>

      {hint ? (
        <View style={styles.hintBox} accessibilityLiveRegion="polite">
          <AppIcon name="alert" size={16} color={colors.danger} />
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      ) : null}

      {sentMessage ? (
        <View style={styles.successBox} accessibilityLiveRegion="assertive">
          <AppIcon name="check" size={18} color="#1B5E20" />
          <Text style={styles.successText}>
            {sentMessage}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#C62828',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#B71C1C',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonPressed: {
    backgroundColor: '#B71C1C',
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#8E0000',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  subtitle: {
    color: '#FFCDD2',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  hintText: {
    color: colors.dangerDeep,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  successText: {
    color: '#1B5E20',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});
