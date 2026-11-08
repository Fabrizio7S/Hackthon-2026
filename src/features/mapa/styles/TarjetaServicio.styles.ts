
import { StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  tarjeta: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    right: 14,
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 18,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoria: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  cerrar: {
    padding: 5,
  },
  cerrarTexto: {
    fontSize: 18,
    color: colors.text.muted,
  },
  nombre: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 4,
  },
  distancia: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 5,
  },
  calificacion: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 7,
  },
  descripcion: {
    fontSize: 13,
    color: colors.text.description,
    marginTop: 8,
    lineHeight: 19,
  },
  precio: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 8,
  },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  botonDeshabilitado: {
    backgroundColor: colors.disabled,
  },
  botonTexto: {
    color: colors.text.inverse,
    fontSize: 13,
    fontWeight: '700',
  },
});
