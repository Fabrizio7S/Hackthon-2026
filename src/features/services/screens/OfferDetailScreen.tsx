import { View } from 'react-native';
import { openContact } from '../contact/openContact';
import { offersApi as defaultApi } from '../data';
import { ListLoadError } from '../list/listLoader';
import { ListStateView } from '../list/ListStateView';
import { useListLoader } from '../list/useListLoader';
import { styles } from '../styles/detail.styles';
import { DetailContent } from '../components/OfferDetailContent';
import { type Props, type Detail } from '../model/offerDetail';

async function loadDetail(api: NonNullable<Props['api']>, offerId: string): Promise<Detail[]> {
  const offer = await api.getById(offerId);
  if (!offer.ok) throw new ListLoadError(offer.error.message);
  const summaries = await api.ratingSummaries([offerId]);
  const rating = summaries.ok ? (summaries.data[0] ?? null) : undefined;
  const viewer = api.viewerRating ? await api.viewerRating(offerId) : null;
  const viewerUserId = viewer?.ok ? viewer.data.userId : null;
  const myStars = viewer?.ok && viewer.data.stars ? viewer.data.stars : 0;
  const author = api.getAuthorName ? await api.getAuthorName(offer.data.authorId) : null;
  const authorName = author?.ok ? author.data : null;
  // Se reutilizan los estados del listado con un único elemento.
  return [{ offer: offer.data, rating, viewerUserId, myStars, authorName }];
}

export function OfferDetailScreen({
  offerId,
  userLocation = null,
  api = defaultApi,
  contact = openContact,
  onEdit,
  onRetired,
}: Props) {
  const { state, reload } = useListLoader(() => loadDetail(api, offerId));

  return (
    <View style={styles.screen}>
      <ListStateView
        emptyMessage="Esta oferta ya no está disponible."
        onRetry={() => void reload()}
        state={state}
      >
        {([detail]) => (
          <DetailContent
            api={api}
            contact={contact}
            detail={detail}
            userLocation={userLocation}
            onEdit={onEdit}
            onRetired={onRetired}
          />
        )}
      </ListStateView>
    </View>
  );
}
