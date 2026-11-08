import { View } from 'react-native';

export type IconName = 'home' | 'map' | 'people' | 'person' | 'plus' | 'close' | 'alert' | 'services' | 'arrow';
type Point = readonly [number, number];
const paths: Record<IconName, readonly (readonly Point[])[]> = {
  home: [[[3, 10], [12, 3], [21, 10], [21, 21], [15, 21], [15, 14], [9, 14], [9, 21], [3, 21], [3, 10]]],
  map: [[[3, 5], [9, 3], [15, 6], [21, 3], [21, 19], [15, 22], [9, 19], [3, 21], [3, 5]], [[9, 3], [9, 19]], [[15, 6], [15, 22]]],
  people: [[[3, 21], [3, 18], [5, 15], [10, 15], [13, 18], [13, 21]], [[14, 14], [18, 14], [21, 17], [21, 20]]],
  person: [[[4, 22], [4, 18], [7, 14], [17, 14], [20, 18], [20, 22]]],
  plus: [[[12, 4], [12, 20]], [[4, 12], [20, 12]]],
  close: [[[5, 5], [19, 19]], [[5, 19], [19, 5]]],
  alert: [[[12, 3], [22, 21], [2, 21], [12, 3]], [[12, 9], [12, 14]], [[12, 17], [12, 17.5]]],
  services: [[[3, 8], [21, 8], [21, 21], [3, 21], [3, 8]], [[8, 8], [8, 3], [16, 3], [16, 8]], [[3, 13], [21, 13]], [[12, 12], [12, 15]]],
  arrow: [[[4, 12], [20, 12]], [[14, 6], [20, 12], [14, 18]]],
};
const circles: Partial<Record<IconName, readonly (readonly [number, number, number])[]>> = {
  person: [[12, 7, 4]], people: [[8, 7, 3.5], [17, 8, 2.5]],
};

/** Iconos lineales nativos escalables, sin fuentes ni descargas externas. */
export function AppIcon({ name, size = 24, color = '#52655C' }: { name: IconName; size?: number; color?: string }) {
  const scale = size / 24;
  const stroke = 1.8 * scale;
  return <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ width: size, height: size }}>
    {paths[name].flatMap((path, p) => path.slice(1).map(([x2, y2], i) => {
      const [x1, y1] = path[i];
      const length = Math.hypot(x2 - x1, y2 - y1) * scale;
      return <View key={`${p}:${i}`} style={{ position: 'absolute', backgroundColor: color, borderRadius: stroke,
        width: length + stroke, height: stroke, left: (x1 + x2) * scale / 2 - (length + stroke) / 2,
        top: (y1 + y2) * scale / 2 - stroke / 2, transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }] }} />;
    }))}
    {circles[name]?.map(([x, y, radius], i) => <View key={`circle:${i}`} style={{ position: 'absolute', left: (x - radius) * scale, top: (y - radius) * scale,
      width: radius * 2 * scale, height: radius * 2 * scale, borderRadius: radius * scale, borderWidth: stroke, borderColor: color }} />)}
  </View>;
}
