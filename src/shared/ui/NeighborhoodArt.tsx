import { View } from 'react-native';
import { colors } from '../theme';
import { s } from '../theme/neighborhood.styles';

export function NeighborhoodArt({ height = 104 }: { height?: number }) {
  const houses = [
    { flex: 1, h: 0.68, bg: '#E5B484' },
    { flex: 1.3, h: 1, bg: colors.lime, door: true },
    { flex: 0.8, h: 0.56, bg: '#9CBDA3' },
    { flex: 1.1, h: 0.82, bg: '#FFF0CB', window: true },
    { flex: 0.9, h: 0.62, bg: '#E59A72' },
  ];
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[s.art, { height }]}
    >
      {houses.map((house, i) => (
        <View
          key={i}
          style={{
            flex: house.flex,
            height: height * house.h,
            backgroundColor: house.bg,
            borderTopLeftRadius: 999,
            borderTopRightRadius: 999,
            alignItems: 'center',
            justifyContent: house.door ? 'flex-end' : 'flex-start',
          }}
        >
          {house.door && (
            <View
              style={{
                width: height * 0.24,
                height: height * 0.34,
                backgroundColor: colors.primaryDeep,
                borderTopLeftRadius: 99,
                borderTopRightRadius: 99,
              }}
            />
          )}
          {house.window && (
            <View
              style={{
                marginTop: height * 0.22,
                width: height * 0.16,
                height: height * 0.2,
                backgroundColor: '#2C7657',
                borderTopLeftRadius: 99,
                borderTopRightRadius: 99,
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2,
              }}
            />
          )}
        </View>
      ))}
    </View>
  );
}
