import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../../shared/theme';
import { AppIcon } from '../../shared/ui/AppIcon';
import { s } from '../../shared/theme/neighborhood.styles';
import type { CreateAction } from '../../shared/navigation/contracts';

export function CreatePublicationSheet({
  createOpen,
  setCreateOpen,
  onCreate,
  height,
  compact,
}: {
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  onCreate: (action: CreateAction) => void;
  height: number;
  compact: boolean;
}) {
  return (
    <Modal
      visible={createOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setCreateOpen(false)}
    >
      <View style={s.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar opciones de publicación"
          style={s.backdrop}
          onPress={() => setCreateOpen(false)}
        />
        <View
          accessibilityViewIsModal
          style={[
            s.createSheet,
            { maxHeight: height - (compact ? 8 : 48) },
            compact && s.createSheetCompact,
          ]}
        >
          {!compact && <View style={s.sheetHandle} />}
          <View style={s.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text accessibilityRole="header" style={s.sheetTitle}>
                ¿Qué quieres compartir?
              </Text>
              <Text style={s.noteCopy}>Elige una opción para comenzar.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={() => setCreateOpen(false)}
              style={s.closeButton}
            >
              <AppIcon name="close" size={18} color={colors.text} weight={2} />
            </Pressable>
          </View>
          <ScrollView
            style={s.sheetScroll}
            contentContainerStyle={{ gap: compact ? 8 : 12 }}
            showsVerticalScrollIndicator={false}
          >
            {(
              [
                {
                  action: 'service',
                  icon: 'services',
                  title: 'Servicio o producto',
                  copy: 'Ofrece tu oficio o algo que vendes.',
                  tint: colors.primarySurface,
                  ink: colors.primary,
                },
                {
                  action: 'favor',
                  icon: 'chain',
                  title: 'Préstamo o intercambio',
                  copy: 'Comparte algo sin dinero de por medio.',
                  tint: colors.claySurface,
                  ink: colors.clay,
                },
                {
                  action: 'emergency',
                  icon: 'siren',
                  title: 'Reportar una emergencia',
                  copy: 'Avisa a tu comunidad y pide apoyo.',
                  tint: colors.dangerDeep,
                  ink: colors.onDanger,
                },
              ] as const
            ).map((item) => {
              const urgent = item.action === 'emergency';
              return (
                <Pressable
                  key={item.action}
                  accessibilityRole="button"
                  onPress={() => {
                    setCreateOpen(false);
                    onCreate(item.action);
                  }}
                  style={({ pressed, hovered }) => [
                    s.createOption,
                    urgent && s.createOptionUrgent,
                    (pressed || hovered) && s.pressed,
                  ]}
                >
                  <View style={[s.optionArch, { backgroundColor: item.tint }]}>
                    <AppIcon name={item.icon} size={26} color={item.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.optionTitle, urgent && { color: colors.onDanger }]}>
                      {item.title}
                    </Text>
                    <Text style={[s.optionCopy, urgent && { color: '#FBDCD3' }]}>{item.copy}</Text>
                  </View>
                  <AppIcon
                    name="chevron"
                    size={18}
                    color={urgent ? colors.onDanger : colors.textMuted}
                    weight={2}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
