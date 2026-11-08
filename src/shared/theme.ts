// Paleta compartida de la aplicación vecinal, alineada con la guía visual.
export const colors = {
  // Modo normal
  primary: '#216349', // Botones y acciones principales
  primarySurface: '#E4EEE3', // Fondos suaves de tarjetas y etiquetas
  onPrimary: '#FFFFFF',

  // Modo emergencia
  danger: '#A8342C', // Alertas, urgencias
  dangerSurface: '#FBECE6',
  onDanger: '#FFFFFF',

  // Estados y valoraciones
  warning: '#F2B705',
  warningSurface: '#FFF9E6',
  star: '#F5B400',

  // Neutros
  text: '#203D32',
  textMuted: '#607066',
  border: '#D9E1D5',
  surface: '#F5F4ED',
  background: '#FFFFFF',
} as const;
