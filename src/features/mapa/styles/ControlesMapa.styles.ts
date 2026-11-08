
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
    height: 48,
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  iconoBusqueda: {
    fontSize: 27,
    color: colors.primary,
    marginRight: 8,
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
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    elevation: 3,
  },
  filtroActivo: {
    backgroundColor: colors.primary,
  },
  textoFiltro: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  textoFiltroActivo: {
    color: colors.text.inverse,
  },
});

