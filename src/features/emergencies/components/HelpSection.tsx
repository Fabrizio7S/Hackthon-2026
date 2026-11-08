import { Text, TextInput, View } from 'react-native';
import { colors } from '../../../shared/theme';
import { NOTE_MAX, OFFER_STATUS_LABELS, type EmergencyDetail } from '../model/types';
import { Badge, Banner, Button, shared } from './ui';
import { OFFER_TONE } from '../model/presentation';
import { styles } from '../styles/detail.styles';

export function HelpSection({
  detail,
  note,
  busy,
  onNote,
  onOffer,
  onWithdraw,
}: {
  detail: EmergencyDetail;
  note: string;
  busy: boolean;
  onNote: (value: string) => void;
  onOffer: () => void;
  onWithdraw: (id: string) => void;
}) {
  const mine = detail.myOffer;
  if (mine && (mine.status === 'ofrecido' || mine.status === 'aceptado')) {
    return (
      <View style={shared.card}>
        <Text style={shared.label}>Tu ayuda</Text>
        <Badge text={OFFER_STATUS_LABELS[mine.status]} tone={OFFER_TONE[mine.status]} />
        <Text style={shared.subtitle}>
          {mine.status === 'aceptado'
            ? 'Quien coordina aceptó tu ayuda. Ya puedes ver el detalle completo.'
            : 'Quien coordina el reporte decidirá si acepta tu ayuda.'}
        </Text>
        <Button
          label="Retirar mi ofrecimiento"
          kind="outline"
          onPress={() => onWithdraw(mine.id)}
          disabled={busy}
        />
      </View>
    );
  }
  if (mine?.status === 'rechazado') {
    return <Banner tone="neutral" text="Tu ofrecimiento no fue aceptado esta vez." />;
  }
  return (
    <View style={shared.card}>
      <Text style={shared.label}>¿Puedes ayudar?</Text>
      <Text style={shared.subtitle}>
        Cuéntale a quien coordina qué puedes hacer. No se comparte tu teléfono ni tu ubicación.
      </Text>
      <TextInput
        style={[shared.input, styles.noteInput]}
        value={note}
        onChangeText={onNote}
        multiline
        maxLength={NOTE_MAX}
        placeholder="Ejemplo: tengo un botiquín y puedo ir en 10 minutos"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Nota para ofrecer ayuda"
        editable={!busy}
      />
      <Text style={shared.subtitle}>
        {note.trim().length}/{NOTE_MAX}
      </Text>
      <Button label="Ofrecer ayuda" onPress={onOffer} busy={busy} />
    </View>
  );
}
