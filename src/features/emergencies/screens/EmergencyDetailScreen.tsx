import { useCallback, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors } from '../../../shared/theme';
import { newClientRequestId, type EmergenciesApi } from '../data/emergenciesApi';
import type { Result } from '../model/errors';
import { useResource } from '../hooks/useResource';
import { formatRelative, validateNote, type StatusAction } from '../model/logic';
import { STATUS_LABELS } from '../model/types';
import { Banner, Button, StateView, shared, type Tone } from '../components/ui';
import { AppIcon } from '../../../shared/ui/AppIcon';
import { locationNote, Header } from '../components/EmergencyHeader';
import { StatusActions } from '../components/StatusActions';
import { OffersSection } from '../components/OffersSection';
import { HelpSection } from '../components/HelpSection';
import { styles } from '../styles/detail.styles';

type Props = {
  api: EmergenciesApi;
  emergencyId: string;
  onBack: () => void;
  /** Avisa a la lista que algo cambió para que se recargue. */
  onChanged: () => void;
  onGoToCommunity?: () => void;
};

export function EmergencyDetailScreen({
  api,
  emergencyId,
  onBack,
  onChanged,
  onGoToCommunity,
}: Props) {
  const { state, reload } = useResource(
    useCallback(() => api.loadDetail(emergencyId), [api, emergencyId]),
  );
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
    void run(
      () => api.changeStatus(emergencyId, action.to),
      `Estado actualizado: ${STATUS_LABELS[action.to]}.`,
    );
  };

  const sendOffer = () => {
    const problem = validateNote(note);
    if (problem) {
      setMessage({ tone: 'danger', text: problem });
      return;
    }
    void run(
      () => api.offerHelp(emergencyId, note.trim(), offerRequestId.current),
      'Ofrecimiento enviado. El autor o el representante te responderán.',
      () => {
        setNote('');
        offerRequestId.current = newClientRequestId();
      },
    );
  };

  return (
    <ScrollView
      style={shared.screen}
      contentContainerStyle={shared.content}
      keyboardShouldPersistTaps="handled"
    >
      <Button label="← Volver a las alertas" kind="outline" onPress={onBack} />
      <StateView
        state={state}
        onRetry={() => void reload()}
        onGoToCommunity={onGoToCommunity}
        emptyMessage="Este reporte ya no está disponible."
      >
        {(detail) => (
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
                  Este reporte involucra a una persona vulnerable. Por su privacidad, solo lo ven
                  completo quien lo reportó, el representante de la comunidad y quienes ya están
                  ayudando. La ubicación se muestra aproximada (alrededor de 1 km).
                </Text>
              </View>
            ) : (
              <View style={shared.card}>
                <Text style={shared.label}>Qué pasa</Text>
                <Text style={shared.body}>{detail.description}</Text>
                <Text style={shared.subtitle}>
                  {detail.authorName
                    ? `Reportado por ${detail.authorName}`
                    : 'Reportado por un vecino'}{' '}
                  · {formatRelative(detail.createdAt)}
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
                •{' '}
                {detail.attendedAt
                  ? `En atención desde ${formatRelative(detail.attendedAt)}`
                  : 'Aún sin atender'}
              </Text>
              {detail.closedAt ? (
                <Text style={shared.body}>• Solucionada {formatRelative(detail.closedAt)}</Text>
              ) : null}
            </View>

            {detail.canManage ? (
              <StatusActions
                detail={detail}
                busy={busy}
                pendingConfirm={pendingConfirm}
                onChoose={(action) =>
                  action.confirm ? setPendingConfirm(action) : changeStatus(action)
                }
                onConfirm={changeStatus}
                onCancel={() => setPendingConfirm(null)}
              />
            ) : null}

            {detail.canManage ? (
              <OffersSection
                offers={detail.offers}
                busy={busy}
                closed={detail.status === 'solucionado'}
                onAccept={(id) =>
                  void run(
                    () => api.resolveOffer(id, true),
                    'Ofrecimiento aceptado. El reporte pasa a «En atención».',
                  )
                }
                onReject={(id) =>
                  void run(() => api.resolveOffer(id, false), 'Ofrecimiento rechazado.')
                }
              />
            ) : null}

            {!detail.canManage && detail.status !== 'solucionado' ? (
              <HelpSection
                detail={detail}
                note={note}
                busy={busy}
                onNote={setNote}
                onOffer={sendOffer}
                onWithdraw={(id) =>
                  void run(() => api.withdrawOffer(id), 'Retiraste tu ofrecimiento.')
                }
              />
            ) : null}

            {!detail.canManage && detail.status === 'solucionado' ? (
              <Banner
                tone="success"
                text="Este reporte ya fue solucionado. Gracias a quienes ayudaron."
              />
            ) : null}

            <Button
              label="Actualizar"
              kind="outline"
              onPress={() => void reload({ silent: true })}
              disabled={busy}
            />
          </>
        )}
      </StateView>
    </ScrollView>
  );
}
