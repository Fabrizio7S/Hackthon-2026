import { Pressable, Text } from 'react-native';
import { AppIcon, type IconName } from '../../../shared/ui/AppIcon';
import { colors } from '../../../shared/theme';
import { styles } from '../styles/favors.styles';

export function Button({
  label,
  onPress,
  primary = false,
  selected,
  disabled = false,
  icon,
  iconAfter = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  selected?: boolean;
  disabled?: boolean;
  icon?: IconName;
  iconAfter?: boolean;
}) {
  const active = primary || selected;
  const glyph = icon ? (
    <AppIcon
      name={icon}
      size={16}
      color={active ? colors.onPrimary : colors.primary}
      weight={2.2}
    />
  ) : null;
  return (
    <Pressable
      accessibilityRole="button"
      aria-pressed={selected}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        (primary || selected) && styles.buttonActive,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {!iconAfter && glyph}
      <Text style={[styles.buttonText, active && styles.buttonTextActive]}>{label}</Text>
      {iconAfter && glyph}
    </Pressable>
  );
}
