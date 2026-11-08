import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { OfferKind } from '../data/offerTypes';
import { DESCRIPTION_MAX, TITLE_MAX, type OfferErrors } from '../data/offerValidation';
import { colors } from '../theme';

/** Valores que escribe el vecino; la ubicación se integrará con Persona 5. */
export type OfferFormValues = {
  kind: OfferKind | null;
  title: string;
  description: string;
  contactPhone: string;
};

export const EMPTY_OFFER_FORM: OfferFormValues = { kind: null, title: '', description: '', contactPhone: '' };

type Props = {
  values: OfferFormValues;
  onChange: (patch: Partial<OfferFormValues>) => void;
  errors: OfferErrors;
  /** En edición el tipo no se puede cambiar (D19). */
  kindLocked?: boolean;
};

const KINDS: { value: OfferKind; label: string }[] = [
  { value: 'servicio', label: 'Servicio' },
  { value: 'producto', label: 'Producto' },
];

/** Campos de una oferta, compartidos por publicar y editar (D16, D17, D19). */
export function OfferFormFields({ values, onChange, errors, kindLocked = false }: Props) {
  return (
    <>
      <Text nativeID="kindLabel" style={formStyles.label}>
        {kindLocked ? 'Tipo (no se puede cambiar)' : '¿Qué ofreces?'}
      </Text>
      <View accessibilityLabelledBy="kindLabel" accessibilityRole="radiogroup" style={styles.row}>
        {KINDS.map((k) => {
          const selected = values.kind === k.value;
          return (
            <Pressable
              accessibilityLabel={k.label}
              accessibilityRole="radio"
              aria-checked={selected}
              aria-disabled={kindLocked}
              disabled={kindLocked}
              key={k.value}
              onPress={() => onChange({ kind: k.value })}
              style={[styles.choice, selected && styles.choiceSelected, kindLocked && !selected && styles.choiceLocked]}
            >
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{k.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <FieldError message={errors.kind} />

      <Text style={formStyles.label}>Título</Text>
      <TextInput
        accessibilityLabel="Título"
        maxLength={TITLE_MAX}
        onChangeText={(title) => onChange({ title })}
        placeholder="Ej.: Gasfitería a domicilio"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, errors.title && styles.inputError]}
        value={values.title}
      />
      <Text style={styles.counter}>
        {values.title.trim().length}/{TITLE_MAX}
      </Text>
      <FieldError message={errors.title} />

      <Text style={formStyles.label}>Descripción (opcional)</Text>
      <TextInput
        accessibilityLabel="Descripción"
        maxLength={DESCRIPTION_MAX}
        multiline
        onChangeText={(description) => onChange({ description })}
        placeholder="Cuenta qué ofreces, horarios o condiciones"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, styles.multiline, errors.description && styles.inputError]}
        textAlignVertical="top"
        value={values.description}
      />
      <Text style={styles.counter}>
        {values.description.trim().length}/{DESCRIPTION_MAX}
      </Text>
      <FieldError message={errors.description} />

      <Text style={formStyles.label}>Teléfono o WhatsApp</Text>
      <TextInput
        accessibilityLabel="Teléfono o WhatsApp"
        autoComplete="tel"
        keyboardType="phone-pad"
        onChangeText={(contactPhone) => onChange({ contactPhone })}
        placeholder="987 654 321"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, errors.contactPhone && styles.inputError]}
        value={values.contactPhone}
      />
      <Text style={styles.hint}>Los vecinos que vean tu oferta verán este número completo.</Text>
      <FieldError message={errors.contactPhone} />
    </>
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

/** Estilos comunes de las pantallas de formulario de G02. */
export const formStyles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: 12 },
  body: { color: colors.text, fontSize: 18, marginBottom: 8, textAlign: 'center' },
  label: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 6 },
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

const styles = StyleSheet.create({
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
  choiceLocked: { opacity: 0.5 },
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
});
