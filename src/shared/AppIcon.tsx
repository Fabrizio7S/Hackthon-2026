import { View } from 'react-native';

type Point = readonly [number, number];
type Path = readonly Point[];
type Circle = readonly [number, number, number];
type Glyph = { paths: readonly Path[]; circles?: readonly Circle[] };

/** Puntos de un arco (grados; 0 = derecha, 90 = abajo) en la rejilla de 24. */
function arc(cx: number, cy: number, r: number, from: number, to: number, steps = 12): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((from + (to - from) * (i / steps)) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });
}

/** Rectángulo con extremos redondos (eslabón). */
function stadium(x: number, y: number, w: number, h: number): Point[] {
  const r = h / 2;
  return [[x + r, y], [x + w - r, y], ...arc(x + w - r, y + r, r, -90, 90, 8), [x + r, y + h], ...arc(x + r, y + r, r, 90, 270, 8)];
}

function rect(x: number, y: number, w: number, h: number): Point[] {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
}

function star(): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= 10; i++) {
    const r = i % 2 === 0 ? 8.5 : 3.8;
    const a = ((-90 + 36 * i) * Math.PI) / 180;
    pts.push([12 + r * Math.cos(a), 12.6 + r * Math.sin(a)]);
  }
  return pts;
}

const g = {
  home: { paths: [[[4, 10.5], [12, 4], [20, 10.5], [20, 20], [14.5, 20], [14.5, 15.5], ...arc(12, 15.5, 2.5, 0, -180, 8), [9.5, 20], [4, 20], [4, 10.5]]] },
  map: { paths: [[[3.5, 6], [9, 4], [15, 6], [20.5, 4], [20.5, 18], [15, 20], [9, 18], [3.5, 20], [3.5, 6]], [[9, 4], [9, 18]], [[15, 6], [15, 20]]] },
  chain: { paths: [stadium(2.5, 8.5, 11, 7), stadium(10.5, 8.5, 11, 7)] },
  person: { paths: [arc(12, 21, 7, 180, 360, 12)], circles: [[12, 8.5, 3.5]] },
  people: { paths: [arc(9, 20.5, 5.5, 180, 360, 10), arc(17, 20.5, 4, 225, 360, 8)], circles: [[9, 9, 3], [16.5, 9, 2.4]] },
  plus: { paths: [[[12, 5], [12, 19]], [[5, 12], [19, 12]]] },
  close: { paths: [[[6, 6], [18, 18]], [[18, 6], [6, 18]]] },
  alert: { paths: [[[12, 4], [21, 20], [3, 20], [12, 4]], [[12, 10], [12, 14]], [[12, 16.8], [12, 17]]] },
  services: { paths: [rect(3.5, 9, 17, 10.5), [[9, 9], [9, 6], [15, 6], [15, 9]], [[3.5, 13.5], [20.5, 13.5]], [[12, 12.3], [12, 14.7]]] },
  arrow: { paths: [[[5, 12], [19, 12]], [[13, 6], [19, 12], [13, 18]]] },
  siren: { paths: [[[7, 18], [7, 13], ...arc(12, 13, 5, 180, 360, 10), [17, 18]], rect(5, 18, 14, 2.5), [[12, 3], [12, 5]], [[4.2, 6.2], [5.6, 7.6]], [[19.8, 6.2], [18.4, 7.6]]] },
  pin: { paths: [[[12, 21], ...arc(12, 10, 6, 135, 405, 18), [12, 21]]], circles: [[12, 10, 2.2]] },
  search: { paths: [[[15.5, 15.5], [20, 20]]], circles: [[11, 11, 6]] },
  bell: { paths: [[[6, 16.5], [6, 11], ...arc(12, 11, 6, 180, 360, 10), [18, 16.5], [19.5, 18], [4.5, 18], [6, 16.5]], arc(12, 20, 2, 180, 0, 6)] },
  phone: { paths: [[[5, 4], [8.5, 4], [10, 8], [8, 9.3], [10.5, 13.5], [14.7, 16], [16, 14], [20, 15.5], [20, 19], [18.5, 20], [13, 19], [8.5, 16.5], [5.5, 13], [4, 8], [4, 5], [5, 4]]] },
  chat: { paths: [[...arc(12, 11.5, 7.5, 145, 485, 22), [4, 20.5], arc(12, 11.5, 7.5, 145, 145, 1)[0]]] },
  drop: { paths: [[[12, 3.5], ...arc(12, 14, 6, -25, 205, 16), [12, 3.5]]] },
  pulse: { paths: [[[3.5, 12], [7.5, 12], [9.5, 8], [12.5, 16], [14.5, 12], [20.5, 12]]] },
  bolt: { paths: [[[13, 3], [5, 13.5], [11, 13.5], [10, 21], [18, 10.5], [12, 10.5], [13, 3]]] },
  bowl: { paths: [[[4, 11], [20, 11], ...arc(12, 11, 8, 0, 180, 14)], [[9, 4.5], [9, 7.5]], [[12, 3.5], [12, 7.5]], [[15, 4.5], [15, 7.5]]] },
  support: { paths: [[[12, 3.5], [19, 6], [19, 11.5], [17.5, 16], [12, 20.5], [6.5, 16], [5, 11.5], [5, 6], [12, 3.5]], [[12, 9], [12, 14]], [[9.5, 11.5], [14.5, 11.5]]] },
  verified: { paths: [[[12, 3.5], [19, 6], [19, 11.5], [17.5, 16], [12, 20.5], [6.5, 16], [5, 11.5], [5, 6], [12, 3.5]], [[9, 12], [11, 14], [15, 10]]] },
  aid: { paths: [rect(4, 7, 16, 12), [[9, 7], [9, 5], [15, 5], [15, 7]], [[12, 10], [12, 16]], [[9, 13], [15, 13]]] },
  extinguisher: { paths: [rect(9, 8, 6, 12.5), [[12, 8], [12, 5]], [[10, 5], [16, 5], [17.5, 7]]] },
  key: { paths: [[[11.5, 12], [20, 12]], [[17, 12], [17, 15]], [[20, 12], [20, 14]]], circles: [[8, 12, 3.5]] },
  copy: { paths: [rect(8, 8, 12, 12), [[16, 8], [16, 4], [4, 4], [4, 16], [8, 16]]] },
  lock: { paths: [rect(5, 10.5, 14, 10), [[8, 10.5], [8, 8], ...arc(12, 8, 4, 180, 360, 10), [16, 10.5]]] },
  check: { paths: [[[5, 12.5], [9.5, 17], [19, 7.5]]] },
  back: { paths: [[[15, 6], [9, 12], [15, 18]]] },
  chevron: { paths: [[[9, 6], [15, 12], [9, 18]]] },
  bookmark: { paths: [[[6.5, 4], [17.5, 4], [17.5, 20.5], [12, 16.5], [6.5, 20.5], [6.5, 4]]] },
  heart: { paths: [[[12, 20], ...arc(8.5, 9.5, 3.8, 135, 315, 10), [12, 8.4], ...arc(15.5, 9.5, 3.8, 225, 405, 10), [12, 20]]] },
  box: { paths: [[[4, 8], [12, 4], [20, 8], [20, 17], [12, 21], [4, 17], [4, 8]], [[4, 8], [12, 12], [20, 8]], [[12, 12], [12, 21]]] },
  swap: { paths: [[[4, 8.5], [18, 8.5]], [[15, 5], [18.5, 8.5], [15, 12]], [[20, 15.5], [6, 15.5]], [[9, 12], [5.5, 15.5], [9, 19]]] },
  locate: { paths: [[[12, 2.5], [12, 5]], [[12, 19], [12, 21.5]], [[2.5, 12], [5, 12]], [[19, 12], [21.5, 12]]], circles: [[12, 12, 7], [12, 12, 2]] },
  edit: { paths: [[[4, 20], [8, 20], [19, 9], [15, 5], [4, 16], [4, 20]], [[13.5, 6.5], [17.5, 10.5]]] },
  logout: { paths: [[[14, 4], [18, 4], [20, 6], [20, 18], [18, 20], [14, 20]], [[10, 16], [6, 12], [10, 8]], [[6, 12], [16, 12]]] },
  clock: { paths: [[[12, 8], [12, 12.5], [15, 14]]], circles: [[12, 12, 8]] },
  send: { paths: [[[4, 12], [20, 4], [15, 20], [12, 13], [4, 12]], [[12, 13], [20, 4]]] },
  bag: { paths: [[[5, 8], [19, 8], [18, 20], [6, 20], [5, 8]], arc(12, 8, 3, 180, 360, 8)] },
  refresh: { paths: [arc(12, 12, 7, -60, 250, 18), [[15.5, 2.8], [15.5, 5.9], [18.6, 5.9]]] },
  mail: { paths: [rect(3.5, 6, 17, 12), [[3.5, 6.5], [12, 13], [20.5, 6.5]]] },
  star: { paths: [star()] },
  camera: { paths: [[[3.5, 7.5], [8, 7.5], [9.5, 5], [14.5, 5], [16, 7.5], [20.5, 7.5], [20.5, 19], [3.5, 19], [3.5, 7.5]]], circles: [[12, 13, 3.5]] },
  filter: { paths: [[[4, 7], [14, 7]], [[18, 7], [20, 7]], [[4, 17], [6, 17]], [[10, 17], [20, 17]]], circles: [[16, 7, 2], [8, 17, 2]] },
} satisfies Record<string, Glyph>;

export type IconName = keyof typeof g;

/**
 * Iconos lineales del sistema: trazo 1.8, puntas redondas, rejilla de 24.
 * Se dibujan con vistas nativas, sin fuentes, SVG ni descargas externas.
 */
export function AppIcon({ name, size = 24, color = '#5F6E65', weight = 1.8 }: { name: IconName; size?: number; color?: string; weight?: number }) {
  const scale = size / 24;
  const stroke = weight * scale;
  const glyph: Glyph = g[name];
  return <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ width: size, height: size }}>
    {glyph.paths.flatMap((path, p) => path.slice(1).map(([x2, y2], i) => {
      const [x1, y1] = path[i];
      const length = Math.hypot(x2 - x1, y2 - y1) * scale;
      if (length === 0 && i > 0) return null;
      return <View key={`${p}:${i}`} style={{ position: 'absolute', backgroundColor: color, borderRadius: stroke,
        width: length + stroke, height: stroke, left: (x1 + x2) * scale / 2 - (length + stroke) / 2,
        top: (y1 + y2) * scale / 2 - stroke / 2, transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }] }} />;
    }))}
    {glyph.circles?.map(([x, y, radius], i) => <View key={`circle:${i}`} style={{ position: 'absolute', left: (x - radius) * scale - stroke / 2, top: (y - radius) * scale - stroke / 2,
      width: radius * 2 * scale + stroke, height: radius * 2 * scale + stroke, borderRadius: radius * scale + stroke, borderWidth: stroke, borderColor: color }} />)}
  </View>;
}
