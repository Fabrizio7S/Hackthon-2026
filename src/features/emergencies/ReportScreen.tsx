import { TourTarget, TourScrollView } from '../../shared/TourTargets';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { colors } from '../../shared/theme';
import { newClientRequestId } from './emergenciesApi';
import type { ReportOutbox } from './hooks';
import {
  resolveReportLocation,
  validateReport,
  type ReportErrors,
  type ReportForm,
} from './logic';
import { PendingList } from './PendingList';
import {
  CATEGORY_OPTIONS,
  DESCRIPTION_MAX,
  LEVEL_OPTIONS,
  type CommunityZone,
} from './types';
import { Banner, Button, Chip, shared } from './ui';

type Result =
  | { kind: 'enviado'; duplicate: boolean }
  | { kind: 'pendiente'; message: string; saved: boolean }
  | { kind: 'error'; message: string };

const EMPTY: ReportForm = { category: null, level: null, description: '', vulnerable: false };

type Props = {
  outbox: ReportOutbox;
  zone: CommunityZone | null;
  /** Ubicación del dispositivo cuando Persona 5 la provee; si no, se usa la zona de la comunidad. */
  userLocation?: { latitude: number; longitude: number } | null;
  onViewAlerts: () => void;
};

export function ReportScreen({ outbox, zone, userLocation, onViewAlerts }: Props) {
  const [form, setForm] = useState<ReportForm>(EMPTY);
  const [errors, setErrors] = useState<ReportErrors>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const sendingRef = useRef(false);
  // Se conserva entre intentos: reenviar el mismo formulario no crea un reporte duplicado.
  const requestId = useRef(newClientRequestId());

  const location = useMemo(() => resolveReportLocation(userLocation, zone), [userLocation, zone]);

  const update = (patch: Partial<ReportForm>) => {
    setForm(previous => ({ ...previous, ...patch }));
    setErrors({});
    // Cambiar el contenido después de un error del servidor es un reporte nuevo.
    if (result?.kind === 'error') setResult(null);
  };

  async function submit() {
    if (sendingRef.current) return; // evita doble envío por doble toque
    const checked = validateReport(form, location);
    if (!checked.ok) { setErrors(checked.errors); return; }

    sendingRef.current = true;
    setBusy(true);
    setResult(null);
    const outcome = await outbox.submit({ ...checked.report, clientRequestId: requestId.current });

    if (outcome.state === 'enviado') {
      setResult({ kind: 'enviado', duplicate: outcome.duplicate });
      setForm(EMPTY);
      requestId.current = newClientRequestId();
    } else if (outcome.state === 'pendiente') {
      setResult({ kind: 'pendiente', message: outcome.message, saved: outcome.saved });
      if (outcome.saved) {
        // Ya quedó en la cola con su identificador: el formulario puede limpiarse.
        setForm(EMPTY);
        requestId.current = newClientRequestId();
      }
    } else {
      setResult({ kind: 'error', message: outcome.error.message });
    }
    sendingRef.current = false;
    setBusy(false);
  }

  return (
    <TourScrollView style={shared.screen} contentContainerStyle={shared.content} keyboardShouldPersistTaps="handled">
      <Text style={shared.title}>Reportar una emergencia</Text>
      <Text style={shared.subtitle}>
        Si hay peligro inmediato para la vida, llama primero a los servicios oficiales de tu país. Esta app avisa a tus vecinos; no contacta a los servicios de emergencia.
      </Text>

      {result?.kind === 'enviado' ? (
        <Banner
          tone="success"
          text={result.duplicate
            ? 'Este reporte ya estaba registrado. No se creó uno nuevo.'
            : 'Reporte enviado. Tus vecinos ya pueden verlo.'}
          actionLabel="Ver alertas"
          onAction={onViewAlerts}
        />
      ) : null}
      {result?.kind === 'pendiente' ? (
        <Banner
          tone="warning"
          text={result.saved
            ? `NO se envió todavía. Lo guardamos en tu teléfono y lo enviaremos cuando haya conexión. ${result.message}`
            : `NO se envió y no pudimos guardarlo en tu teléfono. ${result.message} No cierres esta pantalla: toca Enviar de nuevo.`}
        />
      ) : null}
      {result?.kind === 'error' ? <Banner tone="danger" text={`No se pudo enviar. ${result.message}`} /> : null}

      <TourTarget id="report-category" style={shared.card}>
        <Text style={shared.label}>¿Qué pasa?</Text>
        <View style={shared.row}>
          {CATEGORY_OPTIONS.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              icon={option.icon}
              accessibilityLabel={`Tipo: ${option.label}`}
              selected={form.category === option.value}
              onPress={() => update({ category: option.value })}
            />
          ))}
        </View>
        {errors.category ? <Text style={shared.errorText} accessibilityRole="alert">{errors.category}</Text> : null}
      </TourTarget>

      <TourTarget id="report-level" style={shared.card}>
        <Text style={shared.label}>¿Qué tan urgente es?</Text>
        <View style={shared.row}>
          {LEVEL_OPTIONS.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              accessibilityLabel={`Urgencia ${option.label}. ${option.hint}`}
              selected={form.level === option.value}
              onPress={() => update({ level: option.value })}
            />
          ))}
        </View>
        {form.level ? <Text style={shared.subtitle}>{LEVEL_OPTIONS.find(o => o.value === form.level)?.hint}</Text> : null}
        {errors.level ? <Text style={shared.errorText} accessibilityRole="alert">{errors.level}</Text> : null}
      </TourTarget>

      <TourTarget id="report-description" style={shared.card}>
        <Text style={shared.label}>Descripción</Text>
        <TextInput
          style={[shared.input, styles.description]}
          value={form.description}
          onChangeText={description => update({ description })}
          multiline
          maxLength={DESCRIPTION_MAX}
          placeholder="Cuenta qué pasa y dónde, con pocas palabras."
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Descripción del problema"
          editable={!busy}
        />
        <Text style={shared.subtitle}>{form.description.trim().length}/{DESCRIPTION_MAX}</Text>
        {errors.description ? <Text style={shared.errorText} accessibilityRole="alert">{errors.description}</Text> : null}
      </TourTarget>

      <TourTarget id="report-privacy" style={shared.card}>
        <View style={shared.row}>
          <Switch
            value={form.vulnerable}
            onValueChange={vulnerable => update({ vulnerable })}
            accessibilityLabel="Involucra a una persona vulnerable"
            disabled={busy}
          />
          <Text style={[shared.body, styles.grow]}>Involucra a una persona vulnerable</Text>
        </View>
        <Text style={shared.subtitle}>
          Niños, personas mayores, con discapacidad o enfermas. Si lo activas, solo tú, el representante y quienes acepten
          ayudar verán la descripción y tu nombre; los demás verán el reporte sin detalle y con la ubicación aproximada.
        </Text>
      </TourTarget>

      <TourTarget id="report-send" style={{ gap: 12 }}>
      <View style={shared.card}>
        <Text style={shared.label}>Ubicación</Text>
        <Text style={shared.body}>
          {!location
            ? 'Sin ubicación disponible.'
            : location.origin === 'dispositivo'
              ? 'Usaremos la ubicación de tu teléfono.'
              : `Usaremos el centro de tu zona${zone?.name ? ` (${zone.name})` : ''}. Es aproximada.`}
        </Text>
        {errors.location ? <Text style={shared.errorText} accessibilityRole="alert">{errors.location}</Text> : null}
      </View>

      <Button label={busy ? 'Enviando…' : 'Enviar reporte'} kind="danger" onPress={() => void submit()} busy={busy} />
      </TourTarget>

      <PendingList
        entries={outbox.entries}
        busy={busy}
        onRetry={id => void outbox.retry(id)}
        onDiscard={id => void outbox.discard(id)}
      />
    </TourScrollView>
  );
}

const styles = StyleSheet.create({
  description: { minHeight: 110, textAlignVertical: 'top' },
  grow: { flex: 1 },
});
