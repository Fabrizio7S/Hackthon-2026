import { Platform } from 'react-native';

// Paleta compartida de la aplicación vecinal («papel, bosque y teja»).
// Las claves existentes se conservan para no romper los módulos que ya las usan.
export const colors = {
  // Modo normal
  primary: '#216349', // Botones y acciones principales
  primaryDeep: '#123F33', // Placas de comunidad y fondos oscuros
  primarySurface: '#E4EEE3', // Fondos suaves de tarjetas y etiquetas
  onPrimary: '#FFFFFF',
  lime: '#D8EDAA', // Acento sobre verde oscuro
  onDeep: '#FFF9E9',
  onDeepMuted: '#CFDDD3',

  // Favores y productos
  clay: '#9A4524',
  claySurface: '#F6E3D6',

  // Mapa y ubicación
  river: '#2D5B68',
  riverSurface: '#E1EAEC',

  // Modo emergencia
  danger: '#A8342C', // Alertas, urgencias
  dangerDeep: '#8E2A23',
  dangerInk: '#7A2A23',
  dangerSurface: '#FBECE6',
  dangerPaper: '#F7F0EA',
  dangerBorder: '#EAD9D1',
  onDanger: '#FFFFFF',

  // Estados y valoraciones
  warning: '#F2B705',
  warningInk: '#8A5A00',
  warningSurface: '#FFF6D6',
  star: '#F2B705',
  starInk: '#C98A00',

  // Neutros
  text: '#203D32',
  textMuted: '#5F6E65',
  border: '#DCE3D3',
  borderStrong: '#CBD5C4',
  surface: '#F4F1E8', // Fondo de papel
  background: '#FFFDF7', // Tarjetas
} as const;

/** Familias tipográficas. Sin fuentes descargadas: se usan las del sistema. */
export const fonts = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' }),
} as const;

/** Estilos de texto reutilizables del sistema visual. */
export const type = {
  // Título de pantalla: grotesca pesada con tracking cerrado.
  display: { fontWeight: '800', letterSpacing: -0.8, color: colors.text },
  // Rótulo en mayúsculas para tipos, distancias, códigos y estados.
  plate: { fontFamily: fonts.mono, fontWeight: '600', letterSpacing: 0.8, fontSize: 11 },
} as const;

/** Radio de «arco de puerta»: esquinas superiores redondas, inferiores suaves. */
export function archRadius(width: number, bottom = 8) {
  return { borderTopLeftRadius: width / 2, borderTopRightRadius: width / 2, borderBottomLeftRadius: bottom, borderBottomRightRadius: bottom };
}
