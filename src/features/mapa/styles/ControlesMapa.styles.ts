
import { StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';

export const styles = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    zIndex: 10,
  },
  buscador: {
    backgroundColor: colors.background,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 50,
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  iconoBusqueda: {
    marginRight: 10,
  },
  entrada: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  filtros: {
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  filtro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 13,
    minHeight: 38,
    elevation: 3,
  },
  filtroActivo: {
    backgroundColor: colors.text.primary,
  },
  punto: {
    width: 8,
    height: 8,
  },
  textoFiltro: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  textoFiltroActivo: {
    color: colors.text.inverse,
  },
});

