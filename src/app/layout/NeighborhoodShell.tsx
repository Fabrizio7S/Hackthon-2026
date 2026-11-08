import { CreatePublicationSheet } from './CreatePublicationSheet';
import { useEffect, useState, type ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { colors } from '../../shared/theme';
import { AppIcon } from '../../shared/ui/AppIcon';
import { useTourTargets } from '../../shared/ui/tour/TourTargets';
import { type CreateAction, type NeighborhoodSection } from '../../shared/navigation/contracts';
import { destinations } from './navigationItems';
import { Brand } from '../../shared/ui/Brand';
import { s } from '../../shared/theme/neighborhood.styles';

export function NeighborhoodShell({
  section,
  onNavigate,
  communityName,
  onCreate,
  children,
  tour,
}: {
  section: NeighborhoodSection;
  onNavigate: (section: NeighborhoodSection) => void;
  communityName: string | null;
  onCreate: (action: CreateAction) => void;
  children: ReactNode;
  tour?: ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const desktop = width >= 1000;
  // En horizontal en un teléfono (p. ej. 844 × 390) la hoja debe caber y desplazarse.
  const compact = height < 520;
  const landscapeTour = !!tour && !desktop && width > height;
  const highlighted = useTourTargets();
  const [createOpen, setCreateOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const emergencyMode = section === 'emergencias';

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(Boolean(offline));
    });
    return () => unsubscribe();
  }, []);

  const tabButton = (key: NeighborhoodSection) => {
    const { label, icon } = destinations.find((d) => d.key === key)!;
    const active = section === key;
    return (
      <Pressable
        key={key}
        accessibilityRole="tab"
        accessibilityLabel={label}
        aria-selected={active}
        onPress={() => onNavigate(key)}
        style={({ pressed }) => [s.tab, pressed && s.pressed]}
      >
        <View style={[s.tabMarker, active && { backgroundColor: colors.primary }]} />
        <View
          testID={highlighted(`nav:${key}`) ? `tour-nav:${key}` : undefined}
          style={[s.navRing, highlighted(`nav:${key}`) && s.tourTarget]}
        >
          <AppIcon name={icon} color={active ? colors.primary : colors.textMuted} />
        </View>
        <Text style={[s.tabLabel, active && s.tabLabelActive]}>{label}</Text>
      </Pressable>
    );
  };

  const sideButton = (key: NeighborhoodSection) => {
    const item = destinations.find((d) => d.key === key)!;
    const active = section === key;
    return (
      <Pressable
        key={key}
        accessibilityRole="tab"
        accessibilityLabel={item.label}
        aria-selected={active}
        onPress={() => onNavigate(key)}
        style={({ pressed, hovered }) => [
          s.sideItem,
          active && s.sideItemActive,
          (pressed || hovered) && !active && s.sideItemHover,
        ]}
      >
        <View
          testID={highlighted(`nav:${key}`) ? `tour-nav:${key}` : undefined}
          style={[
            s.sideIcon,
            active && { backgroundColor: colors.primary },
            highlighted(`nav:${key}`) && s.tourTarget,
          ]}
        >
          <AppIcon name={item.icon} size={20} color={active ? colors.lime : colors.textMuted} />
        </View>
        <Text style={[s.sideLabel, active && s.sideLabelActive]}>{item.label}</Text>
      </Pressable>
    );
  };

  const sidebar = (
    <View style={s.sidebar}>
      <Brand />
      <Text style={s.sideCaption}>MI ESPACIO VECINAL</Text>
      <View accessibilityRole="tablist" style={{ gap: 4 }}>
        {destinations.map((d) => sideButton(d.key))}
      </View>
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel="Emergencias"
        aria-selected={emergencyMode}
        onPress={() => onNavigate('emergencias')}
        style={({ pressed, hovered }) => [
          s.sideItem,
          { marginTop: 6 },
          emergencyMode && { backgroundColor: colors.dangerSurface },
          (pressed || hovered) && !emergencyMode && s.sideItemHover,
        ]}
      >
        <View
          testID={highlighted('nav:emergencias') ? 'tour-nav:emergencias' : undefined}
          style={[
            s.sideIcon,
            { backgroundColor: emergencyMode ? colors.danger : colors.dangerSurface },
            highlighted('nav:emergencias') && s.tourTarget,
          ]}
        >
          <AppIcon name="siren" size={20} color={emergencyMode ? colors.onDanger : colors.danger} />
        </View>
        <Text style={[s.sideLabel, { color: colors.danger, fontWeight: '700' }]}>Emergencias</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Crear una publicación"
        testID={highlighted('nav:create') ? 'tour-nav:create' : undefined}
        onPress={() => setCreateOpen(true)}
        style={({ pressed }) => [
          s.desktopCreate,
          highlighted('nav:create') && s.tourTarget,
          pressed && s.pressed,
        ]}
      >
        <AppIcon name="plus" size={18} color={colors.lime} weight={2.4} />
        <Text style={s.createLabel}>Crear publicación</Text>
      </Pressable>
      <View style={s.sideNote}>
        <Text style={s.noteTitle}>Un barrio se construye entre todos.</Text>
        <Text style={s.noteCopy}>Cada servicio, préstamo y favor nos acerca.</Text>
      </View>
    </View>
  );

  const bottomBar = (
    <View style={s.bottomBar} accessibilityRole="tablist">
      {tabButton('inicio')}
      {tabButton('mapa')}
      <View style={s.createSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Crear una publicación"
          testID={highlighted('nav:create') ? 'tour-nav:create' : undefined}
          aria-expanded={createOpen}
          accessibilityState={{ expanded: createOpen }}
          onPress={() => setCreateOpen(true)}
          style={({ pressed }) => [
            s.createButton,
            highlighted('nav:create') && s.tourTarget,
            pressed && s.pressed,
          ]}
        >
          <AppIcon name="plus" size={26} color={colors.lime} weight={2.4} />
        </Pressable>
      </View>
      {tabButton('favores')}
      {tabButton('comunidad')}
    </View>
  );

  const title = emergencyMode
    ? 'Emergencias y apoyo'
    : destinations.find((d) => d.key === section)?.label;

  return (
    <View style={[s.shell, desktop && { flexDirection: 'row' }]}>
      {desktop && sidebar}
      <View style={s.main}>
        <View style={[s.topbar, !desktop && { paddingHorizontal: 16, minHeight: 64 }]}>
          <View style={{ flex: 1 }}>
            {desktop ? (
              <>
                <Text style={s.topEyebrow}>
                  {(communityName ?? 'Tu espacio para conectar').toUpperCase()}
                </Text>
                <Text style={s.topLabel}>{title}</Text>
              </>
            ) : (
              <Brand />
            )}
          </View>
          {(!emergencyMode || !!tour) && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ir a emergencias"
              testID={highlighted('nav:emergencias') ? 'tour-nav:emergency-header' : undefined}
              onPress={() => onNavigate('emergencias')}
              style={({ pressed }) => [
                s.emergency,
                highlighted('nav:emergencias') && s.tourTarget,
                pressed && s.pressed,
              ]}
            >
              <AppIcon name="siren" size={18} color={colors.onDanger} weight={2} />
              <Text style={s.emergencyText}>Emergencias</Text>
            </Pressable>
          )}
        </View>
        {isOffline && (
          <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={s.offlineBanner}>
            <Text style={s.offlineBannerText}>
              Sin conexión a internet · Modo offline activo (los reportes de emergencia se guardan
              en tu teléfono)
            </Text>
          </View>
        )}
        <View style={[s.workspace, landscapeTour && { flexDirection: 'row' }]}>
          {tour && (
            <View style={landscapeTour ? { width: '45%', minWidth: 0, minHeight: 0 } : undefined}>
              {tour}
            </View>
          )}
          <View
            style={[
              s.content,
              landscapeTour && { alignSelf: 'stretch', width: undefined, minWidth: 0 },
            ]}
          >
            {children}
          </View>
        </View>
      </View>
      {!desktop && bottomBar}
      <CreatePublicationSheet
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        onCreate={onCreate}
        height={height}
        compact={compact}
      />
    </View>
  );
}
