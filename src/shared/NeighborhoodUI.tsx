import { useEffect, useState, type ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { archRadius, colors, fonts } from './theme';
import { AppIcon, type IconName } from './AppIcon';
export type CreateAction = 'service' | 'favor' | 'emergency';

export type NeighborhoodSection = 'inicio' | 'comunidad' | 'servicios' | 'mapa' | 'favores' | 'emergencias';
const destinations: { key: NeighborhoodSection; label: string; icon: IconName }[] = [
  { key: 'inicio', label: 'Inicio', icon: 'home' },
  { key: 'servicios', label: 'Servicios', icon: 'services' },
  { key: 'favores', label: 'Favores', icon: 'chain' },
  { key: 'mapa', label: 'Mapa', icon: 'map' },
  { key: 'comunidad', label: 'Perfil', icon: 'person' },
];

/** Marca: puerta en arco con la palabra «Red vecinal.». */
export function Brand({ inverse = false }: { inverse?: boolean }) {
  return <View style={s.brand}>
    <View accessible={false} style={[s.brandMark, inverse && { backgroundColor: colors.lime }]}>
      <View style={[s.brandDoor, inverse && { backgroundColor: colors.primaryDeep }]} />
    </View>
    <Text style={[s.brandName, inverse && { color: colors.onDeep }]}>Red vecinal<Text style={{ color: inverse ? '#E59A72' : colors.clay }}>.</Text></Text>
  </View>;
}

/** Ilustración decorativa: una calle de puertas en arco. No representa datos reales. */
export function NeighborhoodArt({ height = 104 }: { height?: number }) {
  const houses = [
    { flex: 1, h: 0.68, bg: '#E5B484' },
    { flex: 1.3, h: 1, bg: colors.lime, door: true },
    { flex: 0.8, h: 0.56, bg: '#9CBDA3' },
    { flex: 1.1, h: 0.82, bg: '#FFF0CB', window: true },
    { flex: 0.9, h: 0.62, bg: '#E59A72' },
  ];
  return <View accessible={false} importantForAccessibility="no-hide-descendants" style={[s.art, { height }]}>
    {houses.map((house, i) => <View key={i} style={{ flex: house.flex, height: height * house.h, backgroundColor: house.bg, borderTopLeftRadius: 999, borderTopRightRadius: 999, alignItems: 'center', justifyContent: house.door ? 'flex-end' : 'flex-start' }}>
      {house.door && <View style={{ width: height * 0.24, height: height * 0.34, backgroundColor: colors.primaryDeep, borderTopLeftRadius: 99, borderTopRightRadius: 99 }} />}
      {house.window && <View style={{ marginTop: height * 0.22, width: height * 0.16, height: height * 0.2, backgroundColor: '#2C7657', borderTopLeftRadius: 99, borderTopRightRadius: 99, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }} />}
    </View>)}
  </View>;
}

export function WelcomeStory() {
  const { width } = useWindowDimensions();
  return <View style={[s.story, width >= 900 && { flex: 1, maxWidth: 560 }]}>
    <View style={[s.storyInner, width < 600 && { padding: 20 }]}>
      <Brand inverse />
      <Text style={s.storyEyebrow}>TU BARRIO. TU GENTE.</Text>
      <Text style={[s.storyTitle, width < 600 && { fontSize: 30, lineHeight: 33 }]}>Un pequeño gesto.{"\n"}Un barrio más unido.</Text>
      <Text style={[s.storyCopy, width < 600 && { fontSize: 14, lineHeight: 21 }]}>Encuentra lo que necesitas, comparte lo que tienes y conecta con quienes viven cerca.</Text>
    </View>
    <NeighborhoodArt height={width < 600 ? 84 : 130} />
  </View>;
}

export function NeighborhoodShell({ section, onNavigate, communityName, onCreate, children }: {
  section: NeighborhoodSection; onNavigate: (section: NeighborhoodSection) => void;
  communityName: string | null; onCreate: (action: CreateAction) => void; children: ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const desktop = width >= 1000;
  // En horizontal en un teléfono (p. ej. 844 × 390) la hoja debe caber y desplazarse.
  const compact = height < 520;
  const [createOpen, setCreateOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const emergencyMode = section === 'emergencias';

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(Boolean(offline));
    });
    return () => unsubscribe();
  }, []);

  const tabButton = (key: NeighborhoodSection) => {
    const { label, icon } = destinations.find(d => d.key === key)!;
    const active = section === key;
    return <Pressable key={key} accessibilityRole="tab" accessibilityLabel={label}
      aria-selected={active} onPress={() => onNavigate(key)}
      style={({ pressed }) => [s.tab, pressed && s.pressed]}>
      <View style={[s.tabMarker, active && { backgroundColor: colors.primary }]} />
      <AppIcon name={icon} color={active ? colors.primary : colors.textMuted} />
      <Text style={[s.tabLabel, active && s.tabLabelActive]}>{label}</Text>
    </Pressable>;
  };

  const sideButton = (key: NeighborhoodSection) => {
    const item = destinations.find(d => d.key === key)!;
    const active = section === key;
    return <Pressable key={key} accessibilityRole="tab" accessibilityLabel={item.label}
      aria-selected={active} onPress={() => onNavigate(key)}
      style={({ pressed, hovered }) => [s.sideItem, active && s.sideItemActive, (pressed || hovered) && !active && s.sideItemHover]}>
      <View style={[s.sideIcon, active && { backgroundColor: colors.primary }]}>
        <AppIcon name={item.icon} size={20} color={active ? colors.lime : colors.textMuted} />
      </View>
      <Text style={[s.sideLabel, active && s.sideLabelActive]}>{item.label}</Text>
    </Pressable>;
  };

  const sidebar = <View style={s.sidebar}>
    <Brand />
    <Text style={s.sideCaption}>MI ESPACIO VECINAL</Text>
    <View accessibilityRole="tablist" style={{ gap: 4 }}>{destinations.map(d => sideButton(d.key))}</View>
    <Pressable accessibilityRole="tab" accessibilityLabel="Emergencias" aria-selected={emergencyMode} onPress={() => onNavigate('emergencias')}
      style={({ pressed, hovered }) => [s.sideItem, { marginTop: 6 }, emergencyMode && { backgroundColor: colors.dangerSurface }, (pressed || hovered) && !emergencyMode && s.sideItemHover]}>
      <View style={[s.sideIcon, { backgroundColor: emergencyMode ? colors.danger : colors.dangerSurface }]}>
        <AppIcon name="siren" size={20} color={emergencyMode ? colors.onDanger : colors.danger} />
      </View>
      <Text style={[s.sideLabel, { color: colors.danger, fontWeight: '700' }]}>Emergencias</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Crear una publicación" onPress={() => setCreateOpen(true)} style={({ pressed }) => [s.desktopCreate, pressed && s.pressed]}>
      <AppIcon name="plus" size={18} color={colors.lime} weight={2.4} />
      <Text style={s.createLabel}>Crear publicación</Text>
    </Pressable>
    <View style={s.sideNote}>
      <Text style={s.noteTitle}>Un barrio se construye entre todos.</Text>
      <Text style={s.noteCopy}>Cada servicio, préstamo y favor nos acerca.</Text>
    </View>
  </View>;

  const bottomBar = <View style={s.bottomBar} accessibilityRole="tablist">
    {tabButton('inicio')}
    {tabButton('mapa')}
    <View style={s.createSlot}>
      <Pressable accessibilityRole="button" accessibilityLabel="Crear una publicación" aria-expanded={createOpen} onPress={() => setCreateOpen(true)} style={({ pressed }) => [s.createButton, pressed && s.pressed]}>
        <AppIcon name="plus" size={26} color={colors.lime} weight={2.4} />
      </Pressable>
    </View>
    {tabButton('favores')}
    {tabButton('comunidad')}
  </View>;

  const title = emergencyMode ? 'Emergencias y apoyo' : destinations.find(d => d.key === section)?.label;

  return <View style={[s.shell, desktop && { flexDirection: 'row' }]}>
    {desktop && sidebar}
    <View style={s.main}>
      <View style={[s.topbar, !desktop && { paddingHorizontal: 16, minHeight: 64 }]}>
        <View style={{ flex: 1 }}>
          {desktop ? <>
            <Text style={s.topEyebrow}>{(communityName ?? 'Tu espacio para conectar').toUpperCase()}</Text>
            <Text style={s.topLabel}>{title}</Text>
          </> : <Brand />}
        </View>
        {!emergencyMode && <Pressable accessibilityRole="button" accessibilityLabel="Ir a emergencias" onPress={() => onNavigate('emergencias')} style={({ pressed }) => [s.emergency, pressed && s.pressed]}>
          <AppIcon name="siren" size={18} color={colors.onDanger} weight={2} />
          <Text style={s.emergencyText}>Emergencias</Text>
        </Pressable>}
      </View>
      {isOffline && (
        <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={s.offlineBanner}>
          <Text style={s.offlineBannerText}>
            Sin conexión a internet · Modo offline activo (los reportes de emergencia se guardan en tu teléfono)
          </Text>
        </View>
      )}
      <View style={s.content}>{children}</View>
    </View>
    {!desktop && bottomBar}
    <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
      <View style={s.modalRoot}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar opciones de publicación" style={s.backdrop} onPress={() => setCreateOpen(false)} />
        <View accessibilityViewIsModal style={[s.createSheet, { maxHeight: height - (compact ? 8 : 48) }, compact && s.createSheetCompact]}>
          {!compact && <View style={s.sheetHandle} />}
          <View style={s.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text accessibilityRole="header" style={s.sheetTitle}>¿Qué quieres compartir?</Text>
              <Text style={s.noteCopy}>Elige una opción para comenzar.</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => setCreateOpen(false)} style={s.closeButton}><AppIcon name="close" size={18} color={colors.text} weight={2} /></Pressable>
          </View>
          <ScrollView style={s.sheetScroll} contentContainerStyle={{ gap: compact ? 8 : 12 }} showsVerticalScrollIndicator={false}>
          {([
            { action: 'service', icon: 'services', title: 'Servicio o producto', copy: 'Ofrece tu oficio o algo que vendes.', tint: colors.primarySurface, ink: colors.primary },
            { action: 'favor', icon: 'chain', title: 'Préstamo o intercambio', copy: 'Comparte algo sin dinero de por medio.', tint: colors.claySurface, ink: colors.clay },
            { action: 'emergency', icon: 'siren', title: 'Reportar una emergencia', copy: 'Avisa a tu comunidad y pide apoyo.', tint: colors.dangerDeep, ink: colors.onDanger },
          ] as const).map(item => {
            const urgent = item.action === 'emergency';
            return <Pressable key={item.action} accessibilityRole="button" onPress={() => { setCreateOpen(false); onCreate(item.action); }}
              style={({ pressed, hovered }) => [s.createOption, urgent && s.createOptionUrgent, (pressed || hovered) && s.pressed]}>
              <View style={[s.optionArch, { backgroundColor: item.tint }]}><AppIcon name={item.icon} size={26} color={item.ink} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[s.optionTitle, urgent && { color: colors.onDanger }]}>{item.title}</Text>
                <Text style={[s.optionCopy, urgent && { color: '#FBDCD3' }]}>{item.copy}</Text>
              </View>
              <AppIcon name="chevron" size={18} color={urgent ? colors.onDanger : colors.textMuted} weight={2} />
            </Pressable>;
          })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </View>;
}

const doors: { section: NeighborhoodSection; label: string; copy: string; icon: IconName; tint: string; ink: string }[] = [
  { section: 'servicios', label: 'Servicios', copy: 'Oficios y productos de tus vecinos.', icon: 'services', tint: colors.primarySurface, ink: colors.primary },
  { section: 'favores', label: 'Favores', copy: 'Presta, intercambia, pide una mano.', icon: 'chain', tint: colors.claySurface, ink: colors.clay },
  { section: 'mapa', label: 'Mapa', copy: 'Lo disponible, cuadra por cuadra.', icon: 'pin', tint: colors.riverSurface, ink: colors.river },
  { section: 'emergencias', label: 'Emergencias', copy: 'Alertas, recursos y brigadas.', icon: 'support', tint: colors.dangerSurface, ink: colors.danger },
];

export function NeighborhoodHome({ communityName, role = null, onNavigate, children }: { communityName: string | null; role?: 'representative' | 'member' | null; onNavigate: (section: NeighborhoodSection) => void; children?: ReactNode }) {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  return <ScrollView contentContainerStyle={[s.homeScroll, !wide && { padding: 16, paddingBottom: 28 }]}><View style={s.homeInner}>
    <View style={s.plaque}>
      <View style={[s.plaqueInner, wide && { flexDirection: 'row', alignItems: 'flex-end' }]}>
        <View style={[{ gap: 8 }, wide ? { flex: 1, paddingBottom: 28 } : { paddingBottom: 18 }]}>
          <View style={s.plaqueRow}>
            <Text style={s.plaqueEyebrow}>COMUNIDAD VECINAL</Text>
            {communityName && role && <Text style={s.plaqueBadge}>{role === 'representative' ? 'REPRESENTANTE' : 'INTEGRANTE'}</Text>}
          </View>
          <Text accessibilityRole="header" style={[s.plaqueTitle, wide && { fontSize: 50, lineHeight: 50 }]}>{communityName ?? 'Aquí empieza la comunidad.'}</Text>
          <Text style={s.plaqueCopy}>{communityName ? 'Un servicio que buscabas, algo que puedes prestar, una mano cuando hace falta. Todo a pocas cuadras.' : 'Únete o crea tu comunidad para empezar a compartir con tus vecinos.'}</Text>
          {wide && <Pressable accessibilityRole="button" onPress={() => onNavigate('servicios')} style={({ pressed }) => [s.plaqueButton, pressed && s.pressed]}>
            <Text style={s.plaqueButtonText}>Descubrir servicios</Text>
            <AppIcon name="arrow" size={16} color={colors.primaryDeep} weight={2.2} />
          </Pressable>}
        </View>
        {wide && <View style={{ flex: 1, maxWidth: 380 }}><NeighborhoodArt height={170} /></View>}
      </View>
    </View>

    <View accessibilityRole="menu" style={[s.doors, wide && { gap: 16 }]}>
      {doors.map(door => <Pressable key={door.section} accessibilityRole="button" accessibilityLabel={door.label} onPress={() => onNavigate(door.section)}
        style={({ pressed, hovered }) => [s.door, (pressed || hovered) && s.pressed]}>
        <View style={[s.doorArch, { backgroundColor: door.tint }, wide && { height: 150, paddingTop: 30, justifyContent: 'flex-start' }]}>
          <View style={wide ? [s.doorBadge, { backgroundColor: door.ink }] : null}>
            <AppIcon name={door.icon} size={wide ? 26 : 28} color={wide ? (door.section === 'servicios' ? colors.lime : colors.onDanger) : door.ink} weight={1.7} />
          </View>
          {wide && <Text style={s.doorTitle}>{door.label}</Text>}
          {wide && <Text style={s.doorCopy}>{door.copy}</Text>}
        </View>
        {!wide && <Text style={s.doorLabel}>{door.label}</Text>}
      </Pressable>)}
    </View>

    <Pressable accessibilityRole="button" accessibilityLabel="Ver emergencias y apoyo" onPress={() => onNavigate('emergencias')} style={({ pressed }) => [s.helpStrip, pressed && s.pressed]}>
      <View style={s.pulseDot} />
      <View style={{ flex: 1 }}>
        <Text style={s.helpTitle}>Cuando más importa, estamos cerca.</Text>
        <Text style={s.helpCopy}>Consulta alertas, reporta una emergencia o encuentra recursos de apoyo.</Text>
      </View>
      <AppIcon name="chevron" size={18} color={colors.danger} weight={2} />
    </Pressable>

    <Text accessibilityRole="header" style={s.sectionTitle}>Tu comunidad empieza contigo</Text>
    {children}
  </View></ScrollView>;
}

const s = StyleSheet.create({
  pressed: { opacity: 0.72 },
  shell: { flex: 1, backgroundColor: colors.surface }, main: { flex: 1, minWidth: 0 }, content: { flex: 1, minHeight: 0, width: '100%', maxWidth: 1280, alignSelf: 'center' },

  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 30, height: 34, ...archRadius(30, 6), backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'flex-end' },
  brandDoor: { width: 10, height: 13, borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: colors.lime },
  brandName: { fontSize: 21, fontWeight: '800', color: colors.text, letterSpacing: -0.6 },

  // Barra inferior (móvil)
  bottomBar: { flexDirection: 'row', alignItems: 'stretch', backgroundColor: colors.background, paddingHorizontal: 6, paddingBottom: Platform.OS === 'ios' ? 24 : 10, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: colors.border },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 64, paddingTop: 8 },
  tabMarker: { position: 'absolute', top: -1, width: 28, height: 4, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: 'transparent' },
  tabLabel: { fontSize: 11.5, color: colors.textMuted, fontWeight: '500' },
  tabLabelActive: { color: colors.primary, fontWeight: '700' },
  createSlot: { flex: 1, alignItems: 'center' },
  createButton: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.primary, borderWidth: 5, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginTop: -24 },

  // Menú lateral (escritorio)
  sidebar: { width: 264, paddingHorizontal: 18, paddingVertical: 26, backgroundColor: colors.background, borderRightWidth: 1, borderColor: colors.border },
  sideCaption: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 1.6, color: colors.textMuted, marginTop: 40, marginBottom: 10, marginLeft: 8 },
  sideItem: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8 },
  sideItemActive: { backgroundColor: colors.primarySurface },
  sideItemHover: { backgroundColor: '#F0ECE0' },
  sideIcon: { width: 34, height: 38, ...archRadius(34, 7), alignItems: 'center', justifyContent: 'center' },
  sideLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
  sideLabelActive: { fontWeight: '700' },
  desktopCreate: { backgroundColor: colors.primary, borderRadius: 16, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22 },
  createLabel: { color: colors.onPrimary, fontWeight: '700', fontSize: 14.5 },
  sideNote: { marginTop: 'auto', padding: 16, borderRadius: 16, backgroundColor: colors.surface },
  noteTitle: { fontSize: 16, fontWeight: '700', color: colors.text, lineHeight: 21 },
  noteCopy: { fontSize: 13.5, color: colors.textMuted, lineHeight: 20, marginTop: 4 },

  // Barra superior
  topbar: { minHeight: 80, paddingHorizontal: 32, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.background, borderBottomWidth: 1, borderColor: colors.border },
  topEyebrow: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.4, color: colors.primary, fontWeight: '600' },
  topLabel: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginTop: 2 },
  emergency: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.danger },
  emergencyText: { fontSize: 13, color: colors.onDanger, fontWeight: '700' },
  offlineBanner: { backgroundColor: colors.warningSurface, borderBottomWidth: 1, borderBottomColor: colors.warningInk, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  offlineBannerText: { color: colors.warningInk, fontSize: 12.5, fontWeight: '700', textAlign: 'center' },

  // Hoja de creación
  modalRoot: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(14,34,27,0.5)' },
  createSheet: { width: '100%', maxWidth: 560, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34, borderTopLeftRadius: 28, borderTopRightRadius: 28, gap: 12 },
  createSheetCompact: { paddingTop: 12, paddingBottom: 12, gap: 8 },
  sheetScroll: { flexShrink: 1 },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sheetTitle: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.6 },
  closeButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0ECE0', alignItems: 'center', justifyContent: 'center' },
  createOption: { padding: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 14 },
  createOptionUrgent: { backgroundColor: colors.danger, borderColor: colors.danger },
  optionArch: { width: 56, height: 64, ...archRadius(56), alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  optionCopy: { fontSize: 13.5, color: colors.textMuted, marginTop: 3 },

  // Inicio
  homeScroll: { flexGrow: 1, padding: 28, paddingBottom: 40 }, homeInner: { width: '100%', maxWidth: 1120, alignSelf: 'center', gap: 22 },
  plaque: { backgroundColor: colors.primaryDeep, borderRadius: 24, padding: 6, overflow: 'hidden' },
  plaqueInner: { borderWidth: 1.5, borderColor: 'rgba(244,241,232,0.42)', borderRadius: 19, paddingTop: 18, paddingHorizontal: 20, gap: 16, overflow: 'hidden' },
  plaqueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  plaqueEyebrow: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.4, color: '#C9DCA8' },
  plaqueBadge: { fontFamily: fonts.mono, fontSize: 10.5, fontWeight: '600', color: colors.primaryDeep, backgroundColor: colors.lime, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, overflow: 'hidden' },
  plaqueTitle: { fontSize: 31, lineHeight: 33, fontWeight: '800', letterSpacing: -1, color: colors.onDeep },
  plaqueCopy: { fontSize: 14.5, lineHeight: 21, color: colors.onDeepMuted, maxWidth: 460 },
  plaqueButton: { marginTop: 8, alignSelf: 'flex-start', minHeight: 48, paddingHorizontal: 20, borderRadius: 14, backgroundColor: colors.lime, flexDirection: 'row', alignItems: 'center', gap: 8 },
  plaqueButtonText: { fontSize: 15, fontWeight: '700', color: colors.primaryDeep },
  art: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingHorizontal: 4 },

  doors: { flexDirection: 'row', gap: 10 },
  door: { flex: 1, alignItems: 'center', gap: 7 },
  doorArch: { width: '100%', height: 84, borderTopLeftRadius: 999, borderTopRightRadius: 999, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  doorBadge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  doorTitle: { fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  doorCopy: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 4, lineHeight: 18 },
  doorLabel: { fontSize: 13, fontWeight: '600', color: colors.text },

  helpStrip: { padding: 16, borderRadius: 18, backgroundColor: colors.dangerSurface, flexDirection: 'row', alignItems: 'center', gap: 14 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger, marginHorizontal: 4, borderWidth: 0, shadowColor: colors.danger, shadowOpacity: 0.4, shadowRadius: 6, elevation: 2 },
  helpTitle: { fontSize: 15.5, fontWeight: '700', color: colors.text },
  helpCopy: { fontSize: 13.5, color: colors.dangerInk, lineHeight: 19, marginTop: 2 },
  sectionTitle: { fontSize: 21, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },

  story: { backgroundColor: colors.primaryDeep, borderRadius: 28, overflow: 'hidden', width: '100%' },
  storyInner: { padding: 28, gap: 14 },
  storyEyebrow: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.6, color: '#C9DCA8', marginTop: 18 },
  storyTitle: { fontSize: 44, lineHeight: 46, letterSpacing: -1.6, fontWeight: '800', color: colors.onDeep },
  storyCopy: { color: colors.onDeepMuted, fontSize: 16, lineHeight: 25, maxWidth: 420 },
});
