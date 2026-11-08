import { type ReactNode } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { colors } from '../../shared/theme';
import { AppIcon, type IconName } from '../../shared/ui/AppIcon';
import { type NeighborhoodSection } from '../../shared/navigation/contracts';
import { NeighborhoodArt } from '../../shared/ui/NeighborhoodArt';
import { s } from '../../shared/theme/neighborhood.styles';

export const doors: {
  section: NeighborhoodSection;
  label: string;
  copy: string;
  icon: IconName;
  tint: string;
  ink: string;
}[] = [
  {
    section: 'servicios',
    label: 'Servicios',
    copy: 'Oficios y productos de tus vecinos.',
    icon: 'services',
    tint: colors.primarySurface,
    ink: colors.primary,
  },
  {
    section: 'favores',
    label: 'Favores',
    copy: 'Presta, intercambia, pide una mano.',
    icon: 'chain',
    tint: colors.claySurface,
    ink: colors.clay,
  },
  {
    section: 'mapa',
    label: 'Mapa',
    copy: 'Lo disponible, cuadra por cuadra.',
    icon: 'pin',
    tint: colors.riverSurface,
    ink: colors.river,
  },
  {
    section: 'emergencias',
    label: 'Emergencias',
    copy: 'Alertas, recursos y brigadas.',
    icon: 'support',
    tint: colors.dangerSurface,
    ink: colors.danger,
  },
];

export function NeighborhoodHome({
  communityName,
  role = null,
  onNavigate,
  children,
  onShowTutorial,
}: {
  communityName: string | null;
  role?: 'representative' | 'member' | null;
  onNavigate: (section: NeighborhoodSection) => void;
  children?: ReactNode;
  onShowTutorial?: () => void;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  return (
    <ScrollView contentContainerStyle={[s.homeScroll, !wide && { padding: 16, paddingBottom: 28 }]}>
      <View style={s.homeInner}>
        <View style={s.plaque}>
          <View style={[s.plaqueInner, wide && { flexDirection: 'row', alignItems: 'flex-end' }]}>
            <View
              style={[{ gap: 8 }, wide ? { flex: 1, paddingBottom: 28 } : { paddingBottom: 18 }]}
            >
              <View style={s.plaqueRow}>
                <Text style={s.plaqueEyebrow}>COMUNIDAD VECINAL</Text>
                {communityName && role && (
                  <Text style={s.plaqueBadge}>
                    {role === 'representative' ? 'REPRESENTANTE' : 'INTEGRANTE'}
                  </Text>
                )}
              </View>
              <Text
                accessibilityRole="header"
                style={[s.plaqueTitle, wide && { fontSize: 50, lineHeight: 50 }]}
              >
                {communityName ?? 'Aquí empieza la comunidad.'}
              </Text>
              <Text style={s.plaqueCopy}>
                {communityName
                  ? 'Un servicio que buscabas, algo que puedes prestar, una mano cuando hace falta. Todo a pocas cuadras.'
                  : 'Únete o crea tu comunidad para empezar a compartir con tus vecinos.'}
              </Text>
              {wide && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onNavigate('servicios')}
                  style={({ pressed }) => [s.plaqueButton, pressed && s.pressed]}
                >
                  <Text style={s.plaqueButtonText}>Descubrir servicios</Text>
                  <AppIcon name="arrow" size={16} color={colors.primaryDeep} weight={2.2} />
                </Pressable>
              )}
            </View>
            {wide && (
              <View style={{ flex: 1, maxWidth: 380 }}>
                <NeighborhoodArt height={170} />
              </View>
            )}
          </View>
        </View>

        <View accessibilityRole="menu" style={[s.doors, wide && { gap: 16 }]}>
          {doors.map((door) => (
            <Pressable
              key={door.section}
              accessibilityRole="button"
              accessibilityLabel={door.label}
              onPress={() => onNavigate(door.section)}
              style={({ pressed, hovered }) => [s.door, (pressed || hovered) && s.pressed]}
            >
              <View
                style={[
                  s.doorArch,
                  { backgroundColor: door.tint },
                  wide && { height: 150, paddingTop: 30, justifyContent: 'flex-start' },
                ]}
              >
                <View style={wide ? [s.doorBadge, { backgroundColor: door.ink }] : null}>
                  <AppIcon
                    name={door.icon}
                    size={wide ? 26 : 28}
                    color={
                      wide
                        ? door.section === 'servicios'
                          ? colors.lime
                          : colors.onDanger
                        : door.ink
                    }
                    weight={1.7}
                  />
                </View>
                {wide && <Text style={s.doorTitle}>{door.label}</Text>}
                {wide && <Text style={s.doorCopy}>{door.copy}</Text>}
              </View>
              {!wide && <Text style={s.doorLabel}>{door.label}</Text>}
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver emergencias y apoyo"
          onPress={() => onNavigate('emergencias')}
          style={({ pressed }) => [s.helpStrip, pressed && s.pressed]}
        >
          <View style={s.pulseDot} />
          <View style={{ flex: 1 }}>
            <Text style={s.helpTitle}>Cuando más importa, estamos cerca.</Text>
            <Text style={s.helpCopy}>
              Consulta alertas, reporta una emergencia o encuentra recursos de apoyo.
            </Text>
          </View>
          <AppIcon name="chevron" size={18} color={colors.danger} weight={2} />
        </Pressable>

        {onShowTutorial && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver recorrido de ayuda"
            onPress={onShowTutorial}
            style={s.tutorialLink}
          >
            <AppIcon name="support" size={22} color={colors.primary} />
            <Text style={s.tutorialLinkText}>Ver recorrido de ayuda</Text>
            <AppIcon name="arrow" size={18} color={colors.primary} />
          </Pressable>
        )}
        <Text accessibilityRole="header" style={s.sectionTitle}>
          Tu comunidad empieza contigo
        </Text>
        {children}
      </View>
    </ScrollView>
  );
}
