import { Text, View } from 'react-native';
import { formatRelative } from '../model/logic';
import { OFFER_STATUS_LABELS, type SupportOffer } from '../model/types';
import { Badge, Button, shared } from './ui';
import { OFFER_TONE } from '../model/presentation';
import { styles } from '../styles/detail.styles';

export function OffersSection({
  offers,
  busy,
  closed,
  onAccept,
  onReject,
}: {
  offers: SupportOffer[];
  busy: boolean;
  closed: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <View style={shared.card}>
      <Text style={shared.label}>Vecinos que ofrecen ayuda ({offers.length})</Text>
      {offers.length === 0 ? (
        <Text style={shared.subtitle}>Todavía nadie ofreció ayuda.</Text>
      ) : null}
      {offers.map((offer) => (
        <View key={offer.id} style={styles.offer}>
          <View style={shared.row}>
            <Text style={shared.body}>{offer.helperName}</Text>
            <Badge text={OFFER_STATUS_LABELS[offer.status]} tone={OFFER_TONE[offer.status]} />
          </View>
          {offer.note ? <Text style={shared.body}>“{offer.note}”</Text> : null}
          <Text style={shared.subtitle}>{formatRelative(offer.createdAt)}</Text>
          {offer.status === 'ofrecido' && !closed ? (
            <View style={shared.row}>
              <Button
                label="Aceptar ayuda"
                onPress={() => onAccept(offer.id)}
                disabled={busy}
                accessibilityLabel={`Aceptar la ayuda de ${offer.helperName}`}
              />
              <Button
                label="Rechazar"
                kind="outline"
                onPress={() => onReject(offer.id)}
                disabled={busy}
                accessibilityLabel={`Rechazar la ayuda de ${offer.helperName}`}
              />
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}
