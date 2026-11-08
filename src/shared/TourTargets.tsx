import { createContext, useCallback, useContext, useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewProps } from 'react-native';

export const TOUR_RED = '#D02020';
const TargetsContext = createContext<readonly string[]>([]);
type TargetView = ComponentRef<typeof View>;
type Reveal = (target: TargetView, active: () => boolean) => void;
const ScrollContext = createContext<Reveal | null>(null);

export function TourTargetsProvider({ targets, children }: { targets: readonly string[]; children: ReactNode }) {
  return <TargetsContext.Provider value={targets}>{children}</TargetsContext.Provider>;
}

export function useTourTargets() {
  const targets = useContext(TargetsContext);
  return useCallback((id: string) => targets.includes(id), [targets]);
}

/** Marco superpuesto: no cambia tamaños, no tapa el contenido y deja tocar los controles. */
export function TourTarget({ id, children, style, onLayout, ...props }: ViewProps & { id: string; children: ReactNode }) {
  const active = useTourTargets()(id);
  const reveal = useContext(ScrollContext);
  const ref = useRef<TargetView>(null);
  const enabled = useRef(active);
  enabled.current = active;
  const focus = useCallback(() => { if (active && ref.current) reveal?.(ref.current, () => enabled.current); }, [active, reveal]);

  useEffect(() => {
    if (!active) return;
    enabled.current = true;
    const frame = requestAnimationFrame(focus);
    return () => { enabled.current = false; cancelAnimationFrame(frame); };
  }, [active, focus]);

  return <View {...props} ref={ref} collapsable={false} testID={`tour-target:${id}`} style={style}
    onLayout={event => { onLayout?.(event); focus(); }}>
    {children}
    {active && <View testID={`tour-outline:${id}`} pointerEvents="none" accessible={false}
      importantForAccessibility="no-hide-descendants" style={styles.outline} />}
  </View>;
}

/** Acerca la zona explicada al principio del panel, también cuando los datos llegan tarde. */
export function TourScrollView({ children, onScroll, onLayout, onContentSizeChange, ...props }: ScrollViewProps) {
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const offset = useRef(0);
  const pending = useRef<{ target: TargetView; active: () => boolean } | null>(null);
  const reveal = useCallback<Reveal>((target, active) => {
    pending.current = { target, active };
    const scroller = ref.current;
    if (!scroller || !active()) return;
    scroller.measureInWindow((_x, top, _width, height) => {
      if (!active() || !height) return;
      target.measureInWindow((_targetX, targetTop, _targetWidth, targetHeight) => {
        if (!active() || !targetHeight) return;
        // No mover si ya cabe: evita saltos al cambiar la altura del contenido.
        if (targetTop >= top + 6 && targetTop + targetHeight <= top + height - 6) return;
        scroller.scrollTo({ y: Math.max(0, offset.current + targetTop - top - 10), animated: false });
      });
    });
  }, []);
  const refocus = () => {
    if (pending.current?.active()) reveal(pending.current.target, pending.current.active);
  };
  return <ScrollContext.Provider value={reveal}>
    <ScrollView {...props} ref={ref} scrollEventThrottle={16}
      onLayout={event => { onLayout?.(event); refocus(); }}
      onContentSizeChange={(width, height) => { onContentSizeChange?.(width, height); refocus(); }} onScroll={event => {
      offset.current = event.nativeEvent.contentOffset.y;
      onScroll?.(event);
    }}>{children}</ScrollView>
  </ScrollContext.Provider>;
}

const styles = StyleSheet.create({
  outline: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderWidth: 3, borderColor: TOUR_RED, borderRadius: 14, zIndex: 10 },
});
