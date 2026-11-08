import { Linking } from 'react-native';
import { type Publication } from '../model/types';
import { getOwnerDisplayName } from '../model/presentation';
import type { FavorActionContext } from './types';

export function createContactActions(context: FavorActionContext) {
  const { setContactError } = context;
  function openWhatsApp(item: Publication) {
    const ownerDisplay = getOwnerDisplayName(item);
    const message = encodeURIComponent(
      `Hola, ${ownerDisplay}. Me interesa tu publicación «${item.title}». ¿Podemos coordinar?`,
    );
    setContactError(false);
    void Linking.openURL(`https://wa.me/?text=${message}`).catch(() => setContactError(true));
  }
  return { openWhatsApp };
}
