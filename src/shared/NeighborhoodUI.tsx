import { useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors } from './theme';
import { AppIcon, type IconName } from './AppIcon';
export type CreateAction = 'service' | 'favor' | 'emergency';

export type NeighborhoodSection = 'inicio' | 'comunidad' | 'servicios' | 'mapa' | 'favores' | 'emergencias';
const destinations: { key: NeighborhoodSection; label: string; icon: IconName }[] = [
  { key: 'inicio', label: 'Inicio', icon: 'home' },
  { key: 'servicios', label: 'Servicios', icon: 'services' },
  { key: 'favores', label: 'Favores', icon: 'people' },
  { key: 'mapa', label: 'Mapa', icon: 'map' },
  { key: 'comunidad', label: 'Mi comunidad', icon: 'person' },
];

export function Brand() {
  return <View style={s.brand}><View accessible={false} style={s.brandMark}><View style={s.roof} /><View style={s.door} /></View><View><Text style={s.brandName}>Red vecinal<Text style={{ color: colors.primary }}>.</Text></Text><Text style={s.brandCaption}>LO BUENO ESTÁ CERCA</Text></View></View>;
}

/** Ilustración decorativa local: no representa una ubicación ni datos de vecinos. */
export function NeighborhoodArt() {
  return <View accessible={false} importantForAccessibility="no-hide-descendants" style={s.art}>
    <View style={s.sun} /><View style={s.ground} />
    {[0, 1, 2].map(i => <View key={i} style={[s.house, { left: 24 + i * 75, bottom: 30 + (i === 1 ? 14 : 0), backgroundColor: ['#E5B484', '#FFF0CB', '#9CBDA3'][i] }]}>
      <View style={[s.houseRoof, { backgroundColor: ['#A9543A', '#E7AA66', '#245747'][i] }]} /><View style={s.window} /><View style={s.houseDoor} />
    </View>)}
    {[8, 253].map(left => <View key={left} style={[s.tree, { left }]}><View style={s.crown} /></View>)}
  </View>;
}

export function WelcomeStory() {
  const { width } = useWindowDimensions();
  return <View style={[s.story, width < 600 && { padding: 20, gap: 12 }, width >= 900 && { flex: 1, maxWidth: 560 }]}>
    <Brand /><Text style={s.eyebrow}>TU BARRIO. TU GENTE.</Text>
    <Text style={[s.storyTitle, width < 600 && { fontSize: 28, lineHeight: 34, letterSpacing: -1 }]}>Un pequeño gesto.{"\n"}Un barrio más unido.</Text>
    <Text style={[s.storyCopy, width < 600 && { fontSize: 14, lineHeight: 22 }]}>Encuentra lo que necesitas, comparte lo que tienes y conecta con quienes viven cerca.</Text>
    {width >= 600 && <NeighborhoodArt />}
    <View style={s.storyFooter}><Text style={s.storyFooterText}>Servicios cercanos</Text><Text style={s.storyFooterText}>Ayuda entre vecinos</Text></View>
  </View>;
}

export function NeighborhoodShell({ section, onNavigate, communityName, onCreate, children }: {
  section: NeighborhoodSection; onNavigate: (section: NeighborhoodSection) => void;
  communityName: string | null; onCreate: (action: CreateAction) => void; children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  const [createOpen, setCreateOpen] = useState(false);
  const navButton = (key: NeighborhoodSection, label?: string) => {
    const item = destinations.find(d => d.key === key)!;
    const active = section === key;
    return <Pressable key={key} accessibilityRole="tab" accessibilityLabel={label ?? item.label}
      accessibilityState={{ selected: active }} onPress={() => onNavigate(key)}
      style={({ pressed, hovered }) => [s.navItem, desktop ? s.sideItem : s.bottomItem, desktop && active && s.selected, (pressed || hovered) && s.hover]}>
      <AppIcon name={item.icon} color={active ? colors.primary : colors.textMuted} />
      <Text style={[s.navLabel, !desktop && s.mobileLabel, active && s.selectedText]}>{label ?? item.label}</Text>
    </Pressable>;
  };
  const createButton = <Pressable accessibilityRole="button" accessibilityLabel="Crear una publicación" accessibilityState={{ expanded: createOpen }} onPress={() => setCreateOpen(true)} style={({ pressed }) => [desktop ? s.desktopCreate : s.createButton, pressed && s.hover]}><AppIcon name="plus" size={28} color="#FFFFFF" />{desktop && <Text style={s.createLabel}>Crear publicación</Text>}</Pressable>;
  const nav = desktop ? <View style={s.sideLinks}><View accessibilityRole="tablist">{destinations.map(d => navButton(d.key))}</View>{createButton}</View> :
    <View style={s.bottomLinks}>{navButton('inicio')}{navButton('mapa')}<View style={s.createSlot}>{createButton}</View>{navButton('favores', 'Solidario')}{navButton('comunidad', 'Perfil')}</View>;
  return <View style={[s.shell, desktop && { flexDirection: 'row' }]}>
    {desktop && <View style={s.sidebar}><Brand /><Text style={s.sideCaption}>MI ESPACIO VECINAL</Text>{nav}<View style={s.sideNote}><Text style={s.noteTitle}>Un barrio se construye entre todos.</Text><Text style={s.noteCopy}>Cada intercambio, servicio y favor nos acerca.</Text></View><Text style={s.sideFooter}>HECHO PARA CONECTARNOS</Text></View>}
    <View style={s.main}>
      <View style={[s.topbar, !desktop && { paddingHorizontal: 16 }]}>
        <View style={{ flex: 1 }}>{desktop ? <Text style={s.topLabel}>{section === 'emergencias' ? 'Emergencias y apoyo' : destinations.find(d => d.key === section)?.label}</Text> : <Brand />}
          {desktop && <Text style={s.location}>{communityName ?? 'Tu espacio para conectar'}</Text>}</View>
        <Pressable accessibilityRole="button" onPress={() => onNavigate('emergencias')} style={({ pressed }) => [s.emergency, pressed && s.hover]}><AppIcon name="alert" size={18} color={colors.danger} /><Text style={s.emergencyText}>Emergencias</Text></Pressable>
      </View>
      <View style={s.content}>{children}</View>
    </View>
    {!desktop && nav}
    <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
      <View style={s.modalRoot}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar opciones de publicación" style={s.backdrop} onPress={() => setCreateOpen(false)} />
        <View accessibilityViewIsModal style={s.createSheet}>
          <View style={s.sheetHeader}><Text accessibilityRole="header" style={s.sectionTitle}>¿Qué quieres compartir?</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => setCreateOpen(false)} style={s.closeButton}><AppIcon name="close" /></Pressable></View>
          <Text style={s.noteCopy}>Elige una opción para comenzar.</Text>
          {([
            { action: 'service', icon: 'services', title: 'Servicio o producto', copy: 'Ofrece tu talento o algo que vendes.' },
            { action: 'favor', icon: 'people', title: 'Préstamo o intercambio', copy: 'Comparte un recurso con tus vecinos.' },
            { action: 'emergency', icon: 'alert', title: 'Reportar una emergencia', copy: 'Pide apoyo a tu comunidad.' },
          ] as const).map(item => <Pressable key={item.action} accessibilityRole="button" onPress={() => { setCreateOpen(false); onCreate(item.action); }} style={({ pressed, hovered }) => [s.createOption, (pressed || hovered) && s.selected]}><AppIcon name={item.icon} color={item.action === 'emergency' ? colors.danger : colors.primary} /><View style={{ flex: 1 }}><Text style={s.noteTitle}>{item.title}</Text><Text style={s.noteCopy}>{item.copy}</Text></View><AppIcon name="arrow" size={20} /></Pressable>)}
        </View>
      </View>
    </Modal>
  </View>;
}

const actions: { section: NeighborhoodSection; title: string; copy: string; tint: string; kicker: string }[] = [
  { section: 'servicios', title: 'Talento a la vuelta\nde la esquina.', copy: 'Descubre servicios y productos de tus vecinos.', tint: '#E8EEDF', kicker: '01 / SERVICIOS' },
  { section: 'favores', title: 'Hoy por ti.\nMañana por mí.', copy: 'Presta, intercambia y encuentra una mano amiga.', tint: '#F3E6D6', kicker: '02 / CADENA DE FAVORES' },
  { section: 'mapa', title: 'Explora lo\nque tienes cerca.', copy: 'Ubica los servicios disponibles en el mapa.', tint: '#E3ECEE', kicker: '03 / TU ENTORNO' },
];

export function NeighborhoodHome({ communityName, onNavigate, children }: { communityName: string | null; onNavigate: (section: NeighborhoodSection) => void; children?: ReactNode }) {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  return <ScrollView contentContainerStyle={s.homeScroll}><View style={s.homeInner}>
    <View style={s.headingRow}><View><Text style={s.eyebrow}>BIENVENIDO A TU RED</Text><Text accessibilityRole="header" style={s.pageTitle}>{communityName ?? 'Aquí empieza la comunidad.'}</Text></View><Text style={s.smallPill}>JUNTOS, MÁS CERCA</Text></View>
    <View style={[s.hero, wide && { flexDirection: 'row', alignItems: 'center' }]}>
      <View style={s.heroCopy}><Text style={s.heroKicker}>EL VALOR DE SER VECINOS</Text><Text style={s.heroTitle}>Las mejores conexiones{"\n"}empiezan cerca.</Text><Text style={s.heroDescription}>Un servicio que buscabas. Eso que puedes prestar.{"\n"}Una comunidad que se da la mano.</Text><Pressable accessibilityRole="button" onPress={() => onNavigate('servicios')} style={({ pressed }) => [s.heroButton, pressed && s.hover]}><Text style={s.heroButtonText}>Descubrir servicios  →</Text></Pressable></View>
      <NeighborhoodArt />
    </View>
    <View style={s.sectionHeading}><Text accessibilityRole="header" style={s.sectionTitle}>¿Qué hacemos hoy?</Text><Text style={s.location}>Cada conexión cuenta</Text></View>
    <View style={[s.actionGrid, wide && { flexDirection: 'row' }]}>{actions.map(item => <Pressable key={item.section} accessibilityRole="button" onPress={() => onNavigate(item.section)} style={({ pressed, hovered }) => [s.actionCard, { backgroundColor: item.tint }, wide && { flex: 1 }, (pressed || hovered) && s.hover]}><AppIcon name={item.section === 'servicios' ? 'services' : item.section === 'favores' ? 'people' : 'map'} size={28} color={colors.primary} /><Text style={[s.actionKicker, { marginTop: 14 }]}>{item.kicker}</Text><Text style={s.actionTitle}>{item.title}</Text><Text style={s.actionCopy}>{item.copy}</Text><Text style={s.actionArrow}>Explorar  ↗</Text></Pressable>)}</View>
    <View style={s.helpStrip}><View style={{ flex: 1 }}><Text style={s.noteTitle}>Cuando más importa, estamos cerca.</Text><Text style={s.noteCopy}>Consulta alertas, reporta una emergencia o encuentra recursos de apoyo.</Text></View><Pressable accessibilityRole="button" onPress={() => onNavigate('emergencias')} style={s.emergency}><Text style={s.emergencyText}>Ver apoyo →</Text></Pressable></View>
    <Text accessibilityRole="header" style={s.sectionTitle}>Tu comunidad empieza contigo</Text>{children}
  </View></ScrollView>;
}

const s = StyleSheet.create({
  createSlot: { flex: 1, alignItems: 'center', minHeight: 60 },
  createButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: -22, elevation: 6, shadowColor: '#123F33', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.24, shadowRadius: 9 },
  desktopCreate: { backgroundColor: colors.primary, borderRadius: 16, minHeight: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  createLabel: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  modalRoot: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(14,34,27,0.45)' },
  createSheet: { width: '100%', maxWidth: 560, backgroundColor: '#FFFEFA', padding: 24, paddingBottom: 36, borderTopLeftRadius: 28, borderTopRightRadius: 28, gap: 10 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  closeButton: { marginLeft: 'auto', minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  createOption: { paddingVertical: 16, paddingHorizontal: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  shell: { flex: 1, backgroundColor: colors.surface }, main: { flex: 1, minWidth: 0 }, content: { flex: 1, minHeight: 0, width: '100%', maxWidth: 1280, alignSelf: 'center' },
  sidebar: { width: 250, padding: 26, backgroundColor: '#FFFEFA', borderRightWidth: 1, borderColor: colors.border },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brandName: { fontSize: 23, fontWeight: '800', color: colors.text, letterSpacing: -1 }, brandCaption: { fontSize: 8, letterSpacing: 1.5, color: colors.textMuted, marginTop: 3 },
  brandMark: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }, roof: { width: 15, height: 15, borderLeftWidth: 2, borderTopWidth: 2, borderColor: '#fff', transform: [{ rotate: '45deg' }], marginTop: 8 }, door: { position: 'absolute', bottom: 7, width: 12, height: 10, borderWidth: 2, borderTopWidth: 0, borderColor: '#fff' },
  sideCaption: { fontSize: 10, letterSpacing: 1.7, color: colors.textMuted, marginTop: 54, marginBottom: 18 }, sideLinks: { gap: 9 }, bottomLinks: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFEFA', padding: 6, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === 'ios' ? 26 : 10, borderTopWidth: 1, borderColor: colors.border }, navItem: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 9 }, sideItem: { flexDirection: 'row', paddingHorizontal: 14, justifyContent: 'flex-start' }, bottomItem: { flex: 1, paddingHorizontal: 2, gap: 5, minHeight: 60 }, selected: { backgroundColor: '#DFEDE4' }, selectedText: { color: colors.primary, fontWeight: '800' }, navNumber: { fontSize: 11, color: colors.textMuted }, navLabel: { fontSize: 15, color: colors.text, fontWeight: '500' }, mobileLabel: { fontSize: 11, textAlign: 'center' }, activeDot: { width: 4, height: 4, backgroundColor: colors.primary, borderRadius: 2 }, hover: { opacity: 0.72 },
  sideNote: { marginTop: 'auto', paddingTop: 40, paddingBottom: 24 }, noteTitle: { fontSize: 17, fontWeight: '700', color: colors.text, lineHeight: 24 }, noteCopy: { fontSize: 14, color: colors.textMuted, lineHeight: 22, marginTop: 6 }, sideFooter: { fontSize: 9, letterSpacing: 1.4, color: colors.textMuted },
  topbar: { minHeight: 84, paddingHorizontal: 32, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFEFA', borderBottomWidth: 1, borderColor: colors.border }, topLabel: { fontSize: 20, fontWeight: '700', color: colors.text }, location: { fontSize: 13, color: colors.textMuted, marginTop: 4 }, emergency: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 24, backgroundColor: colors.dangerSurface }, emergencyText: { fontSize: 12, color: colors.danger, fontWeight: '700' },
  homeScroll: { flexGrow: 1, padding: 20 }, homeInner: { width: '100%', maxWidth: 1160, alignSelf: 'center', gap: 24 }, headingRow: { gap: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }, eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: colors.primary, marginBottom: 10 }, pageTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, color: colors.text }, smallPill: { color: colors.primary, fontSize: 9, letterSpacing: 1.2, backgroundColor: '#E3ECDD', borderRadius: 20, padding: 10 },
  hero: { backgroundColor: '#123F33', borderRadius: 28, overflow: 'hidden', padding: 28 }, heroCopy: { flex: 1, minWidth: 0 }, heroKicker: { color: '#C9DCA8', fontSize: 10, letterSpacing: 1.8, marginBottom: 16 }, heroTitle: { fontSize: 34, fontWeight: '700', letterSpacing: -1, color: '#FFF9E9', lineHeight: 40 }, heroDescription: { color: '#D0DED4', fontSize: 15, lineHeight: 24, marginVertical: 18 }, heroButton: { backgroundColor: '#D8EDAA', borderRadius: 24, minHeight: 48, justifyContent: 'center', paddingHorizontal: 20, alignSelf: 'flex-start' }, heroButtonText: { fontSize: 14, fontWeight: '700', color: '#173E31' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }, sectionTitle: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.5 }, actionGrid: { gap: 16 }, actionCard: { padding: 24, borderRadius: 22, minHeight: 240 }, actionKicker: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.3, fontWeight: '600' }, actionTitle: { fontSize: 25, lineHeight: 30, fontWeight: '700', letterSpacing: -0.6, color: colors.text, marginTop: 25 }, actionCopy: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 12, marginBottom: 22 }, actionArrow: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: 'auto' }, helpStrip: { padding: 22, borderRadius: 20, backgroundColor: '#FFFEFA', borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  story: { padding: 28, backgroundColor: '#E7EDDE', borderRadius: 28, gap: 20, width: '100%' }, storyTitle: { fontSize: 48, lineHeight: 53, letterSpacing: -2, fontWeight: '700', color: '#143F32' }, storyCopy: { color: '#4A6355', fontSize: 17, lineHeight: 27, maxWidth: 400 }, storyFooter: { borderTopWidth: 1, borderColor: '#C8D4BE', paddingTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, storyFooterText: { fontSize: 12, color: '#435D4E' },
  art: { width: 290, maxWidth: '100%', height: 215, alignSelf: 'center', overflow: 'hidden', marginTop: 20 }, sun: { position: 'absolute', right: 28, top: 6, width: 58, height: 58, borderRadius: 29, backgroundColor: '#F1CC83' }, ground: { position: 'absolute', bottom: -110, left: -20, width: 350, height: 180, borderRadius: 180, backgroundColor: '#658F68' }, house: { position: 'absolute', width: 66, height: 96, borderRadius: 4 }, houseRoof: { width: 53, height: 53, position: 'absolute', top: -26, left: 6, transform: [{ rotate: '45deg' }], borderRadius: 4 }, window: { backgroundColor: '#FFF5D5', width: 15, height: 20, position: 'absolute', top: 18, left: 13, borderWidth: 3, borderColor: '#456858' }, houseDoor: { position: 'absolute', bottom: 0, left: 27, height: 33, width: 20, backgroundColor: '#315548', borderTopLeftRadius: 10, borderTopRightRadius: 10 }, tree: { position: 'absolute', bottom: 28, width: 5, height: 64, backgroundColor: '#D4A57A' }, crown: { position: 'absolute', top: -27, left: -16, width: 38, height: 66, borderRadius: 30, backgroundColor: '#81A87B' },
});
