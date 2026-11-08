import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../../shared/theme';
import { newClientRequestId, type EmergenciesApi } from './emergenciesApi';
import type { Result } from './errors';
import { useResource } from './hooks';
import { formatRelative, nextStatuses, validateNote, type StatusAction } from './logic';
import {
  CATEGORY_OPTIONS,
  LEVEL_OPTIONS,
  NOTE_MAX,
  OFFER_STATUS_LABELS,
  STATUS_LABELS,
  type EmergencyDetail,
  type EmergencyStatus,
  type OfferStatus,
  type SupportOffer,
} from './types';
import { ArchIcon, Badge, Banner, Button, StateView, shared, type Tone } from './ui';
import { AppIcon } from '../../shared/AppIcon';

const OFFER_TONE: Record<OfferStatus, Tone> = { ofrecido: 'warning', aceptado: 'success', rechazado: 'neutral', retirado: 'neutral' };
const STATUS_TONE: Record<EmergencyStatus, Tone> = { abierta: 'danger', en_atencion: 'warning', solucionado: 'success' };

type Props = {
  api: EmergenciesApi;
  emergencyId: string;
  onBack: () => void;
  /** Avisa a la lista que algo cambió para que se recargue. */
  onChanged: () => void;
  onGoToCommunity?: () => void;
};

export function EmergencyDetailScreen({ api, emergencyId, onBack, onChanged, onGoToCommunity }: Props) {
  const { state, reload } = useResource(useCallback(() => api.loadDetail(emergencyId), [api, emergencyId]));
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState<{ tone: Tone; text: string } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<StatusAction | null>(null);
  const [note, setNote] = useState('');
  const offerRequestId = useRef(newClientRequestId());

  // Una sola acción a la vez: evita dobles toques y respuestas cruzadas.
  async function run<T>(action: () => Promise<Result<T>>, success: string, afterOk?: () => void) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setMessage(null);
    const result = await action();
    if (result.ok) {
      setMessage({ tone: 'success', text: success });
      afterOk?.();
      onChanged();
    } else {
      setMessage({ tone: 'danger', text: result.error.message });
    }
    // Siempre se vuelve a leer del servidor: lo que se ve es lo que quedó registrado.
    await reload({ silent: true });
    busyRef.current = false;
    setBusy(false);
  }

  const changeStatus = (action: StatusAction) => {
    setPendingConfirm(null);
    void run(() => api.changeStatus(emergencyId, action.to), `Estado actualizado: ${STATUS_LABELS[action.to]}.`);
  };

  const sendOffer = () => {
    const problem = validateNote(note);
    if (problem) { setMessage({ tone: 'danger', text: problem }); return; }
    void run(
      () => api.offerHelp(emergencyId, note.trim(), offerRequestId.current),
      'Ofrecimiento enviado. El autor o el representante te responderán.',
      () => { setNote(''); offerRequestId.current = newClientRequestId(); },
    );
  };

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content} keyboardShouldPersistTaps="handled">
      <Button label="← Volver a las alertas" kind="outline" onPress={onBack} />
      <StateView
        state={state}
        onRetry={() => void reload()}
        onGoToCommunity={onGoToCommunity}
        emptyMessage="Este reporte ya no está disponible."
      >
        {detail => (
          <>
            <Header detail={detail} />

            {message ? <Banner tone={message.tone} text={message.text} /> : null}

            {detail.restricted ? (
              <View style={[shared.card, styles.lock]} accessibilityLabel="Detalle reservado">
                <View style={shared.row}>
                  <AppIcon name="lock" size={20} color={colors.text} />
                  <Text style={shared.title}>Detalle reservado</Text>
                </View>
                <Text style={shared.body}>
                  Este reporte involucra a una persona vulnerable. Por su privacidad, solo lo ven completo quien lo
                  reportó, el representante de la comunidad y quienes ya están ayudando. La ubicación se muestra
                  aproximada (alrededor de 1 km).
                </Text>
              </View>
            ) : (
              <View style={shared.card}>
                <Text style={shared.label}>Qué pasa</Text>
                <Text style={shared.body}>{detail.description}</Text>
                <Text style={shared.subtitle}>
                  {detail.authorName ? `Reportado por ${detail.authorName}` : 'Reportado por un vecino'} · {formatRelative(detail.createdAt)}
                </Text>
              </View>
            )}

            <View style={shared.card}>
              <Text style={shared.label}>Ubicación</Text>
              <Text style={shared.body}>
                {detail.lat !== null && detail.lng !== null
                  ? `${detail.lat.toFixed(detail.approximate ? 2 : 4)}, ${detail.lng.toFixed(detail.approximate ? 2 : 4)}`
                  : 'Sin ubicación registrada'}
              </Text>
              <Text style={shared.subtitle}>{locationNote(detail)}</Text>
            </View>

            <View style={shared.card}>
              <Text style={shared.label}>Seguimiento</Text>
              <Text style={shared.body}>• Reportada {formatRelative(detail.createdAt)}</Text>
              <Text style={shared.body}>
                • {detail.attendedAt ? `En atención desde ${formatRelative(detail.attendedAt)}` : 'Aún sin atender'}
              </Text>
              {detail.closedAt ? <Text style={shared.body}>• Solucionada {formatRelative(detail.closedAt)}</Text> : null}
            </View>

            {detail.canManage ? (
              <StatusActions
                detail={detail}
                busy={busy}
                pendingConfirm={pendingConfirm}
                onChoose={action => (action.confirm ? setPendingConfirm(action) : changeStatus(action))}
                onConfirm={changeStatus}
                onCancel={() => setPendingConfirm(null)}
              />
            ) : null}

            {detail.canManage ? (
              <OffersSection
                offers={detail.offers}
                busy={busy}
                closed={detail.status === 'solucionado'}
                onAccept={id => void run(() => api.resolveOffer(id, true), 'Ofrecimiento aceptado. El reporte pasa a «En atención».')}
                onReject={id => void run(() => api.resolveOffer(id, false), 'Ofrecimiento rechazado.')}
              />
            ) : null}

            {!detail.canManage && detail.status !== 'solucionado' ? (
              <HelpSection
                detail={detail}
                note={note}
                busy={busy}
                onNote={setNote}
                onOffer={sendOffer}
                onWithdraw={id => void run(() => api.withdrawOffer(id), 'Retiraste tu ofrecimiento.')}
              />
            ) : null}

            {!detail.canManage && detail.status === 'solucionado' ? (
              <Banner tone="success" text="Este reporte ya fue solucionado. Gracias a quienes ayudaron." />
            ) : null}

            <Button label="Actualizar" kind="outline" onPress={() => void reload({ silent: true })} disabled={busy} />
          </>
        )}
      </StateView>
    </ScrollView>
  );
}

function locationNote(detail: EmergencyDetail): string {
  if (detail.restricted) return 'Ubicación aproximada por privacidad.';
  if (detail.locationOrigin === 'zona_comunidad') return 'Aproximada: se usó el centro de la zona de la comunidad.';
  if (detail.locationOrigin === 'dispositivo') return 'Tomada del dispositivo de quien reportó.';
  return 'No se sabe cómo se obtuvo esta ubicación.';
}

function Header({ detail }: { detail: EmergencyDetail }) {
  const category = CATEGORY_OPTIONS.find(c => c.value === detail.category);
  const level = LEVEL_OPTIONS.find(l => l.value === detail.level);
  return (
    <View style={shared.card}>
      <View style={[shared.row, { gap: 12 }]}>
        <ArchIcon icon={category?.icon} />
        <Text style={styles.heading}>{category?.label}</Text>
      </View>
      <View style={shared.row}>
        <Badge text={STATUS_LABELS[detail.status]} tone={STATUS_TONE[detail.status]} />
        <Badge text={`Urgencia ${level?.label.toLowerCase()}`} tone={detail.level === 'critica' ? 'danger' : detail.level === 'alta' ? 'warning' : 'neutral'} />
        {detail.vulnerable ? <Badge text="Persona vulnerable" tone="warning" /> : null}
        {detail.mine ? <Badge text="Tu reporte" tone="neutral" /> : null}
        {detail.isDemo ? <Badge text="Datos de demostración" tone="demo" /> : null}
      </View>
      {detail.isDemo ? <Text style={shared.subtitle}>Es un ejemplo de demostración, no una emergencia real.</Text> : null}
    </View>
  );
}

function StatusActions({ detail, busy, pendingConfirm, onChoose, onConfirm, onCancel }: {
  detail: EmergencyDetail;
  busy: boolean;
  pendingConfirm: StatusAction | null;
  onChoose: (action: StatusAction) => void;
  onConfirm: (action: StatusAction) => void;
  onCancel: () => void;
}) {
  const actions = nextStatuses(detail.status, detail.canManage);
  if (actions.length === 0) {
    return <Banner tone="success" text="Este reporte está cerrado. No se puede reabrir." />;
  }
  return (
    <View style={shared.card}>
      <Text style={shared.label}>Atender o cerrar</Text>
      <Text style={shared.subtitle}>Puedes hacerlo porque reportaste esto o representas a la comunidad.</Text>
      {pendingConfirm ? (
        <View style={shared.card}>
          <Text style={shared.body}>{pendingConfirm.confirm}</Text>
          <View style={shared.row}>
            <Button label="Sí, confirmar" onPress={() => onConfirm(pendingConfirm)} busy={busy} />
            <Button label="Cancelar" kind="outline" onPress={onCancel} disabled={busy} />
          </View>
        </View>
      ) : (
        <View style={shared.row}>
          {actions.map(action => (
            <Button
              key={action.to}
              label={action.label}
              kind={action.to === 'solucionado' ? 'primary' : 'outline'}
              onPress={() => onChoose(action)}
              disabled={busy}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function OffersSection({ offers, busy, closed, onAccept, onReject }: {
  offers: SupportOffer[];
  busy: boolean;
  closed: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <View style={shared.card}>
      <Text style={shared.label}>Vecinos que ofrecen ayuda ({offers.length})</Text>
      {offers.length === 0 ? <Text style={shared.subtitle}>Todavía nadie ofreció ayuda.</Text> : null}
      {offers.map(offer => (
        <View key={offer.id} style={styles.offer}>
          <View style={shared.row}>
            <Text style={shared.body}>{offer.helperName}</Text>
            <Badge text={OFFER_STATUS_LABELS[offer.status]} tone={OFFER_TONE[offer.status]} />
          </View>
          {offer.note ? <Text style={shared.body}>“{offer.note}”</Text> : null}
          <Text style={shared.subtitle}>{formatRelative(offer.createdAt)}</Text>
          {offer.status === 'ofrecido' && !closed ? (
            <View style={shared.row}>
              <Button label="Aceptar ayuda" onPress={() => onAccept(offer.id)} disabled={busy} accessibilityLabel={`Aceptar la ayuda de ${offer.helperName}`} />
              <Button label="Rechazar" kind="outline" onPress={() => onReject(offer.id)} disabled={busy} accessibilityLabel={`Rechazar la ayuda de ${offer.helperName}`} />
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function HelpSection({ detail, note, busy, onNote, onOffer, onWithdraw }: {
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
        <Button label="Retirar mi ofrecimiento" kind="outline" onPress={() => onWithdraw(mine.id)} disabled={busy} />
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
      <Text style={shared.subtitle}>{note.trim().length}/{NOTE_MAX}</Text>
      <Button label="Ofrecer ayuda" onPress={onOffer} busy={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  lock: { borderColor: '#F59E0B', backgroundColor: '#FFF8EB' },
  offer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 6 },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
});
