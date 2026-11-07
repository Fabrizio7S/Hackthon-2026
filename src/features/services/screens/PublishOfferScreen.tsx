import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { offersApi as defaultApi, newClientRequestId } from '../data';
import type { OffersApi } from '../data/offersApi';
import type { Offer, OfferKind } from '../data/offerTypes';
import { DESCRIPTION_MAX, TITLE_MAX, type OfferErrors } from '../data/offerValidation';
import { useSubmitOnce } from '../submit/useSubmitOnce';
import { colors } from '../theme';

type Props = {
  /** Se llama con la oferta ya guardada en Supabase. */
  onPublished?: (offer: Offer) => void;
  /** Para pruebas; por defecto usa el Supabase compartido. */
  api?: Pick<OffersApi, 'create'>;
};

const KINDS: { value: OfferKind; label: string }[] = [
  { value: 'servicio', label: 'Servicio' },
  { value: 'producto', label: 'Producto' },
];

/**
 * Formulario para publicar una oferta (D16, D17).
 * Ubicación: pendiente de integrar con la de Persona 5; por ahora se publica sin ella.
 */
export function PublishOfferScreen({ onPublished, api = defaultApi }: Props) {
  const [kind, setKind] = useState<OfferKind | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [errors, setErrors] = useState<OfferErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [published, setPublished] = useState<Offer | null>(null);

  // Se conserva entre reintentos para que el servidor reconozca el mismo envío.
  const requestId = useRef(newClientRequestId());

  const { submit, submitting } = useSubmitOnce(async () => {
    setGeneralError(null);
    setErrors({});
    const result = await api.create(
      { kind, title, description, contactPhone, location: null },
      requestId.current,
    );
    if (result.ok) {
      requestId.current = newClientRequestId();
      setErrors({});
      setPublished(result.data);
      onPublished?.(result.data);
      return;
    }
    if (result.error.kind === 'formulario') {
      setErrors(result.error.errors);
    } else {
      setGeneralError(result.error.message);
    }
  });

  function startAnother() {
    setKind(null);
    setTitle('');
    setDescription('');
    setContactPhone('');
    setPublished(null);
  }

  if (published) {
    return (
      <View style={styles.center}>
        <Text accessibilityRole="header" style={styles.title}>
          Oferta publicada
        </Text>
        <Text style={styles.body}>«{published.title}» ya está visible para tus vecinos.</Text>
        <Pressable
          accessibilityLabel="Publicar otra"
          accessibilityRole="button"
          onPress={startAnother}
          style={styles.primary}
        >
          <Text style={styles.primaryText}>Publicar otra</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={styles.title}>
          Publicar oferta
        </Text>

        <Text nativeID="kindLabel" style={styles.label}>
          ¿Qué ofreces?
        </Text>
        <View accessibilityLabelledBy="kindLabel" accessibilityRole="radiogroup" style={styles.row}>
          {KINDS.map((k) => {
            const selected = kind === k.value;
            return (
              <Pressable
                accessibilityLabel={k.label}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={k.value}
                onPress={() => setKind(k.value)}
                style={[styles.choice, selected && styles.choiceSelected]}
              >
                <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{k.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <FieldError message={errors.kind} />

        <Text style={styles.label}>Título</Text>
        <TextInput
          accessibilityLabel="Título"
          maxLength={TITLE_MAX}
          onChangeText={setTitle}
          placeholder="Ej.: Gasfitería a domicilio"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, errors.title && styles.inputError]}
          value={title}
        />
        <Text style={styles.counter}>
          {title.trim().length}/{TITLE_MAX}
        </Text>
        <FieldError message={errors.title} />

        <Text style={styles.label}>Descripción (opcional)</Text>
        <TextInput
          accessibilityLabel="Descripción"
          maxLength={DESCRIPTION_MAX}
          multiline
          onChangeText={setDescription}
          placeholder="Cuenta qué ofreces, horarios o condiciones"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.multiline, errors.description && styles.inputError]}
          textAlignVertical="top"
          value={description}
        />
        <Text style={styles.counter}>
          {description.trim().length}/{DESCRIPTION_MAX}
        </Text>
        <FieldError message={errors.description} />

        <Text style={styles.label}>Teléfono o WhatsApp</Text>
        <TextInput
          accessibilityLabel="Teléfono o WhatsApp"
          autoComplete="tel"
          keyboardType="phone-pad"
          onChangeText={setContactPhone}
          placeholder="987 654 321"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, errors.contactPhone && styles.inputError]}
          value={contactPhone}
        />
        <Text style={styles.hint}>Los vecinos que vean tu oferta verán este número completo.</Text>
        <FieldError message={errors.contactPhone} />

        {generalError && (
          <Text accessibilityRole="alert" style={styles.generalError}>
            {generalError}
          </Text>
        )}

        <Pressable
          accessibilityLabel={submitting ? 'Publicando' : 'Publicar'}
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting, busy: submitting }}
          disabled={submitting}
          onPress={() => void submit()}
          style={[styles.primary, submitting && styles.primaryDisabled]}
        >
          <Text style={styles.primaryText}>{submitting ? 'Publicando…' : 'Publicar'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" style={styles.fieldError}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: 12 },
  body: { color: colors.text, fontSize: 18, marginBottom: 8, textAlign: 'center' },
  label: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 12 },
  choice: {
    flex: 1,
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 2,
    paddingVertical: 14,
  },
  choiceSelected: { backgroundColor: colors.primarySurface, borderColor: colors.primary },
  choiceText: { color: colors.text, fontSize: 17 },
  choiceTextSelected: { fontWeight: '700' },
  input: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 17,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  multiline: { minHeight: 110 },
  inputError: { borderColor: colors.danger, borderWidth: 2 },
  counter: { alignSelf: 'flex-end', color: colors.textMuted, fontSize: 13, marginTop: 4 },
  hint: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  fieldError: { color: colors.danger, fontSize: 15, marginTop: 4 },
  generalError: {
    backgroundColor: colors.dangerSurface,
    borderRadius: 8,
    color: colors.danger,
    fontSize: 16,
    marginTop: 20,
    padding: 12,
  },
  primary: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 10,
    marginTop: 24,
    paddingVertical: 16,
  },
  primaryDisabled: { opacity: 0.6 },
  primaryText: { color: colors.onPrimary, fontSize: 18, fontWeight: '700' },
});
