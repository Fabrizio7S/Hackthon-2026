import { Text, useWindowDimensions, View } from 'react-native';
import { Brand } from '../../../shared/ui/Brand';
import { NeighborhoodArt } from '../../../shared/ui/NeighborhoodArt';
import { s } from '../../../shared/theme/neighborhood.styles';

export function WelcomeStory() {
  const { width } = useWindowDimensions();
  return (
    <View style={[s.story, width >= 900 && { flex: 1, maxWidth: 560 }]}>
      <View style={[s.storyInner, width < 600 && { padding: 20 }]}>
        <Brand inverse />
        <Text style={s.storyEyebrow}>TU BARRIO. TU GENTE.</Text>
        <Text style={[s.storyTitle, width < 600 && { fontSize: 30, lineHeight: 33 }]}>
          Un pequeño gesto.{'\n'}Un barrio más unido.
        </Text>
        <Text style={[s.storyCopy, width < 600 && { fontSize: 14, lineHeight: 21 }]}>
          Encuentra lo que necesitas, comparte lo que tienes y conecta con quienes viven cerca.
        </Text>
      </View>
      <NeighborhoodArt height={width < 600 ? 84 : 130} />
    </View>
  );
}
