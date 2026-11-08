// Paleta del módulo de mapa, alineada con src/shared/theme.ts («papel, bosque y teja»).
export const colors = {
  // Identidad principal de la red vecinal
  primary: '#216349',

  // Fondos
  background: '#FFFDF7',

  // Textos
  text: {
    primary: '#203D32',
    secondary: '#3B5247',
    muted: '#5F6E65',
    description: '#4B5E53',
    dark: '#203D32',
    inverse: '#FFFFFF',
  },

  // Estados y categorías
  category: {
    servicio: '#216349',
    producto: '#9A4524',
    emergencia: '#B8332A',
    recurso: '#2D5B68',
  },

  // Elementos deshabilitados
  disabled: '#8A968D',

  // Sombras
  shadow: '#123F33',
} as const;
