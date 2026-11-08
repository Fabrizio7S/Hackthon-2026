
import { StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';

/**
 * Estilos de la pantalla principal del mapa.
 * Se mantienen separados de la lógica
 * y de los componentes visuales.
 */
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  map: {
    flex: 1,
  },

  aviso: {
    position: 'absolute',
    top: 125,
    left: 14,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.background,
    elevation: 4,
  },

  filaAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoAviso: {
    marginVertical: 6,
    marginHorizontal: 8,
    textAlign: 'center',
    fontSize: 12,
    color: colors.text.dark,
  },

  etiquetaDemo: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
    elevation: 3,
  },

  textoDemo: {
    fontSize: 11,
    color: colors.text.muted,
  },

  botonUbicacion: {
    position: 'absolute',
    right: 16,
    bottom: 90,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    zIndex: 5,
  },

  iconoUbicacion: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
});
