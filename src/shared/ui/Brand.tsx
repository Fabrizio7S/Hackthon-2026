import { Text, View } from 'react-native';
import { colors } from '../theme';
import { s } from '../theme/neighborhood.styles';

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <View style={s.brand}>
      <View accessible={false} style={[s.brandMark, inverse && { backgroundColor: colors.lime }]}>
        <View style={[s.brandDoor, inverse && { backgroundColor: colors.primaryDeep }]} />
      </View>
      <Text style={[s.brandName, inverse && { color: colors.onDeep }]}>
        Red vecinal<Text style={{ color: inverse ? '#E59A72' : colors.clay }}>.</Text>
      </Text>
    </View>
  );
}
