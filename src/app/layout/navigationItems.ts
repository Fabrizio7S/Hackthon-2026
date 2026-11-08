import { type IconName } from '../../shared/ui/AppIcon';
import { type NeighborhoodSection } from '../../shared/navigation/contracts';

export const destinations: { key: NeighborhoodSection; label: string; icon: IconName }[] = [
  { key: 'inicio', label: 'Inicio', icon: 'home' },
  { key: 'servicios', label: 'Servicios', icon: 'services' },
  { key: 'favores', label: 'Favores', icon: 'chain' },
  { key: 'mapa', label: 'Mapa', icon: 'map' },
  { key: 'comunidad', label: 'Perfil', icon: 'person' },
];
