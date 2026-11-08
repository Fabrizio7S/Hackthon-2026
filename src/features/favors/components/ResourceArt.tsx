import { Image, View } from 'react-native';
import { AppIcon } from '../../../shared/ui/AppIcon';
import { colors } from '../../../shared/theme';
import { type Publication } from '../model/types';
import { kindLook } from '../model/presentation';
import { styles } from '../styles/favors.styles';

export function ResourceArt({
  item,
  compact = false,
  inset = false,
}: {
  item: Publication;
  compact?: boolean;
  inset?: boolean;
}) {
  const look = kindLook(item.kind);
  return (
    <View
      accessible={false}
      style={[
        styles.art,
        { backgroundColor: look.tint },
        compact && [styles.artCompact, { borderRightColor: look.ink }],
        inset && styles.deckArt,
      ]}
    >
      {compact && !item.imageUri && <View style={[styles.tagHole, { borderColor: look.ink }]} />}
      {item.imageUri ? (
        <Image
          accessibilityLabel={`Imagen de ${item.title}`}
          source={{ uri: item.imageUri }}
          resizeMode="contain"
          style={styles.resourceImage}
        />
      ) : compact ? (
        <AppIcon name={look.icon} size={30} color={look.ink} weight={1.7} />
      ) : (
        <View style={[styles.artArch, { backgroundColor: look.ink }]}>
          <AppIcon name={look.icon} size={46} color={colors.lime} weight={1.5} />
        </View>
      )}
    </View>
  );
}
