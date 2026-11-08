// Paleta compartida de la aplicación vecinal, alineada con la guía visual.
export const colors = {
  // Modo normal
  primary: '#18803A', // Botones y acciones principales
  primarySurface: '#E8F5E9', // Fondos suaves de tarjetas y etiquetas
  onPrimary: '#FFFFFF',

  // Modo emergencia
  danger: '#C62828', // Alertas, urgencias
  dangerSurface: '#FDECEC',
  onDanger: '#FFFFFF',

  // Estados y valoraciones
  warning: '#F2B705',
  warningSurface: '#FFF9E6',
  star: '#F5B400',

  // Neutros
  text: '#1B1B1B',
  textMuted: '#5F6368',
  border: '#DADCE0',
  surface: '#F8F9FA',
  background: '#FFFFFF',
} as const;
