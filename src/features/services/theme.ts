// Paleta de G02 tomada de la imagen de referencia del equipo (VeciRed).
// Valores aproximados a ojo y ajustados para cumplir contraste AA (4.5:1)
// con texto blanco o sobre fondo blanco.
// Pendiente: acordar con Persona 5 si se mueve a src/shared/ para toda la app.

export const colors = {
  // Modo normal
  primary: '#18803A', // Botones y acciones principales («Solicitar préstamo»).
  primarySurface: '#E8F5E9', // Fondos suaves de tarjetas y accesos. Sobre él usar `text` (primary da 4.46:1, no AA).
  onPrimary: '#FFFFFF',

  // Modo emergencia
  danger: '#C62828', // Alertas, «Urgente», acciones de emergencia.
  dangerSurface: '#FDECEC',
  onDanger: '#FFFFFF',

  // Estados y valoraciones
  warning: '#F2B705', // Riesgo en seguimiento (solo iconos o fondos, no texto).
  star: '#F5B400', // Estrellas de calificación (solo iconos).

  // Neutros
  text: '#1B1B1B',
  textMuted: '#5F6368',
  border: '#DADCE0',
  background: '#FFFFFF',
} as const;
