import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppIcon } from '../../../shared/ui/AppIcon';
import { colors, fonts } from '../../../shared/theme';
import { TOUR_STEPS } from '../model/steps';
export { TOUR_STEPS } from '../model/steps';

type Props = {
  step: number;
  onMove(step: number): void;
  onFinish(): void;
  onEmergency(): void;
};

/** Tarjeta integrada: conserva disponibles la cabecera, la navegación y Emergencias. */
export function OnboardingTour({ step, onMove, onFinish, onEmergency }: Props) {
  const { width, height } = useWindowDimensions();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [bodyHeight, setBodyHeight] = useState(0);
  const [textHeight, setTextHeight] = useState(0);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const item = TOUR_STEPS[step];

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    AccessibilityInfo.announceForAccessibility(
      `Paso ${step + 1} de ${TOUR_STEPS.length}. ${TOUR_STEPS[step].title}`,
    );
  }, [step]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      finish.current();
      return true;
    });
    return () => subscription.remove();
  }, []);

  const landscape = width > height && width < 1000;
  return (
    <View style={[s.wrap, { maxHeight: Math.max(210, height * (landscape ? 0.75 : 0.46)) }]}>
      <View style={[s.card, width >= 760 && { paddingHorizontal: 24 }]}>
        <View style={s.top}>
          <Text style={s.eyebrow}>CONOCE TU RED VECINAL</Text>
          <Pressable accessibilityRole="button" onPress={onFinish} style={s.skip}>
            <Text style={s.skipText}>Saltar tutorial</Text>
          </Pressable>
        </View>
        <ScrollView
          ref={scroll}
          accessibilityLabel="Explicación del paso"
          keyboardShouldPersistTaps="handled"
          onLayout={(event) => setBodyHeight(event.nativeEvent.layout.height)}
          onContentSizeChange={(_width, contentHeight) => setTextHeight(contentHeight)}
          contentContainerStyle={{ gap: 12 }}
        >
          <View style={s.heading}>
            <View accessible={false} style={s.icon}>
              <AppIcon name={item.icon} size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.location}>{item.location}</Text>
              <Text accessibilityRole="header" style={s.title}>
                {item.title}
              </Text>
            </View>
          </View>
          <Text style={s.copy}>{item.copy}</Text>
          <Text style={s.tip}>{item.tip}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Salir del tutorial e ir a Emergencias"
            onPress={onEmergency}
            style={s.emergency}
          >
            <AppIcon name="siren" size={18} color={colors.dangerInk} />
            <Text style={s.emergencyText}>Ir a Emergencias</Text>
          </Pressable>
        </ScrollView>
        {textHeight > bodyHeight + 2 && (
          <Text style={s.scrollHint}>Desliza el texto para leer la explicación completa.</Text>
        )}
        <View style={s.progressRow}>
          <Text accessibilityLiveRegion="polite" style={s.progress}>
            Paso {step + 1} de {TOUR_STEPS.length}
          </Text>
          <View accessible={false} style={s.dots}>
            {TOUR_STEPS.map((_, index) => (
              <View key={index} style={[s.dot, index <= step && s.dotActive]} />
            ))}
          </View>
        </View>
        <View style={s.actions}>
          {step > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => onMove(step - 1)}
              style={s.secondary}
            >
              <Text style={s.secondaryText}>Anterior</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={step === TOUR_STEPS.length - 1 ? 'Entendido' : 'Siguiente'}
            onPress={() => (step === TOUR_STEPS.length - 1 ? onFinish() : onMove(step + 1))}
            style={s.primary}
          >
            <Text style={s.primaryText}>
              {step === TOUR_STEPS.length - 1 ? 'Entendido' : 'Siguiente'}
            </Text>
            <AppIcon
              name={step === TOUR_STEPS.length - 1 ? 'check' : 'arrow'}
              size={18}
              color={colors.onPrimary}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexShrink: 1, width: '100%', maxWidth: 900, alignSelf: 'center', padding: 10 },
  card: {
    flexShrink: 1,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  top: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.primary,
    fontWeight: '700',
  },
  skip: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: 8 },
  skipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 48,
    height: 54,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  location: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  title: { color: colors.text, fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  copy: { color: colors.text, fontSize: 15, lineHeight: 22 },
  tip: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  scrollHint: { color: colors.primary, fontSize: 12, lineHeight: 16 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  progress: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  dots: { flexDirection: 'row', flex: 1, maxWidth: 220, gap: 3 },
  dot: { flex: 1, height: 5, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primary: {
    flexGrow: 1,
    minHeight: 48,
    minWidth: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  primaryText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
  secondary: {
    minHeight: 48,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  emergency: {
    minHeight: 44,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.dangerSurface,
  },
  emergencyText: { color: colors.dangerInk, fontSize: 14, fontWeight: '700' },
});
